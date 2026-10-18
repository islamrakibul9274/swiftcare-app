import "@auth/core/jwt";
import type { DefaultSession } from "next-auth";
import type { Role } from "@/lib/policy";
declare module "next-auth" {
  interface User {
    role: Role;
    sessionVersion: number;
    forcePasswordChange: boolean;
  }
  interface Session {
    user: {
      id: string;
      role: Role;
      sessionVersion: number;
      forcePasswordChange: boolean;
      sid: string;
    } & DefaultSession["user"];
  }
}
declare module "@auth/core/jwt" {
  interface JWT {
    role?: Role;
    sessionVersion?: number;
    forcePasswordChange?: boolean;
    sid?: string;
    absoluteExpiry?: number;
  }
}
