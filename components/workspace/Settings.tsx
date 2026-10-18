"use client";
import { useState, type FormEvent } from "react";
import { signOut } from "next-auth/react";
import { Button, PageHeading } from "@/components/ui";
import { ThemeControl } from "./AppShell";
import { useWorkspace, useTask, FormError } from "./context";
import { request } from "@/lib/client";
import { profileSchema } from "@/lib/validation";
export default function Settings() {
  const { data } = useWorkspace();
  const task = useTask();
  const [billingBusy, setBillingBusy] = useState(false);
  async function profile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = profileSchema.safeParse({
      name: form.get("name"),
      notificationPreferences: form.get("notifications") === "on",
      ...(form.get("newPassword")
        ? {
            currentPassword: String(form.get("currentPassword")),
            newPassword: String(form.get("newPassword")),
          }
        : {}),
    });
    if (!parsed.success) {
      await task.run(async () => {
        throw new Error(parsed.error.issues[0].message);
      });
      return;
    }
    await task.run(async () => {
      const result = await request<{ signOut: boolean }>(
        "/api/workspace/profile",
        { method: "PATCH", body: JSON.stringify(parsed.data) },
      );
      if (result.signOut)
        await signOut({ redirectTo: "/login?passwordChanged=1" });
    }, "Your preferences are saved.");
  }
  async function billing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBillingBusy(true);
    await task.run(
      () =>
        request("/api/workspace/clinic", {
          method: "PATCH",
          body: JSON.stringify({
            ratePerUnit: Number(form.get("rate")),
            billingCode: String(form.get("code")),
          }),
        }),
      "Billing defaults saved.",
    );
    setBillingBusy(false);
  }
  return (
    <>
      <PageHeading
        eyebrow="Your workspace, your way"
        title="Settings"
        description="Manage your profile, account security, and the details that make your workday feel right."
      />
      <div className="settings-layout">
        <aside className="panel settings-nav">
          <a href="#profile-settings">Profile & account</a>
          <a href="#appearance">Appearance</a>
          {data.actor.role === "ADMIN" && (
            <a href="#billing-defaults">Billing defaults</a>
          )}
        </aside>
        <div className="stack">
          <section className="panel panel-pad" id="profile-settings">
            <h2>Profile & account</h2>
            <p className="muted small" style={{ marginTop: 7 }}>
              Your clinic role is managed by an administrator.
            </p>
            {data.actor.forcePasswordChange && (
              <p className="notice warning section-gap">
                Choose a new password before returning to your clinical
                workspace.
              </p>
            )}
            <form method="post" className="form-stack" onSubmit={profile}>
              <label className="field">
                Your name
                <input
                  name="name"
                  defaultValue={data.actor.name}
                  required
                  minLength={2}
                  maxLength={100}
                />
              </label>
              <label className="field">
                Work email
                <input type="email" value={data.actor.email} readOnly />
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="notifications"
                  defaultChecked={data.actor.notificationPreferences}
                />
                Receive in-app workflow notifications for note submissions and
                review updates
              </label>
              <div
                style={{ borderTop: "1px solid var(--border)", paddingTop: 20 }}
              >
                <h3>Change your password</h3>
                <p className="form-note" style={{ marginTop: 7 }}>
                  Use 12 or more characters with uppercase, lowercase, and a
                  number. Changing your password signs out all existing
                  sessions.
                </p>
              </div>
              <label className="field">
                Current password
                <input
                  name="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  required={data.actor.forcePasswordChange}
                />
              </label>
              <label className="field">
                New password
                <input
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  required={data.actor.forcePasswordChange}
                />
              </label>
              <FormError error={task.error} />
              <div className="row-end">
                <Button type="submit" variant="primary" busy={task.busy}>
                  Save profile & preferences
                </Button>
              </div>
            </form>
          </section>
          <section className="panel panel-pad" id="appearance">
            <div className="row-between">
              <div>
                <h2>Make yourself comfortable.</h2>
                <p className="small muted" style={{ marginTop: 7 }}>
                  Follow your system appearance or choose a theme.
                </p>
              </div>
              <div className="settings-theme">
                <ThemeControl />
              </div>
            </div>
          </section>
          {data.actor.role === "ADMIN" && !data.actor.forcePasswordChange && (
            <section className="panel panel-pad" id="billing-defaults">
              <h2>Billing defaults</h2>
              <p className="form-note" style={{ marginTop: 8 }}>
                New clinical approvals create a draft using completed 15-minute
                units and your configured rate. Review every draft before
                recording submission. Existing claims keep their original
                values.
              </p>
              <form method="post" className="form-stack" onSubmit={billing}>
                <div className="form-grid">
                  <label className="field">
                    Rate per 15-minute unit (USD)
                    <input
                      name="rate"
                      type="number"
                      min={0}
                      max={10000}
                      step="0.01"
                      defaultValue={data.clinic.ratePerUnit}
                      required
                    />
                  </label>
                  <label className="field">
                    Default CPT code
                    <input
                      name="code"
                      pattern="[0-9]{5}"
                      defaultValue={data.clinic.billingCode}
                      required
                    />
                  </label>
                </div>
                <Button type="submit" busy={billingBusy}>
                  Save billing defaults
                </Button>
              </form>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
