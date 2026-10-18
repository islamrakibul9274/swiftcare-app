"use client";
import { useState, type FormEvent } from "react";
import {
  Badge,
  Button,
  Empty,
  Icon,
  Modal,
  PageHeading,
  useToast,
} from "@/components/ui";
import { useTask, useWorkspace, FormError } from "./context";
import { dateLabel, request } from "@/lib/client";
import { inviteSchema } from "@/lib/validation";
import type { Person } from "@/lib/dto";
function SecureLink({ link }: { link: string }) {
  const toast = useToast();
  return (
    <div className="stack">
      <p className="notice">
        Treat this as a password. Share it only with the intended staff member
        using your approved secure channel.
      </p>
      <code className="secure-link">{link}</code>
      <Button
        onClick={() =>
          navigator.clipboard
            .writeText(link)
            .then(() => toast("Secure link copied."))
            .catch(() => toast("Select and copy the link above.", true))
        }
      >
        Copy secure link
      </Button>
    </div>
  );
}
function StaffForm({
  person,
  onClose,
}: {
  person?: Person;
  onClose: () => void;
}) {
  const { data } = useWorkspace();
  const task = useTask();
  const [link, setLink] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    let payload: unknown;
    if (person)
      payload = {
        id: person._id,
        ...(person._id !== data.actor.id
          ? { role: form.get("role"), active: form.get("active") === "on" }
          : {}),
        credential: String(form.get("credential") || ""),
        credentialExpiresAt: form.get("expiry")
          ? new Date(String(form.get("expiry")) + "T12:00:00").toISOString()
          : null,
      };
    else {
      const parsed = inviteSchema.safeParse({
        name: form.get("name"),
        email: form.get("email"),
        role: form.get("role"),
        credential: String(form.get("credential") || ""),
        ...(form.get("expiry")
          ? {
              credentialExpiresAt: new Date(
                String(form.get("expiry")) + "T12:00:00",
              ).toISOString(),
            }
          : {}),
      });
      if (!parsed.success) {
        await task.run(async () => {
          throw new Error(parsed.error.issues[0].message);
        });
        return;
      }
      payload = parsed.data;
    }
    const ok = await task.run(
      async () => {
        const result = await request<{ link?: string }>(
          "/api/workspace/staff",
          { method: person ? "PATCH" : "POST", body: JSON.stringify(payload) },
        );
        if (result.link) setLink(result.link);
      },
      person ? "Staff profile updated." : "Invitation created.",
    );
    if (ok && person) onClose();
  }
  async function issue() {
    await task.run(async () => {
      const result = await request<{ link: string }>("/api/workspace/staff", {
        method: "PATCH",
        body: JSON.stringify({ id: person!._id, reset: true }),
      });
      setLink(result.link);
    }, "A new one-time account link is ready.");
  }
  return (
    <Modal
      title={
        link
          ? "Your secure account link"
          : person
            ? "Manage staff access"
            : "Invite someone who makes a difference"
      }
      onClose={onClose}
    >
      {link ? (
        <SecureLink link={link} />
      ) : (
        <form method="post" className="form-stack" onSubmit={submit}>
          {!person && (
            <>
              <label className="field">
                Full name
                <input name="name" required minLength={2} maxLength={100} />
              </label>
              <label className="field">
                Work email
                <input name="email" type="email" required maxLength={254} />
              </label>
            </>
          )}
          <label className="field">
            Workspace role
            <select
              name="role"
              defaultValue={person?.role || "RBT"}
              disabled={person?._id === data.actor.id}
            >
              <option value="RBT">Behavior technician (RBT)</option>
              <option value="BCBA">Clinical director (BCBA)</option>
              <option value="ADMIN">Clinic administrator</option>
            </select>
          </label>
          <div className="form-grid">
            <label className="field">
              Credential / certification
              <input
                name="credential"
                defaultValue={person?.credential || ""}
                maxLength={100}
              />
            </label>
            <label className="field">
              Credential expiry
              <input
                name="expiry"
                type="date"
                defaultValue={person?.credentialExpiresAt?.slice(0, 10) || ""}
              />
            </label>
          </div>
          {person && (
            <label className="checkbox-label">
              <input
                name="active"
                type="checkbox"
                defaultChecked={person.active}
                disabled={person._id === data.actor.id}
              />
              Account has active access
            </label>
          )}
          <p className="form-note">
            Access changes revoke existing sessions immediately. Reassign active
            clients before changing a BCBA’s access. Invited staff choose their
            password through a single-use link.
          </p>
          <FormError error={task.error} />
          <div className="modal-footer">
            {person && (
              <Button
                type="button"
                onClick={() => void issue()}
                busy={task.busy}
              >
                Issue secure account link
              </Button>
            )}
            <Button type="submit" variant="primary" busy={task.busy}>
              {person ? "Save profile" : "Create invitation"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
export default function Staff() {
  const { data } = useWorkspace();
  const reminders = useTask();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("All");
  const [editing, setEditing] = useState<Person | null>(null);
  const [invite, setInvite] = useState(false);
  const staff = data.staff.filter(
    (s) =>
      (role === "All" || s.role === role) &&
      `${s.name} ${s.email}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        eyebrow="The people behind the progress"
        title="Care team"
        description="Manage invitations, access, roles, and the credentials that keep your practice moving."
        action={
          <>
            <Button
              busy={reminders.busy}
              onClick={() =>
                void reminders.run(async () => {
                  await request("/api/workspace/reminders", {
                    method: "POST",
                    body: "{}",
                  });
                  window.dispatchEvent(new Event("swiftcare-notifications"));
                }, "Credential reminders checked.")
              }
            >
              Check reminders
            </Button>
            <Button variant="primary" onClick={() => setInvite(true)}>
              <Icon name="plus" size={16} />
              Invite staff
            </Button>
          </>
        }
      />
      <div className="toolbar">
        <div className="tabs" role="tablist" aria-label="Staff role">
          {["All", "BCBA", "RBT", "ADMIN"].map((r) => (
            <button
              role="tab"
              aria-selected={r === role}
              key={r}
              onClick={() => setRole(r)}
            >
              {r === "All" ? "Everyone" : r}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Find someone on your team…"
          aria-label="Search staff"
        />
      </div>
      <div className="staff-grid">
        {staff.map((person) => {
          const expiry = person.credentialExpiresAt;
          const expiring =
            expiry && +new Date(expiry) < +new Date(data.asOf) + 30 * 86400000;
          return (
            <article className="panel staff-card" key={person._id}>
              <div className="row-between">
                <Badge tone="neutral">{person.role}</Badge>
                <Badge tone={person.active ? "green" : "neutral"}>
                  {person.active
                    ? "Active"
                    : person.forcePasswordChange
                      ? "Invited"
                      : "Inactive"}
                </Badge>
              </div>
              <div className="staff-info">
                <span className="avatar lg">
                  {person.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <div>
                  <h3>{person.name}</h3>
                  <small>{person.email}</small>
                </div>
              </div>
              <div className="credential">
                <p>{person.credential || "No credential recorded"}</p>
                <p
                  className={expiring ? "danger-text" : "muted"}
                  style={{ marginTop: 6 }}
                >
                  {expiry
                    ? `${+new Date(expiry) < +new Date(data.asOf) ? "Expired" : "Renews"} ${dateLabel(expiry)}`
                    : "No expiry date recorded"}
                </p>
              </div>
              {person.role === "RBT" && (
                <div className="staff-productivity">
                  <span>Recorded care · last 7 days</span>
                  <strong>
                    {(
                      data.sessions
                        .filter(
                          (session) =>
                            session.technician === person._id &&
                            session.status === "COMPLETED" &&
                            +new Date(session.startedAt || session.date) >=
                              +new Date(data.asOf) - 7 * 86400000 &&
                            +new Date(session.startedAt || session.date) <=
                              +new Date(data.asOf),
                        )
                        .reduce(
                          (minutes, session) =>
                            minutes + session.durationMinutes,
                          0,
                        ) / 60
                    ).toFixed(1)}{" "}
                    hours
                  </strong>
                </div>
              )}
              <div className="row-between">
                <small>
                  {
                    data.clients.filter(
                      (c) =>
                        c.assignedBCBA === person._id ||
                        c.assignedRBTs.includes(person._id),
                    ).length
                  }{" "}
                  assigned clients
                </small>
                <Button onClick={() => setEditing(person)}>
                  Manage <Icon name="arrow" size={13} />
                </Button>
              </div>
            </article>
          );
        })}
      </div>
      {!staff.length && (
        <div className="panel">
          <Empty
            title="Find your people"
            description="No team members match this view. Try a different search or invite someone new."
          />
        </div>
      )}
      {invite && <StaffForm onClose={() => setInvite(false)} />}
      {editing && (
        <StaffForm person={editing} onClose={() => setEditing(null)} />
      )}
    </>
  );
}
