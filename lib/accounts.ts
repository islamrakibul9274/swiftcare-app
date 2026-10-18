import "server-only";
import { createHash, randomBytes } from "node:crypto";
import mongoose, { type ClientSession } from "mongoose";
import bcrypt from "bcryptjs";
import { AccountToken } from "@/models/Security";
import User from "@/models/User";
import { AppError } from "@/lib/errors";
export async function issueAccountToken(
  userId: string,
  purpose: "INVITE" | "RESET",
  session?: ClientSession,
) {
  const token = randomBytes(32).toString("hex");
  const digest = createHash("sha256").update(token).digest("hex");
  await AccountToken.updateMany(
    { userId, purpose, usedAt: { $exists: false } },
    { $set: { usedAt: new Date() } },
    { session },
  );
  await AccountToken.create(
    [
      {
        userId,
        purpose,
        digest,
        expiresAt: new Date(
          Date.now() + (purpose === "INVITE" ? 86400000 : 1800000),
        ),
      },
    ],
    session ? { session } : {},
  );
  return `${process.env.AUTH_URL || "http://localhost:3000"}/set-password#token=${token}`;
}
export async function sendAccountLink(
  email: string,
  link: string,
  purpose: "INVITE" | "RESET",
) {
  if (!process.env.RESEND_API_KEY || !process.env.MAIL_FROM) return false;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.MAIL_FROM,
      to: [email],
      subject:
        purpose === "INVITE"
          ? "Your SwiftCare invitation"
          : "Reset your SwiftCare password",
      text: `Use this one-time link to set your SwiftCare password: ${link}\nThis link expires ${purpose === "INVITE" ? "in 24 hours" : "in 30 minutes"}. If you did not request this, ignore this message.`,
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok)
    throw new AppError(
      503,
      "Email delivery is unavailable. An administrator can provide a fresh secure link.",
    );
  return true;
}
export async function consumeAccountToken(token: string, password: string) {
  const digest = createHash("sha256").update(token).digest("hex");
  const hash = await bcrypt.hash(password, 12);
  await mongoose.connection.transaction(async (session) => {
    const record = await AccountToken.findOneAndUpdate(
      { digest, usedAt: { $exists: false }, expiresAt: { $gt: new Date() } },
      { $set: { usedAt: new Date() } },
      { session, returnDocument: "after" },
    );
    if (!record)
      throw new AppError(
        400,
        "This link is invalid or expired. Request a new secure link.",
        "INVALID_TOKEN",
      );
    const user = await User.findById(record.userId).session(session);
    if (!user || (record.purpose === "RESET" && user.active === false))
      throw new AppError(
        400,
        "This link is invalid or expired.",
        "INVALID_TOKEN",
      );
    user.password = hash;
    user.active = true;
    user.forcePasswordChange = false;
    user.sessionVersion = (user.sessionVersion ?? 0) + 1;
    await user.save({ session });
    await AccountToken.updateMany(
      { userId: user._id, usedAt: { $exists: false } },
      { $set: { usedAt: new Date() } },
      { session },
    );
  });
}
