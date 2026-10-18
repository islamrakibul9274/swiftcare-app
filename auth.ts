import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { AuditEvent, LoginSession } from "@/models/Security";
import { ABSOLUTE_MS, type Role } from "@/lib/policy";
import { loginSchema } from "@/lib/validation";
import { rateLimit, requestAddress } from "@/lib/rate-limit";
const dummyHash = bcrypt.hashSync("unavailable-account-comparison", 12);
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: { email: { type: "email" }, password: { type: "password" } },
      async authorize(credentials, request) {
        const parsed = loginSchema.safeParse({
          email: credentials.email,
          password: credentials.password,
        });
        if (!parsed.success) return null;
        try {
          await rateLimit(`login:ip:${requestAddress(request)}`, 40, 900000);
          await rateLimit(`login:email:${parsed.data.email}`, 10, 900000);
          await dbConnect();
          const user = await User.findOne({ email: parsed.data.email })
            .select("+password")
            .lean();
          const valid = await bcrypt.compare(
            parsed.data.password,
            user?.password || dummyHash,
          );
          if (!valid || !user || user.active === false) return null;
          if (user.clinicId)
            await AuditEvent.create({
              clinicId: user.clinicId,
              actorId: String(user._id),
              actorName: user.name,
              action: "sign_in",
              resource: "account",
            });
          return {
            id: String(user._id),
            name: user.name,
            email: user.email,
            role: user.role as Role,
            sessionVersion: user.sessionVersion ?? 0,
            forcePasswordChange: user.forcePasswordChange ?? false,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: ABSOLUTE_MS / 1000 },
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.sessionVersion = user.sessionVersion;
        token.forcePasswordChange = user.forcePasswordChange;
        token.sid = randomUUID();
        token.absoluteExpiry = Date.now() + ABSOLUTE_MS;
        await LoginSession.create({
          _id: token.sid,
          userId: user.id,
          lastActivity: new Date(),
          expiresAt: new Date(token.absoluteExpiry),
        });
      }
      if (!token.absoluteExpiry || Date.now() >= token.absoluteExpiry)
        return null;
      return token;
    },
    async session({ session, token }) {
      if (token.sub && token.role && token.sid)
        Object.assign(session.user, {
          id: token.sub,
          role: token.role,
          sessionVersion: token.sessionVersion ?? 0,
          forcePasswordChange: token.forcePasswordChange ?? false,
          sid: token.sid,
        });
      return session;
    },
  },
  events: {
    async signOut(message) {
      if ("token" in message && message.token?.sid) {
        try {
          await dbConnect();
          await LoginSession.deleteOne({ _id: message.token.sid });
        } catch {
          // A database outage must not prevent clearing the browser's cookie.
          console.error("Session revocation unavailable");
        }
      }
    },
  },
  logger: {
    error(error) {
      console.error("Authentication request failed", { category: error.name });
    },
    warn(code) {
      console.warn("Authentication warning", { code });
    },
    debug() {},
  },
});
