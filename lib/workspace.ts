import "server-only";
import { getActor, clientScope, audit, type Actor } from "@/lib/security";
import User from "@/models/User";
import Client from "@/models/Client";
import Session from "@/models/Session";
import Note from "@/models/Note";
import Claim from "@/models/Claim";
import Clinic from "@/models/Clinic";
import Notification from "@/models/Notification";
import Supervision from "@/models/Supervision";
import { AuditEvent } from "@/models/Security";
import { transport, type WorkspaceData } from "@/lib/dto";
export async function workspaceData(
  actor?: Actor,
  includeAudit = false,
  view = "overview",
): Promise<WorkspaceData> {
  const user = actor || (await getActor());
  if (user.forcePasswordChange) {
    const { sid: hidden, ...safeActor } = user;
    void hidden;
    return {
      asOf: new Date().toISOString(),
      actor: safeActor,
      clinic: { name: user.clinicName, ratePerUnit: 0, billingCode: "97153" },
      clients: [],
      notes: [],
      sessions: [],
      claims: [],
      staff: [],
      notifications: [],
      supervisions: [],
      audit: [],
      demo: process.env.SWIFTCARE_DEMO === "true",
      capped: false,
    };
  }
  const needsClients = [
    "overview",
    "clients",
    "client",
    "graphs",
    "notes",
    "schedule",
    "supervision",
    "staff",
  ].includes(view);
  const needsNotes = [
    "overview",
    "clients",
    "client",
    "graphs",
    "notes",
  ].includes(view);
  const needsSessions = [
    "overview",
    "client",
    "schedule",
    "notes",
    "supervision",
    "staff",
  ].includes(view);
  const needsStaff = [
    "overview",
    "staff",
    "clients",
    "client",
    "schedule",
    "supervision",
  ].includes(view);
  const clients = needsClients
    ? await Client.find(clientScope(user))
        .sort({ firstName: 1 })
        .limit(250)
        .lean()
    : [];
  const clientIds = clients.map((c) => c._id);
  const [
    notes,
    sessions,
    claims,
    staff,
    notifications,
    supervisions,
    clinic,
    events,
  ] = await Promise.all([
    needsNotes
      ? Note.find({
          clinicId: user.clinicId,
          clientId: { $in: clientIds },
          ...(user.role === "RBT" ? { rbtId: user.id } : {}),
        })
          .select(user.role === "ADMIN" ? "-summary -behaviors -comments" : "")
          .sort({ date: -1 })
          .limit(250)
          .lean()
      : [],
    needsSessions
      ? Session.find({
          clinicId: user.clinicId,
          client: { $in: clientIds },
          ...(user.role === "RBT" ? { technician: user.id } : {}),
        })
          .select(
            user.role === "ADMIN"
              ? "-aiDraftedNote -aiOriginalNote -abcData -behaviorData"
              : "",
          )
          .sort({ date: -1 })
          .limit(250)
          .lean()
      : [],
    user.role === "ADMIN" && ["overview", "billing"].includes(view)
      ? Claim.find({ clinicId: user.clinicId })
          .sort({ dateOfService: -1 })
          .limit(250)
          .lean()
      : [],
    needsStaff
      ? User.find({ clinicId: user.clinicId })
          .select(
            user.role === "ADMIN" && view === "staff"
              ? "name email role active credential credentialExpiresAt forcePasswordChange"
              : "name role active credentialExpiresAt",
          )
          .sort({ name: 1 })
          .limit(250)
          .lean()
      : [],
    view === "notifications"
      ? Notification.find({ clinicId: user.clinicId, userId: user.id })
          .sort({ createdAt: -1 })
          .limit(50)
          .lean()
      : [],
    view === "supervision"
      ? Supervision.find({
          clinicId: user.clinicId,
          ...(user.role === "RBT"
            ? { technician: user.id }
            : user.role === "BCBA"
              ? { supervisor: user.id }
              : {}),
        })
          .sort({ date: -1 })
          .limit(100)
          .lean()
      : [],
    Clinic.findById(user.clinicId).lean(),
    includeAudit && user.role === "ADMIN"
      ? AuditEvent.find({ clinicId: user.clinicId })
          .sort({ createdAt: -1 })
          .limit(250)
          .lean()
      : [],
  ]);
  if (needsClients)
    await audit(user, "view_list", "clients", clientIds.join(","));
  if (user.role !== "ADMIN" && needsNotes)
    await audit(user, "view_list", "notes", notes.map((n) => n._id).join(","));
  if (user.role === "ADMIN" && ["overview", "billing"].includes(view))
    await audit(
      user,
      "view_list",
      "claims",
      claims.map((c) => c._id).join(","),
    );
  if (user.role === "ADMIN" && needsStaff)
    await audit(user, "view_list", "staff", staff.map((s) => s._id).join(","));
  if (supervisions.length)
    await audit(
      user,
      "view_list",
      "supervision",
      supervisions.map((s) => s._id).join(","),
    );
  const { sid: _sid, ...safeActor } = user;
  void _sid;
  return transport<WorkspaceData>({
    asOf: new Date().toISOString(),
    actor: safeActor,
    clinic: {
      name: clinic?.name || user.clinicName,
      ratePerUnit: clinic?.ratePerUnit || 0,
      billingCode: clinic?.billingCode || "97153",
    },
    clients: clients.map((c) => ({
      ...c,
      goals: c.goals || [],
      assignedRBTs: c.assignedRBTs || [],
      targetBehaviors: c.targetBehaviors || [],
      active: c.active !== false,
    })),
    notes: notes.map((n) => ({
      ...n,
      summary: n.summary || "",
      behaviors: n.behaviors || [],
      comments: n.comments || [],
      revision: n.revision ?? 0,
    })),
    sessions: sessions.map((s) => ({
      ...s,
      revision: s.revision ?? 0,
      behaviorData: s.behaviorData || [],
      abcData: s.abcData || [],
      durationMinutes: s.durationMinutes || 0,
    })),
    claims,
    staff,
    notifications,
    supervisions,
    audit: events,
    demo: process.env.SWIFTCARE_DEMO === "true",
    capped: [clients, notes, sessions, claims, staff].some(
      (list) => list.length === 250,
    ),
  });
}
