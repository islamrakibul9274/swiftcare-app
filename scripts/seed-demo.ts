import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User";
import Client from "../models/Client";
import Session from "../models/Session";
import Note from "../models/Note";
import Claim from "../models/Claim";
import Clinic from "../models/Clinic";
import Notification from "../models/Notification";
import Supervision from "../models/Supervision";
import {
  AccountToken,
  AuditEvent,
  LoginSession,
  RateBucket,
} from "../models/Security";
export const demoIds = {
  admin: "100000000000000000000001",
  bcba: "100000000000000000000002",
  rbt: "100000000000000000000003",
  outsider: "100000000000000000000004",
  client: "200000000000000000000001",
  otherClient: "200000000000000000000099",
};
export async function seedDemo(
  uri: string,
  options: { previewDatabase?: string } = {},
) {
  const sourceDatabase =
    new mongoose.mongo.MongoClient(uri).options.dbName || "test";
  const previewDatabase = options.previewDatabase;
  if (
    previewDatabase &&
    (!/^swiftcare_preview_[a-z0-9_]{1,40}$/.test(previewDatabase) ||
      previewDatabase.toLowerCase() === sourceDatabase.toLowerCase())
  )
    throw new Error(
      "Preview seed requires a separate swiftcare_preview_* database.",
    );
  if (
    !previewDatabase &&
    (!/^mongodb:\/\/(127\.0\.0\.1|localhost):/.test(uri) ||
      sourceDatabase !== "swiftcare_demo")
  )
    throw new Error(
      "Demo seed requires a loopback MongoDB URI and the swiftcare_demo database.",
    );
  await mongoose.connect(
    uri,
    previewDatabase
      ? {
          dbName: previewDatabase,
          autoCreate: false,
          autoIndex: false,
          serverSelectionTimeoutMS: 8000,
          maxPoolSize: 2,
        }
      : undefined,
  );
  if (
    previewDatabase &&
    (
      await mongoose.connection
        .db!.listCollections({}, { nameOnly: true })
        .toArray()
    ).length
  )
    throw new Error(
      "Preview seed refuses a target that already has collections.",
    );
  const allModels = [
    User,
    Client,
    Session,
    Note,
    Claim,
    Clinic,
    Notification,
    Supervision,
    AccountToken,
    AuditEvent,
    LoginSession,
    RateBucket,
  ];
  for (const collection of allModels) {
    if (previewDatabase) {
      await collection.createCollection();
      await collection.createIndexes();
    } else await collection.init();
  }
  if (await User.exists({ _id: demoIds.admin })) return;
  const password = await bcrypt.hash("SwiftCareDemo2026!", 12);
  await Clinic.create({
    _id: "demo-clinic",
    name: "Willow Behavioral · Demo",
    ratePerUnit: 28,
    billingCode: "97153",
  });
  for (const [key, name, role, email] of [
    ["admin", "Morgan Demo", "ADMIN", "admin"],
    ["bcba", "Dr. Ellis Demo", "BCBA", "bcba"],
    ["rbt", "Sam Demo", "RBT", "rbt"],
    ["outsider", "Outside Demo", "RBT", "outsider"],
  ])
    await User.create({
      _id: demoIds[key as keyof typeof demoIds],
      name,
      email: `${email}@demo.swiftcare.example`,
      password,
      role: role as "ADMIN" | "BCBA" | "RBT",
      clinicName:
        key === "outsider"
          ? "Separate Demo Clinic"
          : "Willow Behavioral · Demo",
      clinicId: key === "outsider" ? "other-demo-clinic" : "demo-clinic",
      active: true,
      credential:
        role === "RBT"
          ? "RBT certification"
          : role === "BCBA"
            ? "BCBA certification"
            : "",
      credentialExpiresAt: new Date(
        Date.now() + (role === "RBT" ? 21 : 180) * 86400000,
      ),
    });
  const targets = [
    {
      name: "Independent requests",
      type: "increase",
      measurement: "frequency",
    },
    { name: "Task engagement", type: "increase", measurement: "duration" },
    {
      name: "Successful transitions",
      type: "increase",
      measurement: "interval",
    },
    { name: "Leaving activity", type: "decrease", measurement: "frequency" },
  ];
  for (let i = 0; i < 3; i++) {
    const clientId = `20000000000000000000000${i + 1}`;
    await Client.create({
      _id: clientId,
      clinicId: "demo-clinic",
      code: `DEMO-10${i + 1}`,
      firstName: ["Avery", "Jordan", "Riley"][i],
      lastName: "Demo",
      dateOfBirth: "2018-06-15",
      assignedBCBA: demoIds.bcba,
      assignedRBTs: [demoIds.rbt],
      authorizationHours: i === 1 ? 8 : 80,
      authorizationExpiresAt: new Date(Date.now() + 60 * 86400000),
      targetBehaviors: targets,
      goals: [
        {
          name: "Independent requests",
          target: 12,
          masteryCriteria:
            "At least 12 independent requests across 3 consecutive sessions.",
          direction: "increase",
          phaseDate: new Date(Date.now() - 7 * 86400000),
        },
        {
          name: "Leaving activity",
          target: 2,
          masteryCriteria:
            "Two or fewer occurrences across 5 consecutive sessions.",
          direction: "decrease",
        },
      ],
    });
    for (let day = 14; day >= 1; day--) {
      const date = new Date(Date.now() - day * 86400000);
      date.setHours(9 + i * 2, 0, 0, 0);
      const behaviors = targets.map((b, index) => ({
        name: b.name,
        type: b.type,
        count: index === 3 ? Math.max(1, Math.ceil(day / 3) + i) : 15 - day + i,
        durationSeconds: index === 1 ? 300 + (14 - day) * 20 : 0,
        intervals: index === 2 ? 8 : 0,
        opportunities: index === 2 ? 10 : 0,
      }));
      const session = await Session.create({
        clinicId: "demo-clinic",
        client: clientId,
        technician: demoIds.rbt,
        date,
        startedAt: date,
        endedAt: new Date(+date + 3600000),
        scheduledEnd: new Date(+date + 3600000),
        durationMinutes: 60,
        status: "COMPLETED",
        behaviorData: behaviors.map((b) => ({
          behaviorName: b.name,
          frequency: b.count,
          durationSeconds: b.durationSeconds,
          intervals: b.intervals,
          opportunities: b.opportunities,
        })),
      });
      const approved = day > 2 || i === 2;
      const note = await Note.create({
        clinicId: "demo-clinic",
        clientId,
        sessionId: session._id,
        sourceKey: `session:${session._id}`,
        clientName: `${["Avery", "Jordan", "Riley"][i]} Demo`,
        rbtId: demoIds.rbt,
        rbtName: "Sam Demo",
        duration: "60 minutes",
        durationMinutes: 60,
        summary: `SYNTHETIC DEMO RECORD — no real patient information.\n\nObserved a 60-minute session. Independent requests: ${behaviors[0].count}. Leaving activity: ${behaviors[3].count}. Task engagement duration: ${behaviors[1].durationSeconds} seconds. Successful transitions: 8 of 10 observed intervals. No additional context was recorded.\n\nContinue the current measurement plan and review the target-level data with the supervising clinician.`,
        authorReviewed: true,
        status: approved ? "Approved" : "Pending Review",
        date,
        behaviors,
        ...(approved
          ? { reviewedBy: demoIds.bcba, reviewedAt: new Date(+date + 7200000) }
          : {}),
      });
      if (approved)
        await Claim.create({
          clinicId: "demo-clinic",
          clientId,
          clientName: note.clientName,
          noteId: note._id,
          sourceKey: `note:${note._id}`,
          dateOfService: date,
          amount: 112,
          units: 4,
          ratePerUnit: 28,
          status:
            day > 7 ? "Paid" : day === 5 && i === 0 ? "Denied" : "Submitted",
          requiresReview: false,
          billingCode: "97153",
          payerReference: "DEMO-LEDGER",
        });
    }
    const date = new Date(Date.now() + (30 + i * 90) * 60000);
    await Session.create({
      clinicId: "demo-clinic",
      client: clientId,
      technician: demoIds.rbt,
      date,
      scheduledEnd: new Date(+date + 3600000),
      status: "SCHEDULED",
      behaviorData: targets.map((t) => ({
        behaviorName: t.name,
        frequency: 0,
      })),
    });
  }
  await Client.create({
    _id: demoIds.otherClient,
    clinicId: "other-demo-clinic",
    code: "OTHER-DEMO",
    firstName: "Separate",
    lastName: "Demo",
    dateOfBirth: "2019-01-01",
    assignedRBTs: [demoIds.outsider],
    targetBehaviors: targets,
  });
  await Supervision.create({
    clinicId: "demo-clinic",
    technician: demoIds.rbt,
    supervisor: demoIds.bcba,
    date: new Date(Date.now() - 2 * 86400000),
    minutes: 60,
    observation:
      "Synthetic demo observation: reviewed data collection fidelity and documentation.",
  });
  await Notification.insertMany([
    {
      clinicId: "demo-clinic",
      userId: demoIds.bcba,
      title: "Your review queue is ready",
      message: "Synthetic demo notes are awaiting your review.",
      href: "/director/notes",
    },
    {
      clinicId: "demo-clinic",
      userId: demoIds.admin,
      title: "Credential review coming up",
      message: "A demo staff credential expires within 30 days.",
      href: "/admin/staff",
    },
    {
      clinicId: "demo-clinic",
      userId: demoIds.rbt,
      title: "Your care day is ready",
      message: "Open your schedule to see assigned demo sessions.",
      href: "/tech",
    },
  ]);
  await AuditEvent.create({
    clinicId: "demo-clinic",
    actorId: demoIds.admin,
    actorName: "Morgan Demo",
    action: "seed_synthetic_demo",
    resource: "demo_clinic",
  });
}
