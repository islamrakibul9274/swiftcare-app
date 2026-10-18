import test from "node:test";
import assert from "node:assert/strict";
import {
  clientAccessFilter,
  safeReturnUrl,
  isSessionValid,
  IDLE_MS,
  billingUnits,
} from "../../lib/policy";
import {
  aiSchema,
  behaviorSchema,
  loginSchema,
  noteSchema,
  passwordSchema,
  reviewSchema,
  scheduleSchema,
} from "../../lib/validation";
import { deidentifiedObservation } from "../../lib/ai";
import { csvText } from "../../lib/csv";
const id = "100000000000000000000001";
test("client filters always include clinic scope and clinical assignment", () => {
  assert.deepEqual(clientAccessFilter("RBT", id, "a"), {
    clinicId: "a",
    assignedRBTs: id,
  });
  assert.deepEqual(clientAccessFilter("BCBA", id, "b"), {
    clinicId: "b",
    assignedBCBA: id,
  });
  assert.deepEqual(clientAccessFilter("ADMIN", id, "c"), { clinicId: "c" });
});
test("return URLs reject outside origins, role escapes, and path traversal", () => {
  for (const bad of [
    "https://example.com",
    "//example.com",
    "/admin",
    "/clients/../admin",
    "/clients\\evil",
    "/clients\n/evil",
  ])
    assert.equal(safeReturnUrl(bad, "RBT"), "/tech");
  assert.equal(
    safeReturnUrl("/clients/123?tab=notes", "BCBA"),
    "/clients/123?tab=notes",
  );
});
test("idle and absolute session expiry enforce exact boundaries", () => {
  const now = 1700000000000;
  assert.equal(
    isSessionValid(new Date(now - IDLE_MS + 1), new Date(now + 1000), now),
    true,
  );
  assert.equal(
    isSessionValid(new Date(now - IDLE_MS), new Date(now + 1000), now),
    false,
  );
  assert.equal(isSessionValid(new Date(now), new Date(now), now), false);
});
test("credentials reject operator injection and normalize email", () => {
  assert.equal(
    loginSchema.safeParse({ email: { $ne: null }, password: "x" }).success,
    false,
  );
  assert.equal(
    loginSchema.parse({ email: " STAFF@EXAMPLE.COM ", password: "x" }).email,
    "staff@example.com",
  );
});
test("password policy prevents silent bcrypt UTF-8 truncation", () => {
  assert.equal(passwordSchema.safeParse("Short1").success, false);
  assert.equal(passwordSchema.safeParse("Onlylowercase123").success, true);
  assert.equal(passwordSchema.safeParse("Aa1" + "é".repeat(35)).success, false);
  assert.equal(passwordSchema.safeParse("Aa1" + "é".repeat(34)).success, true);
});
test("observations reject negatives and impossible interval totals", () => {
  const valid = {
    name: "Target",
    type: "increase",
    count: 2,
    intervals: 2,
    opportunities: 3,
  };
  assert.equal(behaviorSchema.safeParse(valid).success, true);
  assert.equal(
    behaviorSchema.safeParse({ ...valid, count: -1 }).success,
    false,
  );
  assert.equal(
    behaviorSchema.safeParse({ ...valid, intervals: 4 }).success,
    false,
  );
});
test("clinical submission requires a reviewed, substantive note", () => {
  const data = {
    sessionId: id,
    summary: "Objective observations recorded during this session.",
    authorReviewed: true,
  };
  assert.equal(noteSchema.safeParse(data).success, true);
  assert.equal(
    noteSchema.safeParse({ ...data, authorReviewed: false }).success,
    false,
  );
  assert.equal(
    noteSchema.safeParse({ ...data, summary: "brief" }).success,
    false,
  );
  assert.equal(
    reviewSchema.safeParse({
      action: "request_changes",
      revision: 0,
      comment: "",
    }).success,
    false,
  );
});
test("scheduling rejects negative and overlong sessions", () => {
  const data = {
    clientId: id,
    technicianId: id,
    date: "2026-10-17T09:00:00Z",
    scheduledEnd: "2026-10-17T10:00:00Z",
  };
  assert.equal(scheduleSchema.safeParse(data).success, true);
  assert.equal(
    scheduleSchema.safeParse({ ...data, scheduledEnd: "2026-10-17T08:00:00Z" })
      .success,
    false,
  );
  assert.equal(
    scheduleSchema.safeParse({ ...data, scheduledEnd: "2026-10-17T18:00:00Z" })
      .success,
    false,
  );
});
test("AI requests never include names, identifiers, or free-text observations", () => {
  const observations = [
    {
      frequency: 3,
      durationSeconds: 15,
      intervals: 1,
      opportunities: 4,
      name: "PRIVATE NAME",
      antecedent: "PRIVATE CLINICAL TEXT",
    },
  ];
  const payload = deidentifiedObservation(60, observations);
  const text = JSON.stringify(payload);
  assert.equal(text.includes("PRIVATE"), false);
  assert.deepEqual(payload.observations[0], {
    target: "Target 1",
    frequency: 3,
    durationSeconds: 15,
    positiveIntervals: 1,
    totalIntervals: 4,
  });
  assert.equal(
    aiSchema.safeParse({ sessionId: id, clientName: "Private name" }).success,
    false,
  );
});
test("billing units do not fabricate time or round partial units upward", () => {
  assert.equal(billingUnits(14), 0);
  assert.equal(billingUnits(15), 1);
  assert.equal(billingUnits(59), 3);
  assert.equal(billingUnits(60), 4);
});
test("CSV quotes values, preserves line breaks, and neutralizes formulas", () => {
  const csv = csvText([
    ["name", "note"],
    ["A, B", 'A "quoted" line\nnext'],
    [' =HYPERLINK("bad")', "@formula"],
    [-1, "-1"],
  ]);
  assert.ok(csv.includes('"A, B"'));
  assert.ok(csv.includes('A ""quoted"" line\nnext'));
  assert.ok(csv.includes("\"' =HYPERLINK"));
  assert.ok(csv.includes('"\'@formula"'));
  assert.ok(csv.includes('"-1","\'-1"'));
});
