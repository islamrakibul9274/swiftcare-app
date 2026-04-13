"use server";

import { signOut } from "@/auth";

export async function logoutAction() {
  // In NextAuth v5, we use 'redirectTo' instead of 'callbackUrl'
  await signOut({ redirectTo: "/login" });
}