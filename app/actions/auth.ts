"use server";

import { signOut } from "@/auth";

/**
 * Server Action to securely clear the session and 
 * redirect the user to the login portal.
 */
export async function logoutAction() {
  try {
    await signOut({ redirectTo: "/" });
  } catch (error) {
    // In Next.js Server Actions, redirects are actually thrown as errors.
    // We must re-throw the error so Next.js can handle the redirection.
    throw error;
  }
}