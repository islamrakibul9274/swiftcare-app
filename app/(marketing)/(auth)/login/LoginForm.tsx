"use client";
import { useHydrated } from "@/components/ui";
import { useState, type FormEvent } from "react";
import { getSession, signIn } from "next-auth/react";
import Link from "next/link";
import { safeReturnUrl } from "@/lib/policy";
import { loginSchema } from "@/lib/validation";
export default function LoginForm({
  callbackUrl,
  expired = false,
}: {
  callbackUrl?: string;
  expired?: boolean;
}) {
  const hydrated = useHydrated();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const input = loginSchema.safeParse({
      email: form.get("email"),
      password: form.get("password"),
    });
    if (!input.success) {
      setError("Enter a valid email and your password.");
      return;
    }
    setBusy(true);
    try {
      const result = await signIn("credentials", {
        ...input.data,
        redirect: false,
      });
      if (result?.error) throw new Error("Sign-in failed");
      const session = await getSession();
      if (!session?.user?.role) throw new Error("No session");
      window.location.assign(
        session.user.forcePasswordChange
          ? "/settings?required=1"
          : safeReturnUrl(callbackUrl, session.user.role),
      );
    } catch {
      setError(
        "We could not sign you in. Check your email and password, or wait a few minutes before trying again.",
      );
      setBusy(false);
    }
  }
  return (
    <form method="post" onSubmit={submit} className="form-stack">
      {expired && (
        <p className="notice">
          Your session ended. Sign in again to continue safely.
        </p>
      )}
      {error && (
        <p className="notice danger" role="alert">
          {error}
        </p>
      )}
      <label className="field">
        Work email
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          maxLength={254}
          placeholder="you@yourclinic.com"
        />
      </label>
      <label className="field">
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={200}
          placeholder="Enter your password"
        />
      </label>
      <div className="row-end">
        <Link href="/forgot-password" className="text-link">
          Forgot password?
        </Link>
      </div>
      <button className="button primary full" disabled={!hydrated || busy}>
        {busy ? "Signing in…" : "Sign in to your workspace"}
        <span aria-hidden="true">↗</span>
      </button>
      <p className="muted small">
        For shared clinical devices, your session ends after 15 minutes of
        inactivity.
      </p>
    </form>
  );
}
