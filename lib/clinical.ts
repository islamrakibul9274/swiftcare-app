import "server-only";
import mongoose from "mongoose";
import { z } from "zod";
import Note from "@/models/Note";
import Claim from "@/models/Claim";
import Session from "@/models/Session";
import Client from "@/models/Client";
import Clinic from "@/models/Clinic";
import User from "@/models/User";
import Notification from "@/models/Notification";
import { AppError } from "@/lib/errors";
import { audit, clientScope, getClient, type Actor } from "@/lib/security";
import { billingUnits } from "@/lib/policy";
import { idSchema, noteSchema, reviewSchema } from "@/lib/validation";
export async function createNote(
  actor: Actor,
  data: z.output<typeof noteSchema>,
) {
  if (actor.role !== "RBT")
    throw new AppError(403, "Only a session's technician can submit its note.");
  const session = await Session.findOne({
    _id: data.sessionId,
    clinicId: actor.clinicId,
    technician: actor.id,
  });
  if (!session || session.status !== "COMPLETED")
    throw new AppError(
      409,
      "Complete and save the session before submitting a note.",
    );
  const client = await getClient(actor, String(session.client));
  const sourceKey = `session:${session._id}`;
  let note = await Note.findOne({ sourceKey, clinicId: actor.clinicId });
  if (note) return note;
  await mongoose.connection.transaction(async (transaction) => {
    note = await Note.findOneAndUpdate(
      { sourceKey },
      {
        $setOnInsert: {
          clinicId: actor.clinicId,
          clientId: client._id,
          sessionId: session._id,
          clientName: `${client.firstName} ${client.lastName}`,
          rbtName: actor.name,
          rbtId: actor.id,
          duration: `${session.durationMinutes} minutes`,
          durationMinutes: session.durationMinutes,
          summary: data.summary,
          aiGenerated: data.aiGenerated,
          authorReviewed: true,
          status: "Pending Review",
          date: session.startedAt || session.date,
          behaviors: session.behaviorData.map((b) => ({
            name: b.behaviorName,
            type:
              client.targetBehaviors.find((t) => t.name === b.behaviorName)
                ?.type || "increase",
            count: b.frequency,
            durationSeconds: b.durationSeconds,
            intervals: b.intervals,
            opportunities: b.opportunities,
          })),
        },
      },
      {
        upsert: true,
        returnDocument: "after",
        session: transaction,
        runValidators: true,
      },
    );
    if (!note) throw new AppError(500, "The note could not be saved.");
    await audit(actor, "submit", "note", String(note._id), transaction);
    if (
      client.assignedBCBA &&
      (await User.exists({
        _id: client.assignedBCBA,
        notificationPreferences: { $ne: false },
      }).session(transaction))
    )
      await Notification.create(
        [
          {
            clinicId: actor.clinicId,
            userId: String(client.assignedBCBA),
            title: "A note is ready for review",
            message: "Review the clinical note in your approval queue.",
            href: "/director/notes",
          },
        ],
        { session: transaction },
      );
  });
  return note;
}
export async function reviewNote(
  actor: Actor,
  id: string,
  data: z.output<typeof reviewSchema>,
) {
  idSchema.parse(id);
  let result;
  await mongoose.connection.transaction(async (transaction) => {
    const note = await Note.findOne({
      _id: id,
      clinicId: actor.clinicId,
    }).session(transaction);
    if (!note?.clientId) throw new AppError(404, "This note is unavailable.");
    const client = await Client.findOne({
      _id: note.clientId,
      ...clientScope(actor),
    }).session(transaction);
    if (!client) throw new AppError(404, "This note is unavailable.");
    if (data.action === "resubmit") {
      if (actor.role !== "RBT" || note.rbtId !== actor.id)
        throw new AppError(403, "Only the author can revise this note.");
      if (
        note.status !== "Changes Requested" ||
        !data.summary ||
        !data.authorReviewed
      )
        throw new AppError(409, "Review your revisions before resubmitting.");
    } else if (actor.role !== "BCBA")
      throw new AppError(
        403,
        "A client's assigned BCBA must review clinical notes.",
      );
    if (data.action === "approve" && note.status === "Approved") {
      result = note;
      return;
    }
    if (note.revision !== data.revision)
      throw new AppError(
        409,
        "This note changed. Refresh it before continuing.",
        "CONFLICT",
      );
    if (data.action !== "resubmit" && note.status !== "Pending Review")
      throw new AppError(409, "This note is not awaiting review.");
    if (data.action === "approve" && !data.reviewed)
      throw new AppError(400, "Confirm that you reviewed the clinical note.");
    note.status =
      data.action === "approve"
        ? "Approved"
        : data.action === "request_changes"
          ? "Changes Requested"
          : "Pending Review";
    if (data.summary && data.action === "resubmit") note.summary = data.summary;
    if (data.comment)
      note.comments.push({
        authorId: actor.id,
        authorName: actor.name,
        message: data.comment,
        at: new Date(),
      });
    if (data.action === "approve") {
      note.reviewedBy = new mongoose.Types.ObjectId(actor.id);
      note.reviewedAt = new Date();
    }
    note.revision += 1;
    await note.save({ session: transaction });
    if (data.action === "approve") {
      const clinic = await Clinic.findById(actor.clinicId).session(transaction);
      const units = billingUnits(note.durationMinutes || 0);
      const rate = clinic?.ratePerUnit || 0;
      await Claim.findOneAndUpdate(
        { sourceKey: `note:${note._id}` },
        {
          $setOnInsert: {
            sourceKey: `note:${note._id}`,
            clinicId: actor.clinicId,
            clientId: client._id,
            clientName: note.clientName,
            noteId: note._id,
            dateOfService: note.date,
            amount: Math.round(units * rate * 100) / 100,
            units,
            ratePerUnit: rate,
            billingCode: clinic?.billingCode || "97153",
            requiresReview: true,
            status: "Pending Submission",
          },
        },
        { upsert: true, session: transaction, runValidators: true },
      );
    }
    await audit(actor, data.action, "note", id, transaction);
    const recipient =
      data.action === "resubmit" ? String(client.assignedBCBA) : note.rbtId;
    if (
      await User.exists({
        _id: recipient,
        notificationPreferences: { $ne: false },
      }).session(transaction)
    )
      await Notification.create(
        [
          {
            clinicId: actor.clinicId,
            userId: recipient,
            title:
              data.action === "approve"
                ? "Your note was approved"
                : data.action === "resubmit"
                  ? "A revised note is ready"
                  : "A note needs changes",
            message: "Open your note workspace to see the update.",
            href:
              data.action === "resubmit" ? "/director/notes" : "/tech/notes",
          },
        ],
        { session: transaction },
      );
    result = note;
  });
  return result;
}
export async function listNotes(actor: Actor) {
  const clients = await Client.find(clientScope(actor)).select("_id").lean();
  const notes = await Note.find({
    clinicId: actor.clinicId,
    clientId: { $in: clients.map((c) => c._id) },
    ...(actor.role === "RBT" ? { rbtId: actor.id } : {}),
  })
    .sort({ date: -1 })
    .limit(250)
    .lean();
  await audit(
    actor,
    "view_list",
    "notes",
    notes.map((n) => String(n._id)).join(","),
  );
  return notes;
}
export async function assignedStaff(
  actor: Actor,
  ids: string[],
  role: "BCBA" | "RBT",
) {
  const count = await User.countDocuments({
    _id: { $in: ids },
    clinicId: actor.clinicId,
    role,
    active: { $ne: false },
  });
  if (count !== new Set(ids).size)
    throw new AppError(400, `Choose active ${role} staff from this clinic.`);
}
