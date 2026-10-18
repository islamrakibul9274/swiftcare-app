import mongoose from "mongoose";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import nextEnv from "@next/env";
import { z } from "zod";
import User from "../models/User";
import Client from "../models/Client";
import Note from "../models/Note";
import Session from "../models/Session";
import Claim from "../models/Claim";
import Clinic from "../models/Clinic";
import {
  AccountToken,
  AuditEvent,
  LoginSession,
  RateBucket,
} from "../models/Security";
import Notification from "../models/Notification";
import Supervision from "../models/Supervision";
const id = z.string().regex(/^[a-f\d]{24}$/i);
const mappingSchema = z
  .object({
    clinics: z.array(
      z
        .object({
          id: z.string().min(3).max(80),
          name: z.string().min(2).max(150),
          userIds: z.array(id).min(1),
        })
        .strict(),
    ),
    clients: z.array(
      z
        .object({
          id,
          clinicId: z.string(),
          assignedBCBA: id,
          assignedRBTs: z.array(id),
        })
        .strict(),
    ),
    notes: z.array(z.object({ id, clientId: id }).strict()).default([]),
  })
  .strict();
const argument = (name: string) =>
  process.argv.find((v) => v.startsWith(`--${name}=`))?.slice(name.length + 3);
async function main() {
  nextEnv.loadEnvConfig(process.cwd());
  mongoose.set("autoIndex", false);
  mongoose.set("autoCreate", false);
  if (!process.env.MONGODB_URI)
    throw new Error("Set MONGODB_URI for the database to review.");
  await mongoose.connect(process.env.MONGODB_URI, {
    autoIndex: false,
    autoCreate: false,
  });
  const counts = {
    users: await User.countDocuments({ clinicId: { $exists: false } }),
    clients: await Client.countDocuments({ clinicId: { $exists: false } }),
    notes: await Note.countDocuments({ clinicId: { $exists: false } }),
    sessions: await Session.countDocuments({ clinicId: { $exists: false } }),
    claims: await Claim.countDocuments({ clinicId: { $exists: false } }),
  };
  console.log("Unmapped legacy record counts:", counts);
  const mappingPath = argument("mapping");
  if (!mappingPath) {
    console.log(
      "Dry run only. Supply --mapping=path.json with verified clinic, client, and note relationships. No records or indexes were changed.",
    );
    await mongoose.disconnect();
    return;
  }
  const mapping = mappingSchema.parse(
    JSON.parse(await readFile(mappingPath, "utf8")),
  );
  const users = await User.find({}).select("email role clinicId").lean();
  const clients = await Client.find({}).lean();
  const notes = await Note.find({}).lean();
  const sessions = await Session.find({}).lean();
  const claims = await Claim.find({}).lean();
  const userClinic = new Map<string, string>();
  for (const clinic of mapping.clinics)
    for (const userId of clinic.userIds) {
      if (userClinic.has(userId))
        throw new Error("A user is mapped more than once.");
      const user = users.find((u) => String(u._id) === userId);
      if (!user) throw new Error("A mapped staff ID does not exist.");
      if (user.clinicId && user.clinicId !== clinic.id)
        throw new Error("Moving an already-scoped user is not supported.");
      userClinic.set(userId, clinic.id);
    }
  const clientMap = new Map(mapping.clients.map((c) => [c.id, c]));
  if (clientMap.size !== mapping.clients.length)
    throw new Error("A client is mapped more than once.");
  for (const client of mapping.clients) {
    const old = clients.find((c) => String(c._id) === client.id);
    if (!old) throw new Error("A mapped client ID does not exist.");
    if (old.clinicId && old.clinicId !== client.clinicId)
      throw new Error("Moving an already-scoped client is not supported.");
    if (
      userClinic.get(client.assignedBCBA) !== client.clinicId ||
      users.find((u) => String(u._id) === client.assignedBCBA)?.role !== "BCBA"
    )
      throw new Error("Client BCBA must belong to the verified clinic.");
    for (const rbt of client.assignedRBTs)
      if (
        userClinic.get(rbt) !== client.clinicId ||
        users.find((u) => String(u._id) === rbt)?.role !== "RBT"
      )
        throw new Error("Client RBT must belong to the verified clinic.");
  }
  const noteMap = new Map(mapping.notes.map((n) => [n.id, n.clientId]));
  for (const entry of mapping.notes) {
    const note = notes.find((n) => String(n._id) === entry.id),
      client = clientMap.get(entry.clientId);
    if (!note || !client || userClinic.get(note.rbtId) !== client.clinicId)
      throw new Error(
        "A note mapping lacks a matching verified author and client clinic.",
      );
    if (note.clinicId && note.clinicId !== client.clinicId)
      throw new Error("Moving an already-scoped note is not supported.");
  }
  const emailGroups = new Map<string, number>();
  for (const user of users) {
    const key = user.email.trim().toLowerCase();
    emailGroups.set(key, (emailGroups.get(key) || 0) + 1);
  }
  if ([...emailGroups.values()].some((n) => n > 1))
    throw new Error(
      "Case-normalized email collisions require manual review before migration.",
    );
  const claimsPerNote = new Map<string, number>();
  for (const claim of claims) {
    const key = String(claim.noteId);
    claimsPerNote.set(key, (claimsPerNote.get(key) || 0) + 1);
  }
  console.log("Verified plan:", {
    clinics: mapping.clinics.length,
    users: userClinic.size,
    clients: clientMap.size,
    notes: noteMap.size,
    duplicateClaimGroups: [...claimsPerNote.values()].filter((n) => n > 1)
      .length,
  });
  if (!process.argv.includes("--apply")) {
    console.log(
      "Dry run complete. No records or indexes changed. Review the mapping, then add --apply --actor=<verified-admin-id>.",
    );
    await mongoose.disconnect();
    return;
  }
  const actor = argument("actor");
  if (
    !actor ||
    users.find((u) => String(u._id) === actor)?.role !== "ADMIN" ||
    !userClinic.has(actor)
  )
    throw new Error("--actor must identify a verified Admin in the mapping.");
  const allModels = [
    User,
    Client,
    Note,
    Session,
    Claim,
    Clinic,
    AccountToken,
    AuditEvent,
    LoginSession,
    RateBucket,
    Notification,
    Supervision,
  ];
  for (const model of allModels) await model.createCollection();
  await mongoose.connection.transaction(async (transaction) => {
    for (const clinic of mapping.clinics) {
      await Clinic.updateOne(
        { _id: clinic.id },
        {
          $setOnInsert: {
            name: clinic.name,
            ratePerUnit: 0,
            billingCode: "97153",
          },
        },
        { upsert: true, session: transaction },
      );
      for (const userId of clinic.userIds)
        await User.updateOne(
          { _id: userId },
          {
            $set: {
              clinicId: clinic.id,
              clinicName: clinic.name,
              email: users
                .find((u) => String(u._id) === userId)!
                .email.trim()
                .toLowerCase(),
              forcePasswordChange: true,
            },
            $inc: { sessionVersion: 1 },
          },
          { session: transaction },
        );
    }
    for (const client of mapping.clients)
      await Client.updateOne(
        { _id: client.id },
        {
          $set: {
            clinicId: client.clinicId,
            assignedBCBA: client.assignedBCBA,
            assignedRBTs: client.assignedRBTs,
          },
          $setOnInsert: {},
        },
        { session: transaction },
      );
    for (const [noteId, clientId] of noteMap) {
      const client = clientMap.get(clientId)!;
      await Note.updateOne(
        { _id: noteId },
        { $set: { clinicId: client.clinicId, clientId } },
        { session: transaction },
      );
    }
    for (const session of sessions) {
      const client = clientMap.get(String(session.client));
      if (
        client &&
        userClinic.get(String(session.technician)) === client.clinicId
      )
        await Session.updateOne(
          { _id: session._id },
          {
            $set: {
              clinicId: client.clinicId,
              revision: session.revision ?? 0,
            },
          },
          { session: transaction },
        );
    }
    for (const claim of claims) {
      const clientId = noteMap.get(String(claim.noteId));
      const client = clientId ? clientMap.get(clientId) : undefined;
      if (client)
        await Claim.updateOne(
          { _id: claim._id },
          {
            $set: {
              clinicId: client.clinicId,
              clientId,
              ...(claimsPerNote.get(String(claim.noteId)) === 1
                ? { sourceKey: `note:${claim.noteId}` }
                : {}),
            },
          },
          { session: transaction },
        );
    }
    for (const clinic of mapping.clinics)
      await AuditEvent.create(
        [
          {
            clinicId: clinic.id,
            actorId: actor,
            action: "verified_legacy_migration",
            resource: "database",
            resourceId: createHash("sha256")
              .update(JSON.stringify(mapping))
              .digest("hex"),
          },
        ],
        { session: transaction },
      );
  });
  for (const model of allModels) await model.createIndexes();
  console.log(
    "Verified mappings applied and additive indexes created. Unmapped records and duplicate historical claims remain unchanged and require review.",
  );
  await mongoose.disconnect();
}
main().catch(async (error) => {
  console.error(
    "Migration stopped:",
    error instanceof z.ZodError
      ? error.issues[0].message
      : error instanceof Error
        ? error.message
        : "Unknown failure",
  );
  await mongoose.disconnect();
  process.exit(1);
});
