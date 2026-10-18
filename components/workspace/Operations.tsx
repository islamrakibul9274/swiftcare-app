"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  Badge,
  Button,
  DataTable,
  Empty,
  Icon,
  Modal,
  PageHeading,
  Stat,
} from "@/components/ui";
import { useTask, useWorkspace, FormError } from "./context";
import { dateLabel, request } from "@/lib/client";
export function AuditTrail() {
  const { data } = useWorkspace();
  const [search, setSearch] = useState("");
  const filtered = data.audit.filter((event) =>
    `${event.actorName} ${event.action} ${event.resource} ${event.resourceId}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        eyebrow="Accountability & access"
        title="Audit trail"
        description="A record of sensitive access and workspace changes. Clinical text and credentials are excluded."
      />
      <div className="toolbar">
        <input
          aria-label="Search audit events"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search person, action, or record ID…"
        />
        <span className="small muted">Most recent 250 events</span>
      </div>
      <div className="panel">
        <DataTable
          title="Sensitive access audit trail"
          rows={filtered}
          rowKey={(e) => e._id}
          columns={[
            {
              key: "time",
              title: "When",
              sort: (e) => e.createdAt,
              render: (e) => dateLabel(e.createdAt, true),
            },
            {
              key: "actor",
              title: "Who",
              sort: (e) => e.actorName || e.actorId,
              render: (e) => (
                <>
                  <strong>{e.actorName || "Workspace account"}</strong>
                  <small>{e.actorId}</small>
                </>
              ),
            },
            {
              key: "action",
              title: "Action",
              sort: (e) => e.action,
              render: (e) => (
                <Badge tone="neutral">{e.action.replaceAll("_", " ")}</Badge>
              ),
            },
            {
              key: "resource",
              title: "Resource",
              sort: (e) => e.resource,
              render: (e) => e.resource,
            },
            {
              key: "id",
              title: "Record IDs",
              render: (e) =>
                e.resourceId ? (
                  <details>
                    <summary className="text-link">View IDs</summary>
                    <code
                      style={{
                        display: "block",
                        maxWidth: 250,
                        wordBreak: "break-all",
                        fontSize: 10,
                      }}
                    >
                      {e.resourceId}
                    </code>
                  </details>
                ) : (
                  <span className="muted">—</span>
                ),
            },
          ]}
        />
      </div>
      <p className="form-note section-gap">
        Application events are append-only through this interface. Production
        retention, external tamper-evident storage, and administrative database
        access require operational controls.
      </p>
    </>
  );
}
export function Notifications() {
  const { data } = useWorkspace();
  const task = useTask();
  async function mark(id?: string) {
    await task.run(async () => {
      await request("/api/workspace/notifications", {
        method: "PATCH",
        body: JSON.stringify(id ? { id } : {}),
      });
      window.dispatchEvent(new Event("swiftcare-notifications"));
    }, "Notifications updated.");
  }
  return (
    <>
      <PageHeading
        eyebrow="Stay connected"
        title="Notifications"
        description="Updates from your care team, without the noise."
        action={
          <Button
            disabled={task.busy || !data.notifications.some((n) => !n.readAt)}
            onClick={() => void mark()}
          >
            Mark all as read
          </Button>
        }
      />
      <div className="panel">
        {!data.notifications.length ? (
          <Empty
            title="You’re all caught up"
            description="Session and review updates will appear here as your team works."
          />
        ) : (
          data.notifications.map((n) => (
            <article
              key={n._id}
              className={`notification-card ${!n.readAt ? "unread" : ""}`}
            >
              <span className="icon-tile">
                <Icon name="bell" size={17} />
              </span>
              <div>
                <h3>{n.title}</h3>
                <p>{n.message}</p>
                <small>{dateLabel(n.createdAt, true)}</small>
              </div>
              <div className="row-end">
                <Link className="button secondary" href={n.href}>
                  Open <Icon name="arrow" size={13} />
                </Link>
                {!n.readAt && (
                  <Button
                    variant="ghost"
                    onClick={() => void mark(n._id)}
                    busy={task.busy}
                  >
                    Mark read
                  </Button>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </>
  );
}
export function Supervision() {
  const { data } = useWorkspace();
  const task = useTask();
  const [adding, setAdding] = useState(false);
  const [technician, setTechnician] = useState(
    data.staff.find((s) => s.role === "RBT" && s.active)?._id || "",
  );
  const technicians = data.staff.filter(
    (s) =>
      s.role === "RBT" &&
      s.active &&
      data.clients.some((c) => c.assignedRBTs.includes(s._id)),
  );
  const minutes = data.supervisions.reduce((n, s) => n + s.minutes, 0);
  const careMinutes = data.sessions
    .filter((s) => s.status === "COMPLETED")
    .reduce((n, s) => n + s.durationMinutes, 0);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (
      await task.run(
        () =>
          request("/api/workspace/supervision", {
            method: "POST",
            body: JSON.stringify({
              technicianId: technician,
              date: new Date(String(form.get("date"))).toISOString(),
              minutes: Number(form.get("minutes")),
              observation: String(form.get("observation")),
              ...(form.get("sessionId")
                ? { sessionId: String(form.get("sessionId")) }
                : {}),
            }),
          }),
        "Supervision record saved.",
      )
    )
      setAdding(false);
  }
  return (
    <>
      <PageHeading
        eyebrow="Clinical quality"
        title="Supervision"
        description="Record observed care, support your technicians, and keep supervision hours visible."
        action={
          <Button variant="primary" onClick={() => setAdding(true)}>
            <Icon name="plus" size={15} />
            Log supervision
          </Button>
        }
      />
      <div className="stats-grid">
        <Stat
          label="Recorded supervision"
          value={`${(minutes / 60).toFixed(1)}h`}
          detail="In the loaded supervision history"
          icon="shield"
        />
        <Stat
          label="Observed records"
          value={data.supervisions.length}
          detail="Recorded supervision observations"
          icon="note"
          tone="blue"
        />
        <Stat
          label="Technicians"
          value={technicians.length}
          detail="Active technicians in your caseload"
          icon="users"
        />
        <Stat
          label="Recorded hour ratio"
          value={`${careMinutes ? ((minutes / careMinutes) * 100).toFixed(1) : "0"}%`}
          detail="Loaded supervision / completed care hours"
          icon="chart"
          tone="amber"
        />
      </div>
      <div className="panel">
        <DataTable
          title="Supervision observations"
          rows={data.supervisions}
          rowKey={(s) => s._id}
          columns={[
            {
              key: "date",
              title: "Date",
              sort: (s) => s.date,
              render: (s) => dateLabel(s.date, true),
            },
            {
              key: "name",
              title: "Technician",
              render: (s) =>
                data.staff.find((p) => p._id === s.technician)?.name ||
                "Assigned technician",
            },
            {
              key: "time",
              title: "Duration",
              sort: (s) => s.minutes,
              render: (s) => `${s.minutes} min`,
            },
            {
              key: "observation",
              title: "Observation",
              render: (s) => s.observation || "No observation recorded",
            },
          ]}
        />
      </div>
      <p className="form-note section-gap">
        The recorded hour ratio is descriptive and uses the loaded record
        window. It is not a determination of certification or payer supervision
        compliance.
      </p>
      {adding && (
        <Modal
          title="Record a supervision observation"
          onClose={() => setAdding(false)}
        >
          <form method="post" className="form-stack" onSubmit={submit}>
            <label className="field">
              Technician
              <select
                value={technician}
                onChange={(e) => setTechnician(e.target.value)}
                required
              >
                {technicians.map((s) => (
                  <option value={s._id} key={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Observed session (optional)
              <select name="sessionId" defaultValue="">
                <option value="">Not linked to a session</option>
                {data.sessions
                  .filter(
                    (s) =>
                      s.status === "COMPLETED" && s.technician === technician,
                  )
                  .map((s) => (
                    <option value={s._id} key={s._id}>
                      {dateLabel(s.date, true)} · {s.durationMinutes} min
                    </option>
                  ))}
              </select>
            </label>
            <div className="form-grid">
              <label className="field">
                Observation date
                <input type="datetime-local" name="date" required />
              </label>
              <label className="field">
                Supervised minutes
                <input
                  type="number"
                  name="minutes"
                  min={1}
                  max={480}
                  required
                />
              </label>
            </div>
            <label className="field">
              Objective observation
              <textarea
                name="observation"
                required
                minLength={5}
                maxLength={2000}
                placeholder="Record what was observed and feedback provided."
              />
            </label>
            <FormError error={task.error} />
            <div className="modal-footer">
              <Button type="button" onClick={() => setAdding(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" busy={task.busy}>
                Save observation
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
