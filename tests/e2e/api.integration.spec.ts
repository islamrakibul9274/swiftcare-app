import { test, expect, origin, login, password } from "./fixtures";
const otherClient = "200000000000000000000099";
test("anonymous reads, AI, and staff registration are denied", async ({
  request,
}) => {
  for (const url of ["/api/notes", "/api/claims", "/api/workspace/overview"])
    expect((await request.get(url)).status()).toBe(401);
  expect(
    (
      await request.post("/api/ai-notes", {
        headers: { Origin: origin },
        data: {},
      })
    ).status(),
  ).toBe(401);
  expect(
    (
      await request.post("/api/auth/register", {
        headers: { Origin: origin },
        data: { role: "ADMIN" },
      })
    ).status(),
  ).toBe(403);
});
test("each role is scoped to its clinic and its permitted operations", async ({
  accounts,
}) => {
  const rbt = await (await accounts.rbt.get("/api/workspace/overview")).json();
  expect(
    rbt.clients.every(
      (c: { clinicId: string }) => c.clinicId === "demo-clinic",
    ),
  ).toBe(true);
  expect(rbt.clients.some((c: { _id: string }) => c._id === otherClient)).toBe(
    false,
  );
  expect(rbt.claims).toEqual([]);
  expect(rbt.staff.every((s: object) => !("password" in s))).toBe(true);
  expect((await accounts.rbt.get("/api/claims")).status()).toBe(403);
  expect((await accounts.bcba.get("/api/workspace/audit")).status()).toBe(403);
  expect(
    (await accounts.rbt.post("/api/workspace/staff", { data: {} })).status(),
  ).toBe(403);
  const outside = await (
    await accounts.outsider.get("/api/workspace/overview")
  ).json();
  expect(outside.clients).toHaveLength(1);
  expect(outside.clients[0]._id).toBe(otherClient);
});
test("Admin session data excludes clinical drafts and observations", async ({
  accounts,
}) => {
  const state = await (
    await accounts.rbt.get("/api/workspace/overview")
  ).json();
  const client = state.clients[0];
  const start = new Date();
  start.setDate(start.getDate() + 21);
  start.setHours(16, 45, 0, 0);
  const booking = await accounts.rbt.post("/api/workspace/sessions", {
    data: {
      clientId: client._id,
      technicianId: state.actor.id,
      date: start.toISOString(),
      scheduledEnd: new Date(+start + 3600000).toISOString(),
    },
  });
  expect(booking.status()).toBe(200);
  let session = (await booking.json()).session;
  const started = await accounts.rbt.patch("/api/workspace/sessions", {
    data: { id: session._id, revision: session.revision, action: "start" },
  });
  expect(started.status()).toBe(200);
  session = (await started.json()).session;
  const clinicalDraft =
    "SYNTHETIC DEMO — clinician-only draft for privacy verification.";
  const completed = await accounts.rbt.patch("/api/workspace/sessions", {
    data: {
      id: session._id,
      revision: session.revision,
      action: "complete",
      draftText: clinicalDraft,
      aiOriginalText: clinicalDraft,
      behaviors: client.targetBehaviors.map(
        (target: { name: string; type: "increase" | "decrease" }) => ({
          name: target.name,
          type: target.type,
          count: 1,
          durationSeconds: 0,
          intervals: 0,
          opportunities: 0,
        }),
      ),
      abcData: [
        {
          antecedent: "SYNTHETIC DEMO — transition cue",
          behavior: "SYNTHETIC DEMO — observed response",
          consequence: "SYNTHETIC DEMO — recorded follow-up",
          at: new Date().toISOString(),
        },
      ],
    },
  });
  expect(completed.status()).toBe(200);
  const readSession = async (role: "admin" | "rbt") => {
    const response = await accounts[role].get("/api/workspace/overview");
    expect(response.status()).toBe(200);
    return (await response.json()).sessions.find(
      (item: { _id: string }) => item._id === session._id,
    );
  };
  const clinical = await readSession("rbt");
  expect(clinical.aiDraftedNote).toBe(clinicalDraft);
  expect(clinical.aiOriginalNote).toBe(clinicalDraft);
  expect(clinical.abcData).toHaveLength(1);
  expect(clinical.behaviorData.length).toBeGreaterThan(0);
  const operational = await readSession("admin");
  expect(operational).toMatchObject({
    _id: session._id,
    client: client._id,
    status: "COMPLETED",
    behaviorData: [],
    abcData: [],
  });
  expect(operational).not.toHaveProperty("aiDraftedNote");
  expect(operational).not.toHaveProperty("aiOriginalNote");
});
test("invalid input, origins, and tampered IDs fail safely", async ({
  accounts,
  request,
}) => {
  const state = await (
    await accounts.bcba.get("/api/workspace/overview")
  ).json();
  const note = state.notes.find(
    (n: { status: string }) => n.status === "Pending Review",
  );
  expect(
    (
      await accounts.bcba.patch("/api/notes/not-an-id", {
        data: { action: "approve", revision: 0, reviewed: true },
      })
    ).status(),
  ).toBe(400);
  expect((await accounts.outsider.get(`/api/notes/${note._id}`)).status()).toBe(
    404,
  );
  expect(
    (
      await accounts.outsider.patch(`/api/notes/${note._id}`, {
        data: { action: "approve", revision: 0, reviewed: true },
      })
    ).status(),
  ).toBe(404);
  expect(
    (
      await accounts.bcba.patch(`/api/notes/${note._id}`, {
        headers: { Origin: "https://untrusted.example" },
        data: { action: "approve", revision: note.revision, reviewed: true },
      })
    ).status(),
  ).toBe(403);
  const malformed = await accounts.rbt.post("/api/notes", {
    headers: { "Content-Type": "application/json" },
    data: "{",
  });
  expect(malformed.status()).toBe(400);
  expect(
    (
      await accounts.rbt.post("/api/notes", {
        headers: { "Content-Type": "application/json" },
        data: '"' + "x".repeat(66000) + '"',
      })
    ).status(),
  ).toBe(413);
  const text = await malformed.text();
  expect(text).not.toMatch(/stack|Mongo|mongoose|node_modules/);
  expect(
    (await request.get("/admin", { maxRedirects: 0 })).headers().location,
  ).toContain("/login");
});
test("approval is idempotent and produces one billing draft", async ({
  accounts,
}) => {
  const state = await (
    await accounts.bcba.get("/api/workspace/overview")
  ).json();
  const note = state.notes.find(
    (n: { status: string }) => n.status === "Pending Review",
  );
  expect(
    (
      await accounts.bcba.patch(`/api/notes/${note._id}`, {
        data: { action: "approve", revision: note.revision },
      })
    ).status(),
  ).toBe(400);
  for (let attempt = 0; attempt < 2; attempt++) {
    const result = await accounts.bcba.patch(`/api/notes/${note._id}`, {
      data: { action: "approve", revision: note.revision, reviewed: true },
    });
    expect(result.status()).toBe(200);
  }
  const claims = await (await accounts.admin.get("/api/claims")).json();
  const related = claims.claims.filter(
    (c: { noteId: string }) => c.noteId === note._id,
  );
  expect(related).toHaveLength(1);
  expect(related[0].requiresReview).toBe(true);
});
test("revision requests require comments and only the author can resubmit", async ({
  accounts,
}) => {
  const state = await (
    await accounts.bcba.get("/api/workspace/overview")
  ).json();
  const note = state.notes.find(
    (n: { status: string }) => n.status === "Pending Review",
  );
  expect(
    (
      await accounts.bcba.patch(`/api/notes/${note._id}`, {
        data: {
          action: "request_changes",
          revision: note.revision,
          comment: "",
        },
      })
    ).status(),
  ).toBe(400);
  const result = await accounts.bcba.patch(`/api/notes/${note._id}`, {
    data: {
      action: "request_changes",
      revision: note.revision,
      comment: "Clarify the recorded observation period.",
    },
  });
  expect(result.status()).toBe(200);
  const updated = (await result.json()).note;
  expect(
    (
      await accounts.rbt.patch(`/api/notes/${note._id}`, {
        data: {
          action: "resubmit",
          revision: updated.revision,
          summary:
            updated.summary +
            "\nRevision: the recorded observation period was 60 minutes.",
          authorReviewed: true,
        },
      })
    ).status(),
  ).toBe(200);
});
test("concurrent scheduling detects conflicts without duplicate bookings", async ({
  accounts,
}) => {
  const start = new Date();
  start.setDate(start.getDate() + 10);
  start.setHours(9, 0, 0, 0);
  const payload = {
    clientId: "200000000000000000000001",
    technicianId: "100000000000000000000003",
    date: start.toISOString(),
    scheduledEnd: new Date(+start + 3600000).toISOString(),
  };
  const responses = await Promise.all([
    accounts.admin.post("/api/workspace/sessions", { data: payload }),
    accounts.admin.post("/api/workspace/sessions", { data: payload }),
  ]);
  expect(responses.map((r) => r.status()).sort()).toEqual([200, 409]);
});
test("secure invitations are single-use and deactivation revokes live sessions", async ({
  accounts,
  playwright,
}) => {
  const email = `invite-${Date.now()}@demo.swiftcare.example`;
  const invite = await accounts.admin.post("/api/workspace/staff", {
    data: {
      name: "Invited Synthetic Demo",
      email,
      role: "RBT",
      credential: "Demo credential",
    },
  });
  expect(invite.status()).toBe(200);
  const invitation = await invite.json();
  const link = invitation.link;
  const token = new URLSearchParams(new URL(link).hash.slice(1)).get("token");
  expect(token).toMatch(/^[a-f0-9]{64}$/);
  const guest = await playwright.request.newContext({
    baseURL: origin,
    extraHTTPHeaders: { Origin: origin },
  });
  expect(
    (
      await guest.post("/api/account/set-password", {
        data: { token, password },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await guest.post("/api/account/set-password", {
        data: { token, password },
      })
    ).status(),
  ).toBe(400);
  await login(guest, email);
  expect((await guest.get("/api/workspace/overview")).status()).toBe(200);
  const state = await (
    await accounts.admin.get("/api/workspace/overview")
  ).json();
  const user = state.staff.find(
    (s: { _id: string }) => s._id === invitation.userId,
  );
  expect(
    (
      await accounts.admin.patch("/api/workspace/staff", {
        data: { id: user._id, active: false },
      })
    ).status(),
  ).toBe(200);
  expect((await guest.get("/api/workspace/overview")).status()).toBe(401);
  await guest.dispose();
});

test("an unassigned BCBA cannot open another clinician’s client or note", async ({
  accounts,
  playwright,
}) => {
  const state = await (
    await accounts.bcba.get("/api/workspace/overview")
  ).json();
  const note = state.notes[0];
  const email = `unassigned-${Date.now()}@demo.swiftcare.example`;
  const invited = await accounts.admin.post("/api/workspace/staff", {
    data: { name: "Unassigned Synthetic BCBA", email, role: "BCBA" },
  });
  expect(invited.status()).toBe(200);
  const token = new URLSearchParams(
    new URL((await invited.json()).link).hash.slice(1),
  ).get("token");
  const guest = await playwright.request.newContext({
    baseURL: origin,
    extraHTTPHeaders: { Origin: origin },
  });
  expect(
    (
      await guest.post("/api/account/set-password", {
        data: { token, password },
      })
    ).status(),
  ).toBe(200);
  await login(guest, email);
  const scoped = await guest.get("/api/workspace/overview");
  expect(scoped.headers()["cache-control"]).toBe("no-store");
  expect((await scoped.json()).clients).toEqual([]);
  expect((await guest.get(`/api/notes/${note._id}`)).status()).toBe(404);
  const unavailable = await guest.get(`/clients/${note.clientId}`);
  expect([200, 404]).toContain(unavailable.status()); // Next.js streams not-found UI with HTTP 200 after headers are sent.
  const page = await unavailable.text();
  expect(page).toContain("There’s nothing here to open.");
  expect(page).not.toContain(note.clientName);
  expect(page).not.toContain(note.summary);
  await guest.dispose();
});
