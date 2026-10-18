"use client";
import { useHydrated } from "@/components/ui";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { passwordSchema, emailSchema } from "@/lib/validation";
export default function AccessForm({ mode }: { mode: "reset" | "set" }) {
  const hydrated = useHydrated();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const value = String(
      form.get(mode === "reset" ? "email" : "password") || "",
    );
    const parsed = (mode === "reset" ? emailSchema : passwordSchema).safeParse(
      value,
    );
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    if (mode === "set" && value !== form.get("confirm")) {
      setError("The passwords do not match.");
      return;
    }
    const token = new URLSearchParams(window.location.hash.slice(1)).get(
      "token",
    );
    if (mode === "set" && !token) {
      setError(
        "Open the complete secure link from your invitation or reset email.",
      );
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(
        `/api/account/${mode === "reset" ? "request-reset" : "set-password"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            mode === "reset" ? { email: value } : { token, password: value },
          ),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setMessage(data.message);
      if (mode === "set")
        history.replaceState(null, "", window.location.pathname);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form method="post" onSubmit={submit} className="form-stack">
      {error && (
        <p role="alert" className="notice danger">
          {error}
        </p>
      )}
      {message ? (
        <div role="status" className="notice">
          {message}
          <p>
            <Link href="/login" className="text-link">
              Return to sign in →
            </Link>
          </p>
        </div>
      ) : (
        <>
          {mode === "reset" ? (
            <label className="field">
              Work email
              <input name="email" type="email" autoComplete="email" required />
            </label>
          ) : (
            <>
              <label className="field">
                New password
                <input
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={12}
                />
              </label>
              <label className="field">
                Confirm password
                <input
                  name="confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={12}
                />
              </label>
              <p className="small muted">
                At least 12 characters, including uppercase, lowercase, and a
                number. Maximum 72 UTF-8 bytes.
              </p>
            </>
          )}
          <button disabled={!hydrated || busy} className="button primary full">
            {busy
              ? "Saving…"
              : mode === "reset"
                ? "Request a reset link"
                : "Set my password"}
          </button>
        </>
      )}
    </form>
  );
}
