import { api } from "@/lib/api";
import { AppError } from "@/lib/errors";
export const POST = api(async () => {
  throw new AppError(
    403,
    "Staff accounts are created by a clinic administrator. Use your invitation link to join.",
    "INVITE_REQUIRED",
  );
});
