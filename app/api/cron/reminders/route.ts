import { createHash, timingSafeEqual } from "node:crypto";
import { api } from "@/lib/api";
import { AppError } from "@/lib/errors";
import { credentialReminders } from "@/lib/reminders";
export const GET = api(async (request) => {
  const secret = process.env.CRON_SECRET;
  if (!secret)
    throw new AppError(503, "Scheduled reminders are not configured.");
  const expected = createHash("sha256").update(`Bearer ${secret}`).digest();
  const supplied = createHash("sha256")
    .update(request.headers.get("authorization") || "")
    .digest();
  if (!timingSafeEqual(expected, supplied))
    throw new AppError(401, "Unauthorized.");
  return credentialReminders();
});
