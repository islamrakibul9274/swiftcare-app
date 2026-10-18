import AxeBuilder from "@axe-core/playwright";
import { test, expect, type Account } from "./fixtures";
const pages: Record<string, string[]> = {
  public: [
    "/",
    "/login",
    "/register",
    "/forgot-password",
    "/set-password",
    "/unauthorized",
  ],
  admin: [
    "/admin",
    "/admin/staff",
    "/admin/billing",
    "/admin/audit",
    "/clients",
    "/clients/200000000000000000000001",
    "/schedule",
    "/settings",
    "/notifications",
  ],
  bcba: [
    "/director",
    "/director/notes",
    "/director/graphs",
    "/director/supervision",
    "/director/client/200000000000000000000001",
    "/settings",
    "/notifications",
    "/clients",
    "/clients/200000000000000000000001",
    "/schedule",
  ],
  rbt: [
    "/tech",
    "/tech/notes",
    "/clients",
    "/clients/200000000000000000000001",
    "/schedule",
    "/settings",
    "/notifications",
  ],
};
for (const width of [375, 768, 1440])
  for (const theme of ["light", "dark"] as const)
    test(`${width}px ${theme}: every workspace route renders without overflow or runtime errors`, async ({
      browser,
      accounts,
    }, testInfo) => {
      test.setTimeout(180000);
      for (const [role, paths] of Object.entries(pages)) {
        const context = await browser.newContext({
          viewport: { width, height: 1000 },
          storageState:
            role === "public"
              ? undefined
              : await accounts[role as Account].storageState(),
          colorScheme: theme,
        });
        await context.addInitScript(
          (value) => localStorage.setItem("swiftcare-theme", value),
          theme,
        );
        const page = await context.newPage();
        const errors: string[] = [];
        page.on("pageerror", (e) => errors.push(e.message));
        page.on("console", (message) => {
          if (
            message.type() === "error" &&
            /hydration|hydrated|did not match/i.test(message.text())
          )
            errors.push(message.text());
        });
        page.on("requestfailed", (failed) => {
          const reason = failed.failure()?.errorText || "";
          if (!reason.includes("ERR_ABORTED"))
            errors.push(`${failed.url()}: ${reason}`);
        });
        for (const path of paths) {
          const response = await page.goto(path);
          expect(response?.status(), path).toBe(200);
          await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
          await expect(page.locator(".skeleton:visible")).toHaveCount(0, {
            timeout: 30000,
          });
          expect(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth + 1,
            ),
            path,
          ).toBe(true);
          expect(await page.locator('a[href="#"]').count(), path).toBe(0);
          if (
            path ===
              `/${role === "bcba" ? "director" : role === "rbt" ? "tech" : "admin"}` ||
            path === "/"
          )
            await page.screenshot({
              path: testInfo.outputPath(`${role}-${width}-${theme}.png`),
              fullPage: true,
              caret: "initial",
            });
        }
        expect(errors).toEqual([]);
        await context.close();
      }
    });
test("WCAG automated checks and keyboard command navigation", async ({
  browser,
  accounts,
}) => {
  test.setTimeout(120000);
  for (const [role, path] of [
    ["public", "/login"],
    ["public", "/"],
    ["bcba", "/director"],
    ["admin", "/admin/billing"],
    ["rbt", "/tech/notes"],
  ]) {
    const context = await browser.newContext({
      storageState:
        role === "public"
          ? undefined
          : await accounts[role as Account].storageState(),
    });
    const page = await context.newPage();
    await page.goto(path);
    await expect(page.locator(".skeleton:visible")).toHaveCount(0, {
      timeout: 30000,
    });
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      result.violations.map((v) => ({
        id: v.id,
        description: v.description,
        nodes: v.nodes.map((n) => n.target),
      })),
      path,
    ).toEqual([]);
    if (role === "bcba") {
      await page.keyboard.press("Control+k");
      await expect(
        page.getByRole("dialog", { name: "Find your way" }),
      ).toBeVisible();
      await expect(
        page.getByPlaceholder("Search clients, notes, or pages…"),
      ).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toHaveCount(0);
    }
    await context.close();
  }
});

test("white is the default appearance even with a dark system preference", async ({
  browser,
}) => {
  const context = await browser.newContext({ colorScheme: "dark" });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect(
    await page
      .locator("body")
      .evaluate((element) => getComputedStyle(element).backgroundColor),
  ).toBe("rgb(255, 255, 255)");
  await context.close();
});

test("clinical chart export produces a usable image", async ({
  browser,
  accounts,
}, testInfo) => {
  const context = await browser.newContext({
    storageState: await accounts.bcba.storageState(),
  });
  const page = await context.newPage();
  await page.goto("/director/graphs");
  await page.locator(".recharts-wrapper").waitFor();
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export chart as image" }).click();
  const file = await downloaded;
  expect(file.suggestedFilename()).toBe("swiftcare-chart.png");
  const target = testInfo.outputPath("clinical-chart.png");
  await file.saveAs(target);
  const { readFile } = await import("node:fs/promises");
  const bytes = await readFile(target);
  expect([...bytes.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  await context.close();
});
