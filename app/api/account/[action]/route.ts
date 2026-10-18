import { after } from "next/server";
import { api, body } from "@/lib/api";
import dbConnect from "@/lib/db";
import { rateLimit, requestAddress } from "@/lib/rate-limit";
import { resetRequestSchema, tokenPasswordSchema } from "@/lib/validation";
import {
  consumeAccountToken,
  issueAccountToken,
  sendAccountLink,
} from "@/lib/accounts";
import { AppError } from "@/lib/errors";
import User from "@/models/User";
export const POST = api(
  async (request, context: { params: Promise<{ action: string }> }) => {
    const { action } = await context.params;
    await rateLimit(`account:${requestAddress(request)}`, 10, 900000);
    if (action === "request-reset") {
      const { email } = await body(request, resetRequestSchema);
      await rateLimit(`reset:${email}`, 3, 900000);
      await dbConnect();
      const user = await User.findOne({ email, active: { $ne: false } });
      if (user && process.env.RESEND_API_KEY && process.env.MAIL_FROM) {
        after(async () => {
          try {
            await sendAccountLink(
              email,
              await issueAccountToken(String(user._id), "RESET"),
              "RESET",
            );
          } catch {
            console.error("Password reset delivery unavailable");
          }
        });
      }
      return {
        message:
          "If this account is active, a reset link will be sent when email delivery is configured. Your clinic administrator can also issue a secure reset link.",
      };
    }
    if (action === "set-password") {
      const data = await body(request, tokenPasswordSchema);
      await consumeAccountToken(data.token, data.password);
      return { message: "Password set. Sign in with your new password." };
    }
    throw new AppError(404, "This account action is unavailable.");
  },
);
