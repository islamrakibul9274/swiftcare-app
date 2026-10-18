import "server-only";
import { createHash } from "node:crypto";
import dbConnect from "@/lib/db";
import { RateBucket } from "@/models/Security";
import { AppError } from "@/lib/errors";
export async function rateLimit(
  key: string,
  maximum: number,
  windowMs: number,
) {
  await dbConnect();
  const slot = Math.floor(Date.now() / windowMs);
  const digest = createHash("sha256").update(key).digest("hex");
  const bucket = await RateBucket.findOneAndUpdate(
    { _id: `${digest}:${slot}` },
    {
      $inc: { hits: 1 },
      $setOnInsert: { expiresAt: new Date((slot + 2) * windowMs) },
    },
    { upsert: true, returnDocument: "after" },
  );
  if (bucket.hits > maximum)
    throw new AppError(
      429,
      "Too many attempts. Please wait before trying again.",
      "RATE_LIMITED",
    );
}
export function requestAddress(request: Request) {
  return (
    (process.env.VERCEL === "1"
      ? request.headers.get("x-vercel-forwarded-for")
      : request.headers.get("x-forwarded-for")
    )
      ?.split(",")[0]
      ?.trim() || "local"
  );
}
