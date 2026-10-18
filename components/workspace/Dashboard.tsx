"use client";
import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Badge,
  Button,
  Empty,
  Icon,
  PageHeading,
  Skeleton,
  Stat,
} from "@/components/ui";
import { useWorkspace, useTask } from "./context";
import { clientName, type SessionDTO } from "@/lib/dto";
import { currency, dateLabel, request } from "@/lib/client";
import LiveSession from "./LiveSession";
const Charts = dynamic(() => import("./Charts"), {
  loading: () => <Skeleton />,
});
export default function Dashboard() {
  const { data } = useWorkspace();
  const task = useTask();
  const actor = data.actor;
  const [live, setLive] = useState<SessionDTO | null>(
    data.sessions.find(
      (s) => s.status === "IN_PROGRESS" && s.technician === actor.id,
    ) || null,
  );
  const pending = data.notes.filter((n) => n.status === "Pending Review");
  const due = data.sessions
    .filter((s) => s.status === "SCHEDULED")
    .sort((a, b) => +new Date(a.date) - +new Date(b.date));
  const weekStart = +new Date(data.asOf) - 7 * 86400000;
  const weekSessions = data.sessions.filter(
    (s) =>
      s.status === "COMPLETED" &&
      +new Date(s.startedAt || s.date) >= weekStart &&
      +new Date(s.startedAt || s.date) <= +new Date(data.asOf),
  );
  const unpaid = data.claims.filter((c) => c.status !== "Paid");
  const paid = data.claims.filter((c) => c.status === "Paid");
  const unsubmitted = data.sessions.filter(
    (s) =>
      s.status === "COMPLETED" &&
      !data.notes.some((n) => n.sessionId === s._id),
  );
  const expiring = data.staff.filter(
    (s) =>
      s.credentialExpiresAt &&
      +new Date(s.credentialExpiresAt) < +new Date(data.asOf) + 30 * 86400000,
  );
  const lowAuth = data.clients.filter(
    (c) => c.authorizationHours !== undefined && c.authorizationHours < 10,
  );
  async function start(session: SessionDTO) {
    let next: SessionDTO | null = null;
    const ok = await task.run(async () => {
      const result = await request<{ session: SessionDTO }>(
        "/api/workspace/sessions",
        {
          method: "PATCH",
          body: JSON.stringify({
            id: session._id,
            action: "start",
            revision: session.revision,
          }),
        },
      );
      next = result.session;
    }, "Session started.");
    if (ok && next) setLive(next);
  }
  const dayKeys = Array.from({ length: 7 }, (_, i) =>
    new Date(+new Date(data.asOf) - (6 - i) * 86400000)
      .toISOString()
      .slice(0, 10),
  );
  const dailySessions = dayKeys.map(
    (day) =>
      data.sessions.filter(
        (s) =>
          s.status === "COMPLETED" &&
          (s.startedAt || s.date).slice(0, 10) === day,
      ).length,
  );
  const dailyHours = dayKeys.map(
    (day) =>
      +(
        data.sessions
          .filter(
            (s) =>
              s.status === "COMPLETED" &&
              (s.startedAt || s.date).slice(0, 10) === day,
          )
          .reduce((n, s) => n + s.durationMinutes, 0) / 60
      ).toFixed(1),
  );
  const dailyPaid = dayKeys.map((day) =>
    paid
      .filter((c) => c.dateOfService.slice(0, 10) === day)
      .reduce((n, c) => n + c.amount, 0),
  );
  const scheduledMinutes = data.sessions
    .filter(
      (s) =>
        s.status !== "CANCELLED" &&
        +new Date(s.date) >= weekStart &&
        +new Date(s.date) <= +new Date(data.asOf),
    )
    .reduce(
      (sum, s) =>
        sum +
        (s.scheduledEnd
          ? Math.max(0, (+new Date(s.scheduledEnd) - +new Date(s.date)) / 60000)
          : s.durationMinutes),
      0,
    );
  const deliveredMinutes = weekSessions.reduce(
    (sum, s) => sum + s.durationMinutes,
    0,
  );
  const date = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  return (
    <>
      <PageHeading
        eyebrow={date}
        title="Overview"
        description={
          actor.role === "ADMIN"
            ? "A clear picture of your practice, and what needs your attention."
            : actor.role === "BCBA"
              ? "Your team is making progress. Here’s where you can make a difference today."
              : "Your clients, your sessions, and the moments that make a difference."
        }
        action={
          <Link href="/schedule" className="button primary">
            <Icon name="calendar" size={16} />
            View schedule
          </Link>
        }
      />
      <div className="stats-grid">
        {actor.role === "ADMIN" ? (
          <>
            <Stat
              label="Collected revenue"
              trend={dailyPaid}
              trendLabel="Paid amounts by service day over the past 7 days"
              value={currency(paid.reduce((n, c) => n + c.amount, 0))}
              detail="Paid claims in the loaded ledger"
              icon="wallet"
            />
            <Stat
              label="Outstanding claims"
              value={unpaid.length}
              detail={`${currency(unpaid.reduce((n, c) => n + c.amount, 0))} in the pipeline`}
              icon="note"
              tone="amber"
            />
            <Stat
              label="Active care team"
              value={data.staff.filter((s) => s.active).length}
              detail="Staff with active workspace access"
              icon="users"
              tone="blue"
            />
            <Stat
              label="Sessions this week"
              trend={dailySessions}
              trendLabel="Completed sessions per day over the past 7 days"
              value={weekSessions.length}
              detail={`${(weekSessions.reduce((n, s) => n + s.durationMinutes, 0) / 60).toFixed(1)} hours of documented care`}
              icon="clock"
            />
          </>
        ) : (
          <>
            <Stat
              label={
                actor.role === "BCBA" ? "Active clients" : "Assigned clients"
              }
              value={data.clients.filter((c) => c.active).length}
              detail="Connected to your current caseload"
              icon="users"
            />
            <Stat
              label={
                actor.role === "BCBA"
                  ? "Notes awaiting review"
                  : "Upcoming sessions"
              }
              value={actor.role === "BCBA" ? pending.length : due.length}
              detail={
                actor.role === "BCBA"
                  ? "Ready for your clinical expertise"
                  : "Scheduled care in your workspace"
              }
              icon="note"
              tone="amber"
            />
            <Stat
              label="Care hours this week"
              trend={dailyHours}
              trendLabel="Care hours per day over the past 7 days"
              value={(
                weekSessions.reduce((n, s) => n + s.durationMinutes, 0) / 60
              ).toFixed(1)}
              detail="Completed sessions over the past 7 days"
              icon="clock"
              tone="blue"
            />
            <Stat
              label={
                actor.role === "BCBA" ? "Approved this week" : "Notes to finish"
              }
              value={
                actor.role === "BCBA"
                  ? data.notes.filter(
                      (n) =>
                        n.reviewedAt && +new Date(n.reviewedAt) >= weekStart,
                    ).length
                  : unsubmitted.length +
                    data.notes.filter((n) => n.status === "Changes Requested")
                      .length
              }
              detail={
                actor.role === "BCBA"
                  ? "Reviewed and signed clinical notes"
                  : "Completed sessions and requested revisions"
              }
              icon="check"
            />
          </>
        )}
      </div>
      {actor.role === "ADMIN" && (
        <div className="welcome-strip">
          <div>
            <h2>
              Practice utilization ·{" "}
              {scheduledMinutes
                ? `${((deliveredMinutes / scheduledMinutes) * 100).toFixed(1)}%`
                : "No scheduled hours"}
            </h2>
            <p>
              {(deliveredMinutes / 60).toFixed(1)} recorded care hours /{" "}
              {(scheduledMinutes / 60).toFixed(1)} scheduled hours over the past
              7 days. Actual care may differ from the planned schedule.
            </p>
          </div>
          <Icon name="chart" size={22} />
        </div>
      )}
      {live && actor.role === "RBT" ? (
        <LiveSession
          key={live._id}
          initialSession={live}
          client={data.clients.find((c) => c._id === live.client)!}
          onClose={() => setLive(null)}
        />
      ) : (
        <>
          {actor.role === "RBT" && (
            <div className="welcome-strip">
              <div>
                <h2>
                  Bring your full attention. We’ll keep the details together.
                </h2>
                <p>
                  Start a session to open touch-friendly observation tools. Your
                  data saves as you work.
                </p>
              </div>
              <span className="welcome-symbol" aria-hidden="true">
                ✦
              </span>
            </div>
          )}
          <div className="grid-main">
            <Charts data={data} revenue={actor.role === "ADMIN"} />
            <div className="panel panel-pad">
              <div className="panel-heading">
                <div>
                  <h2>Today’s priorities</h2>
                  <p>A little focus goes a long way.</p>
                </div>
                <span className="icon-tile amber">
                  <Icon name="sparkle" size={17} />
                </span>
              </div>
              {actor.role === "BCBA" && (
                <div className="priority-row">
                  <span className="priority-dot" />
                  <div>
                    <h3>
                      {pending.length} notes ready for a thoughtful review
                    </h3>
                    <p>Close the loop with your care team.</p>
                  </div>
                  <Link
                    href="/director/notes"
                    aria-label="Open clinical review queue"
                  >
                    <Icon name="arrow" size={16} />
                  </Link>
                </div>
              )}
              {actor.role === "RBT" && (
                <div className="priority-row">
                  <span className="priority-dot" />
                  <div>
                    <h3>
                      {unsubmitted.length} completed sessions need documentation
                    </h3>
                    <p>Finish the note while the details are fresh.</p>
                  </div>
                  <Link href="/tech/notes" aria-label="Open your notes">
                    <Icon name="arrow" size={16} />
                  </Link>
                </div>
              )}
              {actor.role === "ADMIN" && (
                <>
                  <div className="priority-row">
                    <span className="priority-dot" />
                    <div>
                      <h3>
                        {
                          data.claims.filter((c) => c.status === "Denied")
                            .length
                        }{" "}
                        denied claims to follow up
                      </h3>
                      <p>Review the pipeline and payer references.</p>
                    </div>
                    <Link href="/admin/billing" aria-label="Open claims">
                      <Icon name="arrow" size={16} />
                    </Link>
                  </div>
                  <div className="priority-row">
                    <span className="priority-dot" />
                    <div>
                      <h3>{expiring.length} credentials due within 30 days</h3>
                      <p>Keep your team’s records up to date.</p>
                    </div>
                    <Link
                      href="/admin/staff"
                      aria-label="Review staff credentials"
                    >
                      <Icon name="arrow" size={16} />
                    </Link>
                  </div>
                </>
              )}
              {lowAuth.map((c) => (
                <div className="priority-row" key={c._id}>
                  <span className="priority-dot" />
                  <div>
                    <h3>
                      {clientName(c)} · {c.authorizationHours?.toFixed(1)}{" "}
                      authorized hours
                    </h3>
                    <p>Review remaining authorization with your team.</p>
                  </div>
                  <Link
                    href={`/clients/${c._id}`}
                    aria-label={`Open ${clientName(c)}`}
                  >
                    <Icon name="arrow" size={16} />
                  </Link>
                </div>
              ))}
              <div className="priority-row">
                <span className="priority-dot green" />
                <div>
                  <h3>
                    {due.length
                      ? "Your next care day is taking shape"
                      : "Your schedule is up to date"}
                  </h3>
                  <p>{due.length} upcoming sessions in this workspace.</p>
                </div>
                <Link href="/schedule" aria-label="Open schedule">
                  <Icon name="arrow" size={16} />
                </Link>
              </div>
            </div>
          </div>
          <div className="grid-two section-gap">
            <div className="panel panel-pad">
              <div className="panel-heading">
                <div>
                  <h2>Coming up next</h2>
                  <p>Your next scheduled sessions</p>
                </div>
                <Link href="/schedule" className="text-link small">
                  See calendar ↗
                </Link>
              </div>
              {!due.length ? (
                <Empty
                  title="A little breathing room"
                  description="New sessions will appear here when they are scheduled."
                  action={
                    <Link className="button secondary" href="/schedule">
                      Open calendar
                    </Link>
                  }
                />
              ) : (
                due.slice(0, 4).map((s) => {
                  const c = data.clients.find((c) => c._id === s.client);
                  return (
                    <div
                      className="list-row"
                      data-session-id={s._id}
                      key={s._id}
                    >
                      <div className="calendar-stamp">
                        <strong>
                          {new Date(s.date).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </strong>
                        {new Date(s.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                      <span className="avatar">{c?.firstName[0]}D</span>
                      <div className="grow">
                        <h3>{clientName(c)}</h3>
                        <p>
                          {data.staff.find((p) => p._id === s.technician)
                            ?.name || "Assigned technician"}{" "}
                          ·{" "}
                          {Math.round(
                            (+new Date(s.scheduledEnd || s.date) -
                              +new Date(s.date)) /
                              60000,
                          )}{" "}
                          min
                        </p>
                      </div>
                      {actor.role === "RBT" && s.technician === actor.id ? (
                        <Button busy={task.busy} onClick={() => void start(s)}>
                          Start <Icon name="play" size={12} />
                        </Button>
                      ) : (
                        <Badge tone="neutral">Scheduled</Badge>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            <div className="panel panel-pad">
              <div className="panel-heading">
                <div>
                  <h2>
                    {actor.role === "ADMIN"
                      ? "Your care team"
                      : "Connected to your care"}
                  </h2>
                  <p>
                    {actor.role === "ADMIN"
                      ? "People making the work possible"
                      : "A small snapshot of your caseload"}
                  </p>
                </div>
                <Link
                  href={actor.role === "ADMIN" ? "/admin/staff" : "/clients"}
                  className="text-link small"
                >
                  View all ↗
                </Link>
              </div>
              {actor.role === "ADMIN"
                ? data.staff
                    .filter((s) => s.active)
                    .slice(0, 4)
                    .map((s) => (
                      <div className="list-row" key={s._id}>
                        <span className="avatar blue">
                          {s.name
                            .split(" ")
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join("")}
                        </span>
                        <div className="grow">
                          <h3>{s.name}</h3>
                          <p>{s.role}</p>
                        </div>
                        <Badge>Active</Badge>
                      </div>
                    ))
                : data.clients.slice(0, 4).map((c) => (
                    <Link
                      className="list-row"
                      href={`/clients/${c._id}`}
                      key={c._id}
                    >
                      <span className="avatar blue">
                        {c.firstName[0]}
                        {c.lastName[0]}
                      </span>
                      <div className="grow">
                        <h3>{clientName(c)}</h3>
                        <p>
                          {c.goals.length} treatment goals · {c.code}
                        </p>
                      </div>
                      <Icon name="chevron" size={16} />
                    </Link>
                  ))}
              {!data.clients.length && actor.role !== "ADMIN" && (
                <Empty
                  title="Your caseload is ready to grow"
                  description="Assigned clients will appear here."
                />
              )}
            </div>
          </div>
          {actor.role === "RBT" && !!unsubmitted.length && (
            <div className="panel panel-pad section-gap">
              <div className="panel-heading">
                <h2>Finish your documentation</h2>
                <p>Saved sessions that still need a note</p>
              </div>
              {unsubmitted.slice(0, 5).map((s) => (
                <div className="list-row" key={s._id}>
                  <span className="icon-tile amber">
                    <Icon name="note" />
                  </span>
                  <div className="grow">
                    <h3>
                      {clientName(data.clients.find((c) => c._id === s.client))}
                    </h3>
                    <p>
                      {dateLabel(s.date, true)} · {s.durationMinutes} minutes
                    </p>
                  </div>
                  <Button onClick={() => setLive(s)}>
                    Write note <Icon name="arrow" size={13} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
