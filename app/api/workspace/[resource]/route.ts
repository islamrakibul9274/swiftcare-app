import { credentialReminders } from "@/lib/reminders";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { api, body } from "@/lib/api";
import { audit, clientScope, getActor, getClient } from "@/lib/security";
import { AppError } from "@/lib/errors";
import { workspaceData } from "@/lib/workspace";
import { assignedStaff } from "@/lib/clinical";
import { issueAccountToken, sendAccountLink } from "@/lib/accounts";
import { rateLimit } from "@/lib/rate-limit";
import {
  clientSchema,
  goalSchema,
  idSchema,
  inviteSchema,
  profileSchema,
  scheduleSchema,
  sessionPatchSchema,
  staffPatchSchema,
} from "@/lib/validation";
import User from "@/models/User";
import Client from "@/models/Client";
import Session from "@/models/Session";
import Note from "@/models/Note";
import Claim from "@/models/Claim";
import Clinic from "@/models/Clinic";
import Notification from "@/models/Notification";
import Supervision from "@/models/Supervision";
import { AccountToken, LoginSession } from "@/models/Security";
type Context = { params: Promise<{ resource: string }> };
const empty = z.object({}).strict();
export const GET = api(async (request, context: Context) => {
  const { resource } = await context.params;
  const actor = await getActor(
    resource === "audit" ? ["ADMIN"] : undefined,
    resource === "profile",
  );
  if (resource === "overview" || resource === "audit")
    return workspaceData(
      actor,
      resource === "audit",
      resource === "audit" ? "audit" : "overview",
    );
  if (resource === "profile")
    return {
      profile: {
        name: actor.name,
        email: actor.email,
        notificationPreferences: actor.notificationPreferences,
        forcePasswordChange: actor.forcePasswordChange,
      },
    };
  if (resource === "notifications")
    return {
      notifications: await Notification.find({
        clinicId: actor.clinicId,
        userId: actor.id,
      })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
    };
  if (resource === "search") {
    const q = z
      .string()
      .trim()
      .min(2)
      .max(80)
      .parse(new URL(request.url).searchParams.get("q"));
    const expression = new RegExp(
      q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i",
    );
    const clients = await Client.find({
      ...clientScope(actor),
      $or: [
        { firstName: expression },
        { lastName: expression },
        { code: expression },
      ],
    })
      .select("firstName lastName code")
      .limit(8)
      .lean();
    const allIds = (
      await Client.find(clientScope(actor)).select("_id").lean()
    ).map((c) => c._id);
    const notes =
      actor.role === "ADMIN"
        ? []
        : await Note.find({
            clinicId: actor.clinicId,
            clientId: { $in: allIds },
            ...(actor.role === "RBT" ? { rbtId: actor.id } : {}),
            summary: expression,
          })
            .select("clientName status")
            .limit(5)
            .lean();
    const staff =
      actor.role === "ADMIN"
        ? await User.find({
            clinicId: actor.clinicId,
            $or: [{ name: expression }, { email: expression }],
          })
            .select("name role")
            .limit(5)
            .lean()
        : [];
    await audit(actor, "search", "workspace");
    return {
      results: [
        ...clients.map((c) => ({
          label: `${c.firstName} ${c.lastName}`,
          detail: c.code || "Client",
          href: `/clients/${c._id}`,
        })),
        ...notes.map((n) => ({
          label: `${n.clientName} · ${n.status}`,
          detail: "Clinical note",
          href: `${actor.role === "BCBA" ? "/director" : "/tech"}/notes?note=${n._id}`,
        })),
        ...staff.map((s) => ({
          label: s.name,
          detail: s.role,
          href: "/admin/staff",
        })),
      ],
    };
  }
  throw new AppError(404, "This workspace resource is unavailable.");
});
export const POST = api(async (request, context: Context) => {
  const { resource } = await context.params;
  if (resource === "activity") {
    const actor = await getActor(undefined, true);
    await body(request, empty);
    await LoginSession.updateOne(
      { _id: actor.sid, userId: actor.id },
      { $set: { lastActivity: new Date() } },
    );
    return { ok: true };
  }
  if (resource === "reminders") {
    const actor = await getActor(["ADMIN"]);
    await body(request, empty);
    const result = await credentialReminders(actor.clinicId);
    await audit(actor, "trigger_reminders", "staff");
    return { message: "Credential reminders checked.", ...result };
  }
  if (resource === "exports") {
    const actor = await getActor();
    const data = await body(
      request,
      z
        .object({
          resource: z.enum(["notes", "billing", "clients"]),
          ids: z.array(idSchema).max(250),
        })
        .strict(),
    );
    const clients = await Client.find(clientScope(actor)).select("_id").lean();
    const ids = clients.map((c) => c._id);
    let count = 0;
    if (data.resource === "billing") {
      if (actor.role !== "ADMIN")
        throw new AppError(403, "Financial exports require Admin access.");
      count = await Claim.countDocuments({
        _id: { $in: data.ids },
        clinicId: actor.clinicId,
      });
    } else if (data.resource === "notes") {
      if (actor.role === "ADMIN")
        throw new AppError(
          403,
          "Clinical note exports require a clinical role.",
        );
      count = await Note.countDocuments({
        _id: { $in: data.ids },
        clinicId: actor.clinicId,
        clientId: { $in: ids },
        ...(actor.role === "RBT" ? { rbtId: actor.id } : {}),
      });
    } else
      count = await Client.countDocuments({
        ...clientScope(actor),
        _id: { $in: data.ids },
      });
    if (count !== new Set(data.ids).size)
      throw new AppError(404, "One or more records are unavailable.");
    await audit(actor, "export", data.resource, data.ids.join(","));
    return { message: "Export recorded." };
  }
  if (resource === "staff") {
    const actor = await getActor(["ADMIN"]);
    const data = await body(request, inviteSchema);
    await rateLimit(`invite:${actor.id}`, 20, 3600000);
    if (await User.exists({ email: data.email }))
      throw new AppError(
        409,
        "This email cannot be invited. Check the address or manage its existing account.",
      );
    const hash = await bcrypt.hash(randomBytes(32).toString("hex"), 12);
    let userId = "";
    let link = "";
    await mongoose.connection.transaction(async (transaction) => {
      const [user] = await User.create(
        [
          {
            ...data,
            clinicId: actor.clinicId,
            clinicName: actor.clinicName,
            active: false,
            forcePasswordChange: true,
            password: hash,
          },
        ],
        { session: transaction },
      );
      userId = String(user._id);
      link = await issueAccountToken(userId, "INVITE", transaction);
      await audit(actor, "invite", "staff", userId, transaction);
    });
    let delivered = false;
    try {
      delivered = await sendAccountLink(data.email, link, "INVITE");
    } catch {
      /* Link remains available for authorized manual delivery. */
    }
    return {
      message: delivered
        ? "Invitation sent."
        : "Invitation created. Share this secure one-time link with the staff member.",
      link,
      userId,
      delivered,
    };
  }
  if (resource === "clients") {
    const actor = await getActor(["ADMIN", "BCBA"]);
    const data = await body(request, clientSchema);
    if (actor.role === "BCBA" && data.assignedBCBA !== actor.id)
      throw new AppError(
        403,
        "You can create clients only in your own caseload.",
      );
    await assignedStaff(actor, [data.assignedBCBA], "BCBA");
    await assignedStaff(actor, data.assignedRBTs, "RBT");
    if (
      new Set(data.targetBehaviors.map((t) => t.name)).size !==
        data.targetBehaviors.length ||
      new Set(data.goals.map((g) => g.name)).size !== data.goals.length ||
      data.goals.some(
        (g) => !data.targetBehaviors.some((t) => t.name === g.name),
      )
    )
      throw new AppError(
        400,
        "Use unique observation targets and link each goal to a configured target.",
      );
    const client = await Client.create({ ...data, clinicId: actor.clinicId });
    await audit(actor, "create", "client", String(client._id));
    return { client, message: "Client added to the clinic." };
  }
  if (resource === "sessions") {
    const actor = await getActor();
    const data = await body(request, scheduleSchema);
    const client = await getClient(actor, data.clientId);
    if (actor.role === "RBT" && data.technicianId !== actor.id)
      throw new AppError(
        403,
        "You can schedule only your own assigned sessions.",
      );
    if (!client.assignedRBTs.some((id) => String(id) === data.technicianId))
      throw new AppError(400, "Choose an RBT assigned to this client.");
    await assignedStaff(actor, [data.technicianId], "RBT");
    let scheduled;
    await mongoose.connection.transaction(async (transaction) => {
      // Serialize booking checks per clinic so concurrent requests cannot both pass.
      await Clinic.findOneAndUpdate(
        { _id: actor.clinicId },
        {
          $inc: { bookingVersion: 1 },
          $setOnInsert: { name: actor.clinicName },
        },
        { upsert: true, session: transaction },
      );
      const conflict = await Session.exists({
        clinicId: actor.clinicId,
        status: { $nin: ["CANCELLED"] },
        date: { $lt: new Date(data.scheduledEnd) },
        scheduledEnd: { $gt: new Date(data.date) },
        $or: [{ technician: data.technicianId }, { client: data.clientId }],
      }).session(transaction);
      if (conflict)
        throw new AppError(
          409,
          "This client or technician already has a session at that time.",
          "SCHEDULE_CONFLICT",
        );
      [scheduled] = await Session.create(
        [
          {
            clinicId: actor.clinicId,
            client: client._id,
            technician: data.technicianId,
            date: data.date,
            scheduledEnd: data.scheduledEnd,
            status: "SCHEDULED",
            behaviorData: client.targetBehaviors.map((b) => ({
              behaviorName: b.name,
              frequency: 0,
            })),
          },
        ],
        { session: transaction },
      );
      await audit(
        actor,
        "schedule",
        "session",
        String(scheduled._id),
        transaction,
      );
    });
    return { session: scheduled, message: "Session scheduled." };
  }
  if (resource === "supervision") {
    const actor = await getActor(["BCBA"]);
    const data = await body(
      request,
      z
        .object({
          technicianId: idSchema,
          date: z.iso.datetime(),
          minutes: z.number().int().min(1).max(480),
          sessionId: idSchema.optional(),
          observation: z.string().trim().min(5).max(2000),
        })
        .strict(),
    );
    if (+new Date(data.date) > Date.now())
      throw new AppError(400, "Record supervision after it takes place.");
    if (
      !(await Client.exists({
        ...clientScope(actor),
        assignedRBTs: data.technicianId,
      }))
    )
      throw new AppError(403, "Choose a technician from your caseload.");
    if (data.sessionId) {
      const observed = await Session.findOne({
        _id: data.sessionId,
        clinicId: actor.clinicId,
        technician: data.technicianId,
        status: "COMPLETED",
      });
      if (!observed)
        throw new AppError(404, "This observed session is unavailable.");
      await getClient(actor, String(observed.client));
      if (data.minutes > observed.durationMinutes)
        throw new AppError(
          400,
          "Observed minutes cannot exceed the session duration.",
        );
    }
    const record = await Supervision.create({
      clinicId: actor.clinicId,
      supervisor: actor.id,
      technician: data.technicianId,
      date: data.date,
      minutes: data.minutes,
      sessionId: data.sessionId,
      observation: data.observation,
    });
    await audit(actor, "record", "supervision", String(record._id));
    return { message: "Supervision recorded." };
  }
  throw new AppError(404, "This workspace action is unavailable.");
});
export const PATCH = api(async (request, context: Context) => {
  const { resource } = await context.params;
  if (resource === "staff") {
    const actor = await getActor(["ADMIN"]);
    const data = await body(request, staffPatchSchema);
    if (
      data.id === actor.id &&
      (data.active !== undefined || data.role !== undefined)
    )
      throw new AppError(400, "Another administrator must change your access.");
    const user = await User.findOne({ _id: data.id, clinicId: actor.clinicId });
    if (!user) throw new AppError(404, "This staff account is unavailable.");
    if (
      ((data.role && data.role !== user.role) || data.active === false) &&
      user.role === "BCBA" &&
      (await Client.exists({
        clinicId: actor.clinicId,
        assignedBCBA: user._id,
        active: { $ne: false },
      }))
    )
      throw new AppError(
        409,
        "Reassign this BCBA's active clients before changing their access.",
      );
    if (data.reset) {
      const link = await issueAccountToken(
        data.id,
        user.active === false && user.forcePasswordChange ? "INVITE" : "RESET",
      );
      await audit(actor, "issue_reset", "staff", data.id);
      return {
        link,
        message: "Share this secure reset link. It expires in 30 minutes.",
      };
    }
    if (data.role) user.role = data.role;
    if (data.active !== undefined) user.active = data.active;
    if (data.credential !== undefined) user.credential = data.credential;
    if (data.credentialExpiresAt !== undefined)
      user.credentialExpiresAt = data.credentialExpiresAt
        ? new Date(data.credentialExpiresAt)
        : undefined;
    if (data.role || data.active !== undefined)
      user.sessionVersion = (user.sessionVersion ?? 0) + 1;
    await mongoose.connection.transaction(async (transaction) => {
      await user.save({ session: transaction });
      if (data.active === false)
        await AccountToken.updateMany(
          { userId: user._id, usedAt: { $exists: false } },
          { $set: { usedAt: new Date() } },
          { session: transaction },
        );
      await audit(actor, "update_access", "staff", data.id, transaction);
    });
    return {
      message: "Staff account updated. Access changes take effect immediately.",
    };
  }
  if (resource === "profile") {
    const actor = await getActor(undefined, true);
    const data = await body(request, profileSchema);
    const user = await User.findById(actor.id).select("+password");
    if (!user) throw new AppError(401, "Please sign in again.");
    if (user.forcePasswordChange && !data.newPassword)
      throw new AppError(400, "Set a new password before continuing.");
    if (data.newPassword) {
      if (!(await bcrypt.compare(data.currentPassword || "", user.password)))
        throw new AppError(400, "Your current password could not be verified.");
      user.password = await bcrypt.hash(data.newPassword, 12);
      user.forcePasswordChange = false;
      user.sessionVersion = (user.sessionVersion ?? 0) + 1;
    }
    user.name = data.name;
    user.notificationPreferences = data.notificationPreferences;
    await mongoose.connection.transaction(async (transaction) => {
      await user.save({ session: transaction });
      if (data.newPassword)
        await AccountToken.updateMany(
          { userId: user._id, usedAt: { $exists: false } },
          { $set: { usedAt: new Date() } },
          { session: transaction },
        );
      await audit(
        actor,
        data.newPassword ? "change_password" : "update_profile",
        "account",
        actor.id,
        transaction,
      );
    });
    return {
      message: data.newPassword
        ? "Password changed. Please sign in again."
        : "Profile saved.",
      signOut: !!data.newPassword,
    };
  }
  if (resource === "notifications") {
    const actor = await getActor();
    const data = await body(
      request,
      z.object({ id: idSchema.optional() }).strict(),
    );
    await Notification.updateMany(
      {
        clinicId: actor.clinicId,
        userId: actor.id,
        ...(data.id ? { _id: data.id } : {}),
      },
      { $set: { readAt: new Date() } },
    );
    return { message: "Notifications marked as read." };
  }
  if (resource === "clinic") {
    const actor = await getActor(["ADMIN"]);
    const data = await body(
      request,
      z
        .object({
          ratePerUnit: z.number().min(0).max(10000),
          billingCode: z.string().regex(/^\d{5}$/),
        })
        .strict(),
    );
    await Clinic.findOneAndUpdate(
      { _id: actor.clinicId },
      { $set: { ...data, name: actor.clinicName } },
      { upsert: true, runValidators: true },
    );
    await audit(actor, "update_billing_settings", "clinic", actor.clinicId);
    return {
      message: "Billing defaults saved. Existing claims are unchanged.",
    };
  }
  if (resource === "clients") {
    const actor = await getActor(["ADMIN", "BCBA"]);
    const data = await body(
      request,
      z
        .object({
          id: idSchema,
          goals: z.array(goalSchema).max(30),
          assignedBCBA: idSchema,
          assignedRBTs: z.array(idSchema).max(20),
          authorizationHours: z.number().min(0).max(5000),
          authorizationExpiresAt: z.iso.datetime().optional(),
        })
        .strict(),
    );
    const client = await getClient(actor, data.id);
    if (actor.role === "BCBA" && data.assignedBCBA !== actor.id)
      throw new AppError(403, "An administrator must transfer the caseload.");
    await assignedStaff(actor, [data.assignedBCBA], "BCBA");
    await assignedStaff(actor, data.assignedRBTs, "RBT");
    if (
      new Set(data.goals.map((g) => g.name)).size !== data.goals.length ||
      data.goals.some(
        (g) => !client.targetBehaviors.some((t) => t.name === g.name),
      )
    )
      throw new AppError(
        400,
        "Link each goal to a unique configured observation target.",
      );
    client.set({
      goals: data.goals,
      assignedBCBA: data.assignedBCBA,
      assignedRBTs: data.assignedRBTs,
      authorizationHours: data.authorizationHours,
      authorizationExpiresAt: data.authorizationExpiresAt,
    });
    await client.save();
    await audit(actor, "update_treatment_plan", "client", data.id);
    return { message: "Treatment plan and assignments saved." };
  }
  if (resource === "sessions") {
    const actor = await getActor();
    const data = await body(request, sessionPatchSchema);
    const session = await Session.findOne({
      _id: data.id,
      clinicId: actor.clinicId,
    });
    if (!session) throw new AppError(404, "This session is unavailable.");
    const client = await getClient(actor, String(session.client));
    if (
      data.action !== "cancel" &&
      (actor.role !== "RBT" || String(session.technician) !== actor.id)
    )
      throw new AppError(
        403,
        "Only this session's technician can collect data.",
      );
    if (actor.role === "RBT" && String(session.technician) !== actor.id)
      throw new AppError(403, "This session is unavailable.");
    if (session.revision !== data.revision)
      throw new AppError(
        409,
        "A newer session draft exists. Refresh before saving.",
        "CONFLICT",
      );
    if (
      (data.action === "start" && session.status !== "SCHEDULED") ||
      (data.action === "cancel" && session.status !== "SCHEDULED") ||
      (data.action === "complete" && session.status !== "IN_PROGRESS") ||
      (data.action === "save" &&
        !["IN_PROGRESS", "COMPLETED"].includes(session.status))
    )
      throw new AppError(
        409,
        "The session has changed. Refresh before continuing.",
      );
    if (
      data.behaviors &&
      (data.behaviors.length !== client.targetBehaviors.length ||
        new Set(data.behaviors.map((b) => b.name)).size !==
          data.behaviors.length ||
        data.behaviors.some(
          (b) => !client.targetBehaviors.some((t) => t.name === b.name),
        ))
    )
      throw new AppError(
        400,
        "Collect data only for the client's configured targets.",
      );
    if (session.status === "COMPLETED" && (data.behaviors || data.abcData))
      throw new AppError(409, "Completed observation data is locked.");
    if (await Note.exists({ sessionId: session._id, clinicId: actor.clinicId }))
      throw new AppError(
        409,
        "The submitted session is locked. Revise its note through the review workflow.",
      );
    const changes: Record<string, unknown> = {};
    if (data.draftText !== undefined) changes.aiDraftedNote = data.draftText;
    if (data.aiOriginalText !== undefined)
      changes.aiOriginalNote = data.aiOriginalText;
    if (data.aiGenerated !== undefined) changes.aiGenerated = data.aiGenerated;
    if (data.behaviors)
      changes.behaviorData = data.behaviors.map((b) => ({
        behaviorName: b.name,
        frequency: b.count,
        durationSeconds: b.durationSeconds,
        intervals: b.intervals,
        opportunities: b.opportunities,
      }));
    if (data.abcData) changes.abcData = data.abcData;
    if (data.action === "start") {
      if (
        await Session.exists({
          clinicId: actor.clinicId,
          technician: actor.id,
          status: "IN_PROGRESS",
        })
      )
        throw new AppError(
          409,
          "Complete your current session before starting another.",
        );
      changes.startedAt = new Date();
      changes.status = "IN_PROGRESS";
    }
    if (data.action === "complete") {
      changes.endedAt = new Date();
      changes.durationMinutes = Math.max(
        1,
        Math.ceil((Date.now() - +(session.startedAt || new Date())) / 60000),
      );
      changes.status = "COMPLETED";
    }
    if (data.action === "cancel") changes.status = "CANCELLED";
    let updated;
    await mongoose.connection.transaction(async (transaction) => {
      updated = await Session.findOneAndUpdate(
        {
          _id: data.id,
          clinicId: actor.clinicId,
          ...(data.revision === 0
            ? { $or: [{ revision: 0 }, { revision: { $exists: false } }] }
            : { revision: data.revision }),
        },
        { $set: changes, $inc: { revision: 1 } },
        { returnDocument: "after", runValidators: true, session: transaction },
      );
      if (!updated)
        throw new AppError(
          409,
          "A newer draft exists. Refresh before saving.",
          "CONFLICT",
        );
      if (data.action === "complete") {
        const currentClient = await Client.findOne({
          _id: session.client,
          ...clientScope(actor),
        }).session(transaction);
        if (!currentClient)
          throw new AppError(404, "This client is unavailable.");
        if (typeof currentClient.authorizationHours === "number") {
          currentClient.authorizationHours = Math.max(
            0,
            currentClient.authorizationHours -
              Number(changes.durationMinutes) / 60,
          );
          await currentClient.save({ session: transaction });
        }
      }
      await audit(actor, data.action, "session", data.id, transaction);
    });
    return {
      session: updated,
      message:
        data.action === "complete"
          ? "Session saved. Review and submit its clinical note."
          : "Session saved.",
    };
  }
  throw new AppError(404, "This workspace action is unavailable.");
});
