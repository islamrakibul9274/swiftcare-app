"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  Empty,
  Icon,
  Modal,
  PageHeading,
} from "@/components/ui";
import { useTask, useWorkspace, FormError } from "./context";
import { clientName, type SessionDTO } from "@/lib/dto";
import { dateLabel, request } from "@/lib/client";
import { scheduleSchema } from "@/lib/validation";
function ScheduleForm({
  date,
  onClose,
}: {
  date: string;
  onClose: () => void;
}) {
  const { data } = useWorkspace();
  const task = useTask();
  const [clientId, setClientId] = useState(data.clients[0]?._id || "");
  const client = data.clients.find((c) => c._id === clientId);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const start = new Date(String(form.get("start"))),
      end = new Date(String(form.get("end")));
    if (!Number.isFinite(+start) || !Number.isFinite(+end)) return;
    const parsed = scheduleSchema.safeParse({
      clientId,
      technicianId:
        data.actor.role === "RBT"
          ? data.actor.id
          : String(form.get("technician")),
      date: start.toISOString(),
      scheduledEnd: end.toISOString(),
    });
    if (!parsed.success) {
      await task.run(async () => {
        throw new Error(parsed.error.issues[0].message);
      });
      return;
    }
    if (
      await task.run(
        () =>
          request("/api/workspace/sessions", {
            method: "POST",
            body: JSON.stringify(parsed.data),
          }),
        "A little more care, on the calendar.",
      )
    )
      onClose();
  }
  return (
    <Modal title="Make time for meaningful care" onClose={onClose}>
      <form method="post" onSubmit={submit} className="form-stack">
        <label className="field">
          Client
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            required
          >
            <option value="" disabled>
              Choose a client
            </option>
            {data.clients.map((c) => (
              <option key={c._id} value={c._id}>
                {clientName(c)} · {c.code}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Assigned technician
          <select
            name="technician"
            key={clientId}
            disabled={data.actor.role === "RBT"}
            defaultValue={
              data.actor.role === "RBT"
                ? data.actor.id
                : client?.assignedRBTs[0]
            }
            required
          >
            {data.staff
              .filter(
                (s) =>
                  s.active &&
                  s.role === "RBT" &&
                  client?.assignedRBTs.includes(s._id),
              )
              .map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
          </select>
        </label>
        <div className="form-grid">
          <label className="field">
            Start
            <input
              type="datetime-local"
              name="start"
              defaultValue={`${date}T09:00`}
              required
            />
          </label>
          <label className="field">
            End
            <input
              type="datetime-local"
              name="end"
              defaultValue={`${date}T10:00`}
              required
            />
          </label>
        </div>
        <p className="form-note">
          Times use your device’s timezone. SwiftCare checks client and
          technician availability before saving. Sessions can last up to 8
          hours.
        </p>
        {!client?.assignedRBTs.length && (
          <p className="notice warning">
            Assign an active technician to this client before scheduling.
          </p>
        )}
        <FormError error={task.error} />
        <div className="modal-footer">
          <Button type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            busy={task.busy}
            disabled={!client?.assignedRBTs.length}
          >
            Schedule session
          </Button>
        </div>
      </form>
    </Modal>
  );
}
export default function Schedule() {
  const router = useRouter();
  const { data } = useWorkspace();
  const task = useTask();
  const [mode, setMode] = useState("Week");
  const [date, setDate] = useState(new Date().toLocaleDateString("en-CA"));
  const [add, setAdd] = useState(false);
  const [cancelling, setCancelling] = useState<SessionDTO | null>(null);
  const start = new Date(date + "T00:00:00");
  if (mode === "Week")
    start.setDate(
      start.getDate() - start.getDay() + 1 - (start.getDay() === 0 ? 7 : 0),
    );
  const days = Array.from({ length: mode === "Week" ? 7 : 1 }, (_, i) => {
    const day = new Date(start);
    day.setDate(day.getDate() + i);
    return day;
  });
  async function begin(session: SessionDTO) {
    if (
      await task.run(
        () =>
          request("/api/workspace/sessions", {
            method: "PATCH",
            body: JSON.stringify({
              id: session._id,
              revision: session.revision,
              action: "start",
            }),
          }),
        "Session started.",
        false,
      )
    )
      router.push("/tech");
  }
  function eventCard(session: SessionDTO) {
    const client = data.clients.find((c) => c._id === session.client);
    return (
      <article className="calendar-event" key={session._id}>
        <div>
          {new Date(session.date).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          })}
          {session.scheduledEnd
            ? ` – ${new Date(session.scheduledEnd).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
            : ""}
        </div>
        <Link href={`/clients/${session.client}`}>
          <strong>{clientName(client)}</strong>
        </Link>
        <span>
          {data.staff.find((s) => s._id === session.technician)?.name}
        </span>
        <div style={{ marginTop: 8 }}>
          <Badge tone="neutral">
            {session.status.replaceAll("_", " ").toLowerCase()}
          </Badge>
        </div>
        {session.status === "SCHEDULED" && (
          <div className="row wrap">
            {data.actor.role === "RBT" &&
              session.technician === data.actor.id && (
                <Button busy={task.busy} onClick={() => void begin(session)}>
                  Start session
                </Button>
              )}
            <Button variant="ghost" onClick={() => setCancelling(session)}>
              Cancel
            </Button>
          </div>
        )}
        {session.status === "IN_PROGRESS" &&
          session.technician === data.actor.id && (
            <Link className="button secondary" href="/tech">
              Resume session
            </Link>
          )}
      </article>
    );
  }
  function move(delta: number) {
    const next = new Date(date + "T12:00:00");
    next.setDate(next.getDate() + delta * (mode === "Week" ? 7 : 1));
    setDate(next.toLocaleDateString("en-CA"));
  }
  const visible = data.sessions.filter(
    (s) =>
      s.status !== "CANCELLED" &&
      +new Date(s.date) >= +days[0] &&
      +new Date(s.date) < +new Date(+days[days.length - 1] + 86400000),
  );
  return (
    <>
      <PageHeading
        eyebrow="A connected care day"
        title="Schedule"
        description="Plan sessions around your clients and care team, with availability checked before every booking."
        action={
          <Button variant="primary" onClick={() => setAdd(true)}>
            <Icon name="plus" size={15} />
            Schedule session
          </Button>
        }
      />
      <div className="toolbar">
        <div className="row">
          <Button aria-label="Previous date range" onClick={() => move(-1)}>
            ←
          </Button>
          <Button
            onClick={() => setDate(new Date().toLocaleDateString("en-CA"))}
          >
            Today
          </Button>
          <Button aria-label="Next date range" onClick={() => move(1)}>
            →
          </Button>
          <label>
            <span className="sr-only">Calendar date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => e.target.value && setDate(e.target.value)}
            />
          </label>
        </div>
        <div className="tabs" role="tablist" aria-label="Calendar view">
          {["Day", "Week"].map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={mode === v}
              onClick={() => setMode(v)}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
      <div className="panel">
        <div className="panel-heading panel-pad" style={{ marginBottom: 0 }}>
          <div>
            <h2>
              {days[0].toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </h2>
            <p>{visible.length} sessions · Times follow your device timezone</p>
          </div>
          <span className="icon-tile">
            <Icon name="calendar" />
          </span>
        </div>
        {mode === "Week" ? (
          <div className="schedule-scroll">
            <div className="week-grid">
              {days.map((day) => (
                <div className="day-column" key={day.toISOString()}>
                  <div className="day-title">
                    {day.toLocaleDateString("en-US", { weekday: "short" })}
                    <strong>{day.getDate()}</strong>
                  </div>
                  {visible
                    .filter(
                      (s) =>
                        new Date(s.date).toDateString() === day.toDateString(),
                    )
                    .sort((a, b) => +new Date(a.date) - +new Date(b.date))
                    .map(eventCard)}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="panel-pad">
            {visible.length ? (
              visible.map(eventCard)
            ) : (
              <Empty
                title="A little breathing room"
                description="No sessions are scheduled for this day."
                action={
                  <Button onClick={() => setAdd(true)}>
                    Schedule a session
                  </Button>
                }
              />
            )}
          </div>
        )}
      </div>
      {add && <ScheduleForm date={date} onClose={() => setAdd(false)} />}
      {cancelling && (
        <Modal
          title="Cancel this scheduled session?"
          onClose={() => setCancelling(null)}
        >
          <p className="muted">
            {clientName(data.clients.find((c) => c._id === cancelling.client))}{" "}
            · {dateLabel(cancelling.date, true)}
          </p>
          <p className="form-note section-gap">
            The session stays in the audit history. Create a new booking to
            arrange another time.
          </p>
          <FormError error={task.error} />
          <div className="modal-footer">
            <Button onClick={() => setCancelling(null)}>Keep session</Button>
            <Button
              variant="danger"
              busy={task.busy}
              onClick={async () => {
                if (
                  await task.run(
                    () =>
                      request("/api/workspace/sessions", {
                        method: "PATCH",
                        body: JSON.stringify({
                          id: cancelling._id,
                          revision: cancelling.revision,
                          action: "cancel",
                        }),
                      }),
                    "Session cancelled.",
                  )
                )
                  setCancelling(null);
              }}
            >
              Cancel session
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
