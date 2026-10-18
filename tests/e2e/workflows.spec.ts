import { test, expect, password } from "./fixtures";
import type { WorkspaceData, SessionDTO, NoteDTO } from "../../lib/dto";
for (const [role, home] of [
  ["rbt", "/tech"],
  ["bcba", "/director"],
  ["admin", "/admin"],
])
  test(`sign in and sign out through the ${role} interface`, async ({
    page,
  }) => {
    await page.goto("/login");
    await page
      .getByLabel("Work email", { exact: true })
      .fill(`${role}@demo.swiftcare.example`);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page
      .getByRole("button", { name: "Sign in to your workspace" })
      .click();
    await expect(page).toHaveURL(new RegExp(home + "$"));
    await expect(
      page.getByRole("heading", { name: "Overview", exact: true }),
    ).toBeVisible();
    await page.getByLabel("User menu").click();
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto(home);
    await expect(page).toHaveURL(/\/login/);
  });
test("wrong credentials show a generic error", async ({ page }) => {
  await page.goto("/login");
  await page
    .getByLabel("Work email", { exact: true })
    .fill("rbt@demo.swiftcare.example");
  await page.getByLabel("Password", { exact: true }).fill("incorrect-password");
  await page.getByRole("button", { name: "Sign in to your workspace" }).click();
  await expect(page.locator("form").getByRole("alert")).toHaveText(
    "We could not sign you in. Check your email and password, or wait a few minutes before trying again.",
  );
});
test("session autosave, AI draft edit, clinical approval, and billing action", async ({
  browser,
  accounts,
}) => {
  const state = (await (
    await accounts.rbt.get("/api/workspace/overview")
  ).json()) as WorkspaceData;
  const scheduled = state.sessions.find((s) => s.status === "SCHEDULED")!;
  const rbtContext = await browser.newContext({
    storageState: await accounts.rbt.storageState(),
  });
  const rbt = await rbtContext.newPage();
  await rbt.goto("/tech");
  await rbt
    .locator(`[data-session-id="${scheduled._id}"]`)
    .getByRole("button", { name: "Start", exact: true })
    .click();
  await expect(
    rbt.getByRole("button", { name: "End session", exact: true }),
  ).toBeVisible();
  await rbt
    .getByRole("button", { name: "Increase Independent requests", exact: true })
    .click({ clickCount: 3 });
  await expect
    .poll(async () => {
      const data = (await (
        await accounts.rbt.get("/api/workspace/overview")
      ).json()) as WorkspaceData;
      return data.sessions
        .find((s) => s._id === scheduled._id)
        ?.behaviorData.find((b) => b.behaviorName === "Independent requests")
        ?.frequency;
    })
    .toBe(3);
  await rbt.reload();
  await expect(
    rbt
      .locator(".counter")
      .filter({ hasText: "Independent requests" })
      .locator("strong"),
  ).toHaveText("3");
  await rbt.getByRole("button", { name: "Observed ✓", exact: true }).click();
  await rbt.getByRole("button", { name: "Not observed", exact: true }).click();
  await rbt.getByRole("button", { name: "Add ABC observation" }).click();
  await rbt
    .getByLabel("Antecedent", { exact: true })
    .fill("SYNTHETIC DEMO: transition cue presented.");
  await rbt
    .getByLabel("Observed behavior", { exact: true })
    .fill("SYNTHETIC DEMO: moved toward the next activity.");
  await rbt
    .getByLabel("Consequence", { exact: true })
    .fill("SYNTHETIC DEMO: recorded the observed response.");
  await rbt.getByRole("button", { name: "Save ABC observation" }).click();
  await rbt.getByRole("button", { name: "End session", exact: true }).click();
  await expect(
    rbt.getByText("Your session observations are saved.", { exact: false }),
  ).toBeVisible();
  // Deterministic UI fixture; external Groq availability is reported separately.
  await rbt.route("**/api/ai-notes", (route) =>
    route.fulfill({
      json: {
        note: "TEST AI FIXTURE — SYNTHETIC DATA. Objective draft based on recorded counts. Clinician review is required.",
      },
    }),
  );
  await rbt.getByRole("button", { name: "Generate AI draft" }).click();
  const editor = rbt.getByRole("textbox", {
    name: "Your reviewed version",
    exact: true,
  });
  await expect(editor).toHaveValue(/TEST AI FIXTURE/);
  const finalText =
    "TEST AI FIXTURE — SYNTHETIC DATA. Edited clinical note: three independent requests and one of two successful transition intervals were recorded. ABC context was reviewed by the author.";
  await editor.fill(finalText);
  await rbt.getByRole("checkbox", { name: /I reviewed this note/ }).check();
  await rbt
    .getByRole("button", { name: "Submit for review", exact: true })
    .click();
  let note: NoteDTO | undefined;
  await expect
    .poll(async () => {
      const result = await (await accounts.rbt.get("/api/notes")).json();
      note = result.notes.find((n: NoteDTO) => n.sessionId === scheduled._id);
      return note?.summary;
    })
    .toBe(finalText);
  const saved = (await (
    await accounts.rbt.get("/api/workspace/overview")
  ).json()) as WorkspaceData;
  const completed = saved.sessions.find(
    (s) => s._id === scheduled._id,
  ) as SessionDTO;
  expect(completed.status).toBe("COMPLETED");
  expect(completed.abcData).toHaveLength(1);
  const bcbaContext = await browser.newContext({
    storageState: await accounts.bcba.storageState(),
  });
  const bcba = await bcbaContext.newPage();
  await bcba.goto(`/director/notes?note=${note!._id}`);
  await expect(bcba.getByRole("dialog")).toBeVisible();
  await bcba
    .getByRole("checkbox", { name: /I have reviewed this note/ })
    .check();
  await bcba.getByRole("button", { name: "Approve & lock" }).click();
  await expect(
    bcba.getByText(
      "Note approved. A billing draft is ready for Admin review.",
      { exact: true },
    ),
  ).toBeVisible();
  const ledger = await (await accounts.admin.get("/api/claims")).json();
  expect(
    ledger.claims.filter((c: { noteId: string }) => c.noteId === note!._id),
  ).toHaveLength(1);
  const claim = ledger.claims.find(
    (c: { status: string }) => c.status === "Submitted",
  );
  const adminContext = await browser.newContext({
    storageState: await accounts.admin.storageState(),
  });
  const admin = await adminContext.newPage();
  await admin.goto("/admin/billing");
  await admin
    .locator(`tr[data-record-id="${claim._id}"]`)
    .getByRole("button", { name: /Review/ })
    .click();
  await admin
    .getByRole("combobox", { name: "Recorded status", exact: true })
    .selectOption("Paid");
  await admin
    .getByLabel("Payer reference", { exact: true })
    .fill("SYNTHETIC-TEST-PAYMENT");
  await admin.getByRole("button", { name: "Save ledger update" }).click();
  await expect
    .poll(async () => {
      const updated = await (await accounts.admin.get("/api/claims")).json();
      return updated.claims.find((c: { _id: string }) => c._id === claim._id)
        .status;
    })
    .toBe("Paid");
  await Promise.all([
    rbtContext.close(),
    bcbaContext.close(),
    adminContext.close(),
  ]);
});
test("AI failure preserves saved observations and allows a manual note", async ({
  browser,
  accounts,
}) => {
  const state = (await (
    await accounts.rbt.get("/api/workspace/overview")
  ).json()) as WorkspaceData;
  const s = state.sessions.find((s) => s.status === "SCHEDULED")!;
  const start = await accounts.rbt.patch("/api/workspace/sessions", {
    data: { id: s._id, action: "start", revision: s.revision },
  });
  expect(start.status()).toBe(200);
  const current = (await start.json()).session as SessionDTO;
  expect(
    (
      await accounts.rbt.patch("/api/workspace/sessions", {
        data: { id: s._id, action: "complete", revision: current.revision },
      })
    ).status(),
  ).toBe(200);
  const context = await browser.newContext({
    storageState: await accounts.rbt.storageState(),
  });
  const page = await context.newPage();
  await page.goto("/tech/notes");
  await page
    .locator(`[data-session-id="${s._id}"]`)
    .getByRole("button", { name: "Finish note" })
    .click();
  await page.route("**/api/ai-notes", (route) =>
    route.fulfill({
      status: 503,
      json: { message: "TEST PROVIDER FAILURE: write the note manually." },
    }),
  );
  await page.getByRole("button", { name: "Generate AI draft" }).click();
  await expect(page.locator(".notice[role=alert]")).toContainText(
    "TEST PROVIDER FAILURE",
  );
  await page
    .getByLabel("Clinical session note", { exact: true })
    .fill(
      "SYNTHETIC MANUAL NOTE. Observations were reviewed and documented without an AI draft. No real patient information.",
    );
  await page.getByRole("checkbox", { name: /I reviewed this note/ }).check();
  await page
    .getByRole("button", { name: "Submit for review", exact: true })
    .click();
  await expect
    .poll(async () => {
      const result = await (await accounts.rbt.get("/api/notes")).json();
      return result.notes.some(
        (n: NoteDTO) =>
          n.summary.startsWith("SYNTHETIC MANUAL NOTE") && !n.aiGenerated,
      );
    })
    .toBe(true);
  await context.close();
});
