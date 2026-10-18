import { readFile } from "node:fs/promises";
import mongoose from "mongoose";
import { test, expect, origin, password } from "./fixtures";
test("expired sessions and expired one-time links are denied", async ({
  accounts,
  request,
}) => {
  const runtime = JSON.parse(
    await readFile(".local/demo-runtime-3000.json", "utf8"),
  );
  expect(runtime.mode).toBe("synthetic-demo");
  expect(runtime.mongoUri).toMatch(/^mongodb:\/\/127\.0\.0\.1:/);
  expect(runtime.mongoUri).toContain("swiftcare_demo");
  await mongoose.connect(runtime.mongoUri, {
    autoIndex: false,
    autoCreate: false,
  });
  try {
    const user = await mongoose.connection
      .collection("users")
      .findOne({ email: "outsider@demo.swiftcare.example" });
    await mongoose.connection
      .collection("loginsessions")
      .updateMany(
        { userId: String(user!._id) },
        { $set: { lastActivity: new Date(Date.now() - 16 * 60000) } },
      );
    expect(
      (await accounts.outsider.get("/api/workspace/profile")).status(),
    ).toBe(401);
    const expiredPage = await accounts.outsider.get("/tech");
    expect(expiredPage.status()).toBe(200);
    expect(expiredPage.url()).toContain("/login?expired=1");
    expect(await expiredPage.text()).toContain("Your session ended.");
    const email = `expired-${Date.now()}@demo.swiftcare.example`;
    const invite = await accounts.admin.post("/api/workspace/staff", {
      data: { name: "Expired Synthetic Invite", email, role: "RBT" },
    });
    expect(invite.status()).toBe(200);
    const token = new URLSearchParams(
      new URL((await invite.json()).link).hash.slice(1),
    ).get("token");
    const invited = await mongoose.connection
      .collection("users")
      .findOne({ email });
    await mongoose.connection
      .collection("accounttokens")
      .updateMany(
        { userId: invited!._id },
        { $set: { expiresAt: new Date(Date.now() - 1000) } },
      );
    expect(
      (
        await request.post("/api/account/set-password", {
          headers: { Origin: origin },
          data: { token, password },
        })
      ).status(),
    ).toBe(400);
  } finally {
    await mongoose.disconnect();
  }
});
test("reset endpoint throttles repeated unauthenticated attempts", async ({
  request,
}) => {
  const statuses = [];
  for (let i = 0; i < 12; i++)
    statuses.push(
      (
        await request.post("/api/account/request-reset", {
          headers: { Origin: origin },
          data: { email: `nonexistent-${i}@demo.swiftcare.example` },
        })
      ).status(),
    );
  expect(statuses).toContain(429);
});
