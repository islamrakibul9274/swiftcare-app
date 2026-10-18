"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Badge,
  Button,
  Empty,
  Icon,
  Modal,
  PageHeading,
  Skeleton,
  Stat,
} from "@/components/ui";
import { useWorkspace, useTask, FormError } from "./context";
import { clientName, type ClientDTO, type Goal } from "@/lib/dto";
import { csvDownload, dateLabel, request } from "@/lib/client";
import { clientSchema } from "@/lib/validation";
const Charts = dynamic(() => import("./Charts"), {
  loading: () => <Skeleton />,
});
function ClientEditor({
  client,
  onClose,
}: {
  client?: ClientDTO;
  onClose: () => void;
}) {
  const { data } = useWorkspace();
  const task = useTask();
  const [goals, setGoals] = useState<Goal[]>(client?.goals || []);
  const [targets, setTargets] = useState<ClientDTO["targetBehaviors"]>(
    client?.targetBehaviors || [
      {
        name: "Independent requests",
        type: "increase",
        measurement: "frequency",
      },
    ],
  );
  const [assigned, setAssigned] = useState<string[]>(
    client?.assignedRBTs || [],
  );
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const shared = {
      assignedBCBA: String(form.get("bcba") || data.actor.id),
      assignedRBTs: assigned,
      authorizationHours: Number(form.get("hours")),
      ...(form.get("authorizationExpiry")
        ? {
            authorizationExpiresAt: new Date(
              String(form.get("authorizationExpiry")) + "T23:59:00",
            ).toISOString(),
          }
        : {}),
      goals: goals.map((g) => ({ ...g, target: Number(g.target) })),
    };
    let payload: unknown;
    if (client) payload = { id: client._id, ...shared };
    else {
      const parsed = clientSchema.safeParse({
        ...shared,
        firstName: form.get("firstName"),
        lastName: form.get("lastName"),
        dateOfBirth: form.get("dob"),
        code: form.get("code"),
        targetBehaviors: targets,
      });
      if (!parsed.success) {
        await task.run(async () => {
          throw new Error(parsed.error.issues[0].message);
        });
        return;
      }
      payload = parsed.data;
    }
    if (
      await task.run(
        () =>
          request("/api/workspace/clients", {
            method: client ? "PATCH" : "POST",
            body: JSON.stringify(payload),
          }),
        client
          ? "Treatment plan and assignments saved."
          : "Client added to your care workspace.",
      )
    )
      onClose();
  }
  return (
    <Modal
      title={
        client
          ? `Treatment plan · ${clientName(client)}`
          : "Make room for a new care journey"
      }
      onClose={onClose}
      wide
    >
      <form method="post" className="form-stack" onSubmit={submit}>
        {!client && (
          <div className="form-grid">
            <label className="field">
              First name
              <input name="firstName" required maxLength={80} />
            </label>
            <label className="field">
              Last name
              <input name="lastName" required maxLength={80} />
            </label>
            <label className="field">
              Date of birth
              <input
                name="dob"
                type="date"
                required
                max={new Date().toISOString().slice(0, 10)}
              />
            </label>
            <label className="field">
              Clinic client code
              <input
                name="code"
                required
                minLength={2}
                maxLength={30}
                placeholder="Your internal client reference"
              />
            </label>
          </div>
        )}
        <div className="form-grid">
          <label className="field">
            Assigned BCBA
            <select
              name="bcba"
              defaultValue={client?.assignedBCBA || data.actor.id}
              required
              disabled={data.actor.role === "BCBA"}
            >
              {data.staff
                .filter((s) => s.role === "BCBA" && s.active)
                .map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="field">
            Remaining authorization (hours)
            <input
              name="hours"
              type="number"
              min={0}
              max={5000}
              step="0.25"
              defaultValue={client?.authorizationHours || 0}
              required
            />
          </label>
          <label className="field">
            Authorization expires
            <input
              name="authorizationExpiry"
              type="date"
              defaultValue={client?.authorizationExpiresAt?.slice(0, 10) || ""}
            />
          </label>
          <fieldset>
            <legend className="field">Assigned technicians</legend>
            <div className="stack" style={{ gap: 8, marginTop: 9 }}>
              {data.staff
                .filter((s) => s.role === "RBT" && s.active)
                .map((s) => (
                  <label className="checkbox-label" key={s._id}>
                    <input
                      type="checkbox"
                      checked={assigned.includes(s._id)}
                      onChange={(e) =>
                        setAssigned((ids) =>
                          e.target.checked
                            ? [...ids, s._id]
                            : ids.filter((id) => id !== s._id),
                        )
                      }
                    />
                    {s.name}
                  </label>
                ))}
            </div>
          </fieldset>
        </div>
        {!client && (
          <div>
            <div className="panel-heading">
              <h3>Observation targets</h3>
              <Button
                type="button"
                onClick={() =>
                  setTargets((items) => [
                    ...items,
                    { name: "", type: "increase", measurement: "frequency" },
                  ])
                }
                disabled={targets.length >= 20}
              >
                <Icon name="plus" size={14} />
                Add target
              </Button>
            </div>
            {targets.map((target, i) => (
              <div className="goal-editor form-grid" key={i}>
                <label className="field">
                  Target name
                  <input
                    value={target.name}
                    onChange={(e) =>
                      setTargets((items) =>
                        items.map((t, j) =>
                          j === i ? { ...t, name: e.target.value } : t,
                        ),
                      )
                    }
                    required
                    maxLength={80}
                  />
                </label>
                <label className="field">
                  Measurement
                  <select
                    value={target.measurement}
                    onChange={(e) =>
                      setTargets((items) =>
                        items.map((t, j) =>
                          j === i
                            ? {
                                ...t,
                                measurement: e.target
                                  .value as typeof t.measurement,
                              }
                            : t,
                        ),
                      )
                    }
                  >
                    <option value="frequency">Frequency</option>
                    <option value="duration">Duration (minutes)</option>
                    <option value="interval">Interval (%)</option>
                  </select>
                </label>
                <label className="field">
                  Direction
                  <select
                    value={target.type}
                    onChange={(e) =>
                      setTargets((items) =>
                        items.map((t, j) =>
                          j === i
                            ? { ...t, type: e.target.value as typeof t.type }
                            : t,
                        ),
                      )
                    }
                  >
                    <option value="increase">Build skill</option>
                    <option value="decrease">Reduction target</option>
                  </select>
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={targets.length === 1}
                  onClick={() =>
                    setTargets((items) => items.filter((_, j) => j !== i))
                  }
                >
                  Remove target
                </Button>
              </div>
            ))}
          </div>
        )}
        <div>
          <div className="panel-heading">
            <div>
              <h3>Treatment goals</h3>
              <p>Targets, aim lines, and explicit mastery criteria</p>
            </div>
            <Button
              type="button"
              disabled={goals.length >= 30}
              onClick={() =>
                setGoals((items) => [
                  ...items,
                  {
                    name: targets[0]?.name || "",
                    target: 10,
                    masteryCriteria: "",
                    direction: targets[0]?.type || "increase",
                  },
                ])
              }
            >
              <Icon name="plus" size={14} />
              Add goal
            </Button>
          </div>
          {!goals.length && (
            <p className="form-note">
              Add goals to make aim lines and progress indicators available for
              this client.
            </p>
          )}
          {goals.map((goal, i) => (
            <div className="goal-editor form-grid" key={i}>
              <label className="field">
                Observation target
                <select
                  value={goal.name}
                  onChange={(e) =>
                    setGoals((items) =>
                      items.map((g, j) =>
                        j === i
                          ? {
                              ...g,
                              name: e.target.value,
                              direction:
                                targets.find((t) => t.name === e.target.value)
                                  ?.type || "increase",
                            }
                          : g,
                      ),
                    )
                  }
                >
                  {targets.map((t) => (
                    <option key={t.name} value={t.name}>
                      {t.name} ({t.measurement})
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Aim value
                <input
                  type="number"
                  min={0}
                  max={100000}
                  value={goal.target}
                  required
                  onChange={(e) =>
                    setGoals((items) =>
                      items.map((g, j) =>
                        j === i ? { ...g, target: Number(e.target.value) } : g,
                      ),
                    )
                  }
                />
              </label>
              <label className="field full-span">
                Mastery criteria
                <input
                  value={goal.masteryCriteria || ""}
                  required
                  minLength={5}
                  maxLength={300}
                  onChange={(e) =>
                    setGoals((items) =>
                      items.map((g, j) =>
                        j === i ? { ...g, masteryCriteria: e.target.value } : g,
                      ),
                    )
                  }
                  placeholder="Define the observation threshold and number of consecutive sessions."
                />
              </label>
              <label className="field">
                Phase change date
                <input
                  type="date"
                  value={goal.phaseDate?.slice(0, 10) || ""}
                  onChange={(e) =>
                    setGoals((items) =>
                      items.map((g, j) =>
                        j === i
                          ? {
                              ...g,
                              phaseDate: e.target.value
                                ? new Date(
                                    e.target.value + "T12:00:00",
                                  ).toISOString()
                                : undefined,
                            }
                          : g,
                      ),
                    )
                  }
                />
              </label>
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  setGoals((items) => items.filter((_, j) => j !== i))
                }
              >
                Remove goal
              </Button>
            </div>
          ))}
        </div>
        <FormError error={task.error} />
        <div className="modal-footer">
          <Button type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" busy={task.busy}>
            {client ? "Save treatment plan" : "Add client"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
export default function Clients({ clientId }: { clientId?: string }) {
  const { data } = useWorkspace();
  const task = useTask();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(false);
  const client = data.clients.find((c) => c._id === clientId);
  const clinical = data.actor.role !== "ADMIN";
  const canEdit = data.actor.role !== "RBT";
  async function exportClients() {
    const rows = data.clients.filter((c) =>
      clientId ? c._id === clientId : true,
    );
    await task.run(
      async () => {
        await request("/api/workspace/exports", {
          method: "POST",
          body: JSON.stringify({
            resource: "clients",
            ids: rows.map((c) => c._id),
          }),
        });
        csvDownload("swiftcare-client-overview.csv", [
          ["Code", "Name", "Goals", "Remaining authorization hours"],
          ...rows.map((c) => [
            c.code || "",
            clientName(c),
            c.goals.length,
            c.authorizationHours || 0,
          ]),
        ]);
      },
      "Client overview exported.",
      false,
    );
  }
  if (clientId && !client)
    return (
      <Empty
        title="Client unavailable"
        description="This record is outside the current loaded workspace."
      />
    );
  if (client) {
    const notes = data.notes.filter((n) => n.clientId === client._id);
    const sessions = data.sessions.filter((s) => s.client === client._id);
    const latest = notes
      .filter((n) => n.status === "Approved")
      .sort((a, b) => +new Date(b.date) - +new Date(a.date))[0];
    return (
      <>
        <div className="toolbar">
          <Link href="/clients" className="text-link small">
            ← Back to your caseload
          </Link>
          <Button onClick={() => void exportClients()}>
            <Icon name="download" size={14} />
            Export overview
          </Button>
        </div>
        <div className="panel profile-hero">
          <div className="row">
            <span className="avatar lg">
              {client.firstName[0]}
              {client.lastName[0]}
            </span>
            <div>
              <div className="row">
                <h1>{clientName(client)}</h1>
                <Badge>{client.active ? "Active" : "Inactive"}</Badge>
              </div>
              <p>
                {client.code} ·{" "}
                {data.staff.find((s) => s._id === client.assignedBCBA)?.name ||
                  "Assigned BCBA unavailable"}
              </p>
            </div>
          </div>
          {canEdit && (
            <Button onClick={() => setEditing(true)}>
              <Icon name="note" size={15} />
              Edit treatment plan
            </Button>
          )}
        </div>
        <div className="stats-grid section-gap">
          <Stat
            label="Active goals"
            value={client.goals.length}
            detail="Individualized treatment targets"
            icon="chart"
          />
          <Stat
            label="Completed sessions"
            value={sessions.filter((s) => s.status === "COMPLETED").length}
            detail="In this loaded workspace"
            icon="calendar"
            tone="blue"
          />
          <Stat
            label="Care hours"
            value={(
              sessions
                .filter((s) => s.status === "COMPLETED")
                .reduce((n, s) => n + s.durationMinutes, 0) / 60
            ).toFixed(1)}
            detail="From actual recorded duration"
            icon="clock"
          />
          <Stat
            label="Authorization left"
            value={`${(client.authorizationHours || 0).toFixed(1)}h`}
            detail={
              client.authorizationExpiresAt
                ? `Expires ${dateLabel(client.authorizationExpiresAt)}`
                : "No expiry recorded"
            }
            icon="shield"
            tone="amber"
          />
        </div>
        {clinical && <Charts data={{ ...data, clients: [client], notes }} />}
        <div className="grid-two section-gap">
          <div className="panel panel-pad">
            <div className="panel-heading">
              <div>
                <h2>A plan built around progress</h2>
                <p>
                  Aim values inform the chart; clinicians determine mastery.
                </p>
              </div>
            </div>
            {!client.goals.length ? (
              <Empty
                title="The next step starts with a goal"
                description="The supervising BCBA can add treatment targets and mastery criteria."
              />
            ) : (
              client.goals.map((goal) => {
                const b = latest?.behaviors.find((b) => b.name === goal.name);
                const measurement = client.targetBehaviors.find(
                  (t) => t.name === goal.name,
                )?.measurement;
                const observed = b
                  ? measurement === "duration"
                    ? b.durationSeconds / 60
                    : measurement === "interval"
                      ? b.opportunities
                        ? (b.intervals / b.opportunities) * 100
                        : 0
                      : b.count
                  : null;
                const progress =
                  observed === null
                    ? 0
                    : goal.direction === "decrease"
                      ? observed <= goal.target
                        ? 100
                        : (goal.target / observed) * 100
                      : goal.target
                        ? Math.min(100, (observed / goal.target) * 100)
                        : 100;
                return (
                  <div className="goal-row" key={goal.name}>
                    <div className="row-between">
                      <strong>{goal.name}</strong>
                      <span className="muted small">
                        {observed === null
                          ? "Awaiting data"
                          : `Latest: ${observed.toFixed(1)} · Aim: ${goal.target}`}
                      </span>
                    </div>
                    <p>
                      {goal.masteryCriteria || "Mastery criteria not recorded."}
                    </p>
                    <div
                      className="progress-track"
                      role="progressbar"
                      aria-label={`Progress toward aim for ${goal.name}`}
                      aria-valuenow={Math.round(progress)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <span style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="panel panel-pad">
            <div className="panel-heading">
              <div>
                <h2>The care timeline</h2>
                <p>Sessions and documentation, connected.</p>
              </div>
            </div>
            {!sessions.length ? (
              <Empty
                title="A new care journey"
                description="Sessions will build this client’s timeline."
              />
            ) : (
              sessions.slice(0, 8).map((s) => {
                const note = notes.find((n) => n.sessionId === s._id);
                return (
                  <div className="timeline-item" key={s._id}>
                    <span className="icon-tile">
                      <Icon name={note ? "note" : "calendar"} size={16} />
                    </span>
                    <div>
                      <div className="row-between">
                        <h3>
                          {s.status === "COMPLETED"
                            ? "Session completed"
                            : s.status === "SCHEDULED"
                              ? "Session scheduled"
                              : s.status.toLowerCase().replaceAll("_", " ")}
                        </h3>
                        <span className="small muted">{dateLabel(s.date)}</span>
                      </div>
                      <p>
                        {data.staff.find((p) => p._id === s.technician)?.name ||
                          "Assigned technician"}{" "}
                        ·{" "}
                        {s.durationMinutes
                          ? s.durationMinutes + " minutes"
                          : "Upcoming care"}
                      </p>
                      {note && clinical ? (
                        <Link
                          className="text-link small"
                          href={`${data.actor.role === "BCBA" ? "/director" : "/tech"}/notes?note=${note._id}`}
                        >
                          {note.status} · Open note ↗
                        </Link>
                      ) : note ? (
                        <Badge>{note.status}</Badge>
                      ) : (
                        <p className="small muted">
                          {s.status === "COMPLETED"
                            ? "Documentation not yet submitted"
                            : ""}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        {editing && (
          <ClientEditor client={client} onClose={() => setEditing(false)} />
        )}
      </>
    );
  }
  const filtered = data.clients.filter((c) =>
    `${clientName(c)} ${c.code}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        eyebrow="Every client. Their own journey."
        title="Clients"
        description="Connect the people, goals, observations, and small wins behind each client’s progress."
        action={
          canEdit ? (
            <Button variant="primary" onClick={() => setEditing(true)}>
              <Icon name="plus" size={15} />
              Add client
            </Button>
          ) : undefined
        }
      />
      <div className="toolbar">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search clients"
          placeholder="Find a client or clinic code…"
        />
        <Button onClick={() => void exportClients()}>
          <Icon name="download" size={14} />
          Export overview
        </Button>
      </div>
      <div className="client-grid">
        {filtered.map((c, i) => {
          const latest = data.notes.find((n) => n.clientId === c._id);
          const stale =
            !latest ||
            +new Date(data.asOf) - +new Date(latest.date) > 7 * 86400000;
          return (
            <article className="panel client-card" key={c._id}>
              <div className="row-between">
                <span className={`avatar lg ${i % 2 ? "blue" : ""}`}>
                  {c.firstName[0]}
                  {c.lastName[0]}
                </span>
                <Badge>{c.active ? "Active" : "Inactive"}</Badge>
              </div>
              <h3>{clientName(c)}</h3>
              <p>{c.code}</p>
              <div className="client-meta">
                <div>
                  <small>Treatment goals</small>
                  <strong>{c.goals.length} active goals</strong>
                </div>
                <div>
                  <small>Authorization left</small>
                  <strong
                    className={
                      (c.authorizationHours || 0) < 10 ? "danger-text" : ""
                    }
                  >
                    {c.authorizationHours ?? "—"} hours
                  </strong>
                </div>
              </div>
              <div className="row-between">
                <span className="small muted">
                  {stale
                    ? "No recent notes"
                    : `Last note ${dateLabel(latest!.date)}`}
                </span>
                <Link className="button secondary" href={`/clients/${c._id}`}>
                  View profile <Icon name="arrow" size={13} />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
      {!filtered.length && (
        <div className="panel">
          <Empty
            title="Care begins with a connection."
            description="No clients match this view. Assigned clients appear here when your team adds them."
          />
        </div>
      )}
      {editing && <ClientEditor onClose={() => setEditing(false)} />}
    </>
  );
}
