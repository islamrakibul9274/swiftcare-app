"use client";
import { useState, useEffect, useRef } from "react";
import { Button, Badge, Icon, useToast } from "@/components/ui";
import {
  clientName,
  type Behavior,
  type ClientDTO,
  type SessionDTO,
} from "@/lib/dto";
import { request } from "@/lib/client";
import { noteSchema } from "@/lib/validation";
import { useWorkspace } from "./context";
const elapsed = (seconds: number) =>
  `${Math.floor(seconds / 3600)
    .toString()
    .padStart(2, "0")}:${Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0")}`;
const abcFields = (items: SessionDTO["abcData"]) =>
  items.map(({ antecedent, behavior, consequence, at }) => ({
    antecedent,
    behavior,
    consequence,
    at,
  }));
export default function LiveSession({
  initialSession,
  client,
  onClose,
}: {
  initialSession: SessionDTO;
  client: ClientDTO;
  onClose: () => void;
}) {
  const { refresh } = useWorkspace();
  const toast = useToast();
  const [session, setSession] = useState(initialSession);
  const server = useRef(initialSession);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const [behaviors, setBehaviors] = useState<Behavior[]>(
    client.targetBehaviors.map((target) => {
      const saved = initialSession.behaviorData.find(
        (b) => b.behaviorName === target.name,
      );
      return {
        name: target.name,
        type: target.type,
        count: saved?.frequency || 0,
        durationSeconds: saved?.durationSeconds || 0,
        intervals: saved?.intervals || 0,
        opportunities: saved?.opportunities || 0,
      };
    }),
  );
  const [abc, setAbc] = useState(() => abcFields(initialSession.abcData || []));
  const [showAbc, setShowAbc] = useState(false);
  const [running, setRunning] = useState<Record<string, number>>({});
  const [now, setNow] = useState(0);
  const [summary, setSummary] = useState(initialSession.aiDraftedNote || "");
  const [original, setOriginal] = useState(initialSession.aiOriginalNote || "");
  const [aiGenerated, setAiGenerated] = useState(
    initialSession.aiGenerated || false,
  );
  const [reviewed, setReviewed] = useState(false);
  const [template, setTemplate] = useState("SOAP");
  const [tone, setTone] = useState("Clinical");
  const [length, setLength] = useState("Brief");
  const [generating, setGenerating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sync, setSync] = useState("All changes saved");
  const [error, setError] = useState("");
  const firstSave = useRef(true);
  const submitted = useRef(false);
  const flush = useRef<() => Promise<unknown>>(() => Promise.resolve());
  const active = session.status === "IN_PROGRESS";
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  function snapshot() {
    return behaviors.map((b) => ({
      ...b,
      durationSeconds:
        b.durationSeconds +
        (running[b.name]
          ? Math.floor((Date.now() - running[b.name]) / 1000)
          : 0),
    }));
  }
  async function persist(
    action: "save" | "complete",
    observationSnapshot = snapshot(),
  ) {
    const captured = {
      behaviors: observationSnapshot,
      abcData: abc,
      draftText: summary,
      aiOriginalText: original,
      aiGenerated,
    };
    setSync("Saving…");
    const job = queue.current
      .catch(() => {})
      .then(async () => {
        const current = server.current;
        const result = await request<{ session: SessionDTO }>(
          "/api/workspace/sessions",
          {
            method: "PATCH",
            keepalive: true,
            body: JSON.stringify({
              id: current._id,
              revision: current.revision,
              action,
              ...captured,
              ...(current.status === "COMPLETED"
                ? { behaviors: undefined, abcData: undefined }
                : {}),
            }),
          },
        );
        server.current = result.session;
        setSession(result.session);
        setSync("All changes saved");
        return result.session;
      });
    queue.current = job;
    try {
      return await job;
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Unable to save.";
      setSync(
        navigator.onLine
          ? "Save failed — retry before leaving"
          : "Offline — keep this tab open",
      );
      setError(message);
      throw cause;
    }
  }
  function hasUnsavedChanges() {
    const stored = server.current;
    return (
      summary !== (stored.aiDraftedNote || "") ||
      original !== (stored.aiOriginalNote || "") ||
      aiGenerated !== (stored.aiGenerated || false) ||
      JSON.stringify(abcFields(abc)) !==
        JSON.stringify(abcFields(stored.abcData || [])) ||
      snapshot().some((value) => {
        const saved = stored.behaviorData.find(
          (item) => item.behaviorName === value.name,
        );
        return (
          !saved ||
          value.count !== (saved.frequency || 0) ||
          value.durationSeconds !== (saved.durationSeconds || 0) ||
          value.intervals !== (saved.intervals || 0) ||
          value.opportunities !== (saved.opportunities || 0)
        );
      })
    );
  }
  useEffect(() => {
    flush.current = async () => {
      if (!submitted.current && hasUnsavedChanges()) await persist("save");
    };
    // Capture the latest editable snapshot for navigation/unload, without persisting during render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [behaviors, abc, summary, original, aiGenerated, running]);
  useEffect(
    () => () => {
      void flush.current().catch(() => {});
    },
    [],
  );
  useEffect(() => {
    if (firstSave.current) {
      firstSave.current = false;
      return;
    }
    const timer = setTimeout(() => {
      void persist("save").catch(() => {});
    }, 1100);
    return () => clearTimeout(timer);
    // Each change captures a new ordered snapshot; the queue supplies the latest server revision.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [behaviors, abc, summary, original, aiGenerated]);
  useEffect(() => {
    if (!active || !Object.keys(running).length) return;
    const timer = setInterval(() => {
      void persist("save").catch(() => {});
    }, 10000);
    return () => clearInterval(timer);
    // Duration timers save a timestamp-derived snapshot while running.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, running, behaviors, abc, summary, original, aiGenerated]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (server.current.status === "IN_PROGRESS" || hasUnsavedChanges()) {
        void flush.current().catch(() => {});
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
    // The warning reads the current server draft and latest local note fields.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary, original, aiGenerated, behaviors, abc, running]);
  async function complete() {
    setBusy(true);
    setError("");
    const values = snapshot();
    try {
      await persist("complete", values);
      setBehaviors(values);
      setRunning({});
      toast("Session observations saved. Review and submit your note.");
      refresh();
    } catch {
    } finally {
      setBusy(false);
    }
  }
  async function generate() {
    setGenerating(true);
    setError("");
    try {
      await persist("save");
      const data = await request<{ note: string }>("/api/ai-notes", {
        method: "POST",
        body: JSON.stringify({
          sessionId: session._id,
          template,
          tone,
          length,
        }),
      });
      setOriginal(data.note);
      setSummary(data.note);
      setAiGenerated(true);
      setReviewed(false);
      toast("AI draft ready. Review it against your observations.");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "AI drafting failed. Write your note manually.",
      );
    } finally {
      setGenerating(false);
    }
  }
  async function submit() {
    const parsed = noteSchema.safeParse({
      sessionId: session._id,
      summary,
      authorReviewed: reviewed,
      aiGenerated,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await persist("save");
      await request("/api/notes", {
        method: "POST",
        body: JSON.stringify(parsed.data),
      });
      submitted.current = true;
      toast("Note submitted to the assigned BCBA for review.");
      refresh();
      onClose();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to submit. Your draft is saved.",
      );
    } finally {
      setBusy(false);
    }
  }
  const seconds = session.startedAt
    ? Math.max(
        0,
        Math.floor(
          ((active
            ? now || +new Date(session.startedAt)
            : +new Date(session.endedAt || session.startedAt)) -
            +new Date(session.startedAt)) /
            1000,
        ),
      )
    : 0;
  return (
    <section className="panel session-surface">
      <div className="live-session-heading">
        <div>
          <p className="eyebrow">
            {active ? "Live session" : "Saved session · note workspace"}
          </p>
          <h2>{clientName(client)}</h2>
          <p className="small muted">
            {client.code} · {client.targetBehaviors.length} observation targets
          </p>
        </div>
        <div className="session-timer" aria-label="Session elapsed time">
          {elapsed(seconds)}
        </div>
      </div>
      {error && (
        <p className="notice danger" role="alert" style={{ marginBottom: 18 }}>
          {error}
        </p>
      )}
      {!!abc.length && (
        <details className="abc-history">
          <summary>ABC observations · {abc.length} recorded</summary>
          {abc.map((entry, index) => (
            <div className="abc-entry" key={entry.at + index}>
              <div className="row-between">
                <strong>Observation {index + 1}</strong>
                {active && (
                  <Button
                    variant="ghost"
                    aria-label={`Remove ABC observation ${index + 1}`}
                    onClick={() =>
                      setAbc((items) => items.filter((_, i) => i !== index))
                    }
                  >
                    Remove
                  </Button>
                )}
              </div>
              <dl>
                <dt>Antecedent</dt>
                <dd>{entry.antecedent}</dd>
                <dt>Behavior</dt>
                <dd>{entry.behavior}</dd>
                <dt>Consequence</dt>
                <dd>{entry.consequence}</dd>
              </dl>
            </div>
          ))}
        </details>
      )}
      {active ? (
        <>
          <div className="counter-grid">
            {behaviors.map((b) => {
              const target = client.targetBehaviors.find(
                (t) => t.name === b.name,
              )!;
              const duration =
                b.durationSeconds +
                (running[b.name]
                  ? Math.max(
                      0,
                      Math.floor(
                        ((now || running[b.name]) - running[b.name]) / 1000,
                      ),
                    )
                  : 0);
              return (
                <div className="counter" key={b.name}>
                  <div className="row-between">
                    <h3>{b.name}</h3>
                    <Icon
                      name={b.type === "increase" ? "chart" : "leaf"}
                      size={16}
                    />
                  </div>
                  <p>
                    {target.measurement} ·{" "}
                    {b.type === "increase" ? "Build skill" : "Reduction target"}
                  </p>
                  <strong>
                    {target.measurement === "duration"
                      ? elapsed(duration)
                      : target.measurement === "interval"
                        ? `${b.intervals}/${b.opportunities}`
                        : b.count}
                  </strong>
                  {target.measurement === "frequency" ? (
                    <div className="counter-controls">
                      <Button
                        aria-label={`Decrease ${b.name}`}
                        disabled={!b.count}
                        onClick={() =>
                          setBehaviors((items) =>
                            items.map((v) =>
                              v.name === b.name
                                ? { ...v, count: Math.max(0, v.count - 1) }
                                : v,
                            ),
                          )
                        }
                      >
                        <Icon name="minus" />
                      </Button>
                      <Button
                        variant="primary"
                        aria-label={`Increase ${b.name}`}
                        onClick={() =>
                          setBehaviors((items) =>
                            items.map((v) =>
                              v.name === b.name
                                ? { ...v, count: v.count + 1 }
                                : v,
                            ),
                          )
                        }
                      >
                        <Icon name="plus" />
                      </Button>
                    </div>
                  ) : target.measurement === "duration" ? (
                    <Button
                      className="full"
                      variant={running[b.name] ? "secondary" : "primary"}
                      onClick={() => {
                        if (running[b.name]) {
                          const delta = Math.floor(
                            (Date.now() - running[b.name]) / 1000,
                          );
                          setBehaviors((items) =>
                            items.map((v) =>
                              v.name === b.name
                                ? {
                                    ...v,
                                    durationSeconds: v.durationSeconds + delta,
                                  }
                                : v,
                            ),
                          );
                          setRunning((items) => {
                            const next = { ...items };
                            delete next[b.name];
                            return next;
                          });
                        } else
                          setRunning((items) => ({
                            ...items,
                            [b.name]: Date.now(),
                          }));
                      }}
                    >
                      {running[b.name] ? "Stop duration" : "Start duration"}
                      <Icon name="clock" size={15} />
                    </Button>
                  ) : (
                    <div className="interval-control">
                      <Button
                        onClick={() =>
                          setBehaviors((items) =>
                            items.map((v) =>
                              v.name === b.name
                                ? {
                                    ...v,
                                    intervals: v.intervals + 1,
                                    opportunities: v.opportunities + 1,
                                  }
                                : v,
                            ),
                          )
                        }
                      >
                        Observed ✓
                      </Button>
                      <Button
                        onClick={() =>
                          setBehaviors((items) =>
                            items.map((v) =>
                              v.name === b.name
                                ? { ...v, opportunities: v.opportunities + 1 }
                                : v,
                            ),
                          )
                        }
                      >
                        Not observed
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="section-gap">
            <Button onClick={() => setShowAbc((v) => !v)}>
              <Icon name="plus" size={15} />
              {showAbc ? "Hide ABC entry" : "Add ABC observation"}
            </Button>
            <span className="small muted" style={{ marginLeft: 12 }}>
              {abc.length} saved observations
            </span>
            {showAbc && (
              <form
                method="post"
                className="form-stack"
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = new FormData(e.currentTarget);
                  setAbc((items) => [
                    ...items,
                    {
                      antecedent: String(form.get("antecedent")),
                      behavior: String(form.get("behavior")),
                      consequence: String(form.get("consequence")),
                      at: new Date().toISOString(),
                    },
                  ]);
                  e.currentTarget.reset();
                  toast("ABC observation added to this session.");
                }}
              >
                <p className="form-note">
                  Use objective observations. ABC text is stored in the session
                  and is never sent to the AI provider.
                </p>
                <div className="form-grid">
                  <label className="field">
                    Antecedent
                    <textarea name="antecedent" required maxLength={500} />
                  </label>
                  <label className="field">
                    Observed behavior
                    <textarea name="behavior" required maxLength={500} />
                  </label>
                  <label className="field full-span">
                    Consequence
                    <textarea name="consequence" required maxLength={500} />
                  </label>
                </div>
                <Button type="submit" disabled={abc.length >= 100}>
                  Save ABC observation
                </Button>
              </form>
            )}
          </div>
          <div className="live-controls">
            <span
              className={`sync-label ${sync.includes("Offline") ? "offline" : ""}`}
              role="status"
            >
              <span />
              {sync}
            </span>
            <div className="row">
              <Button
                onClick={() => void persist("save").catch(() => {})}
                disabled={busy}
              >
                Save now
              </Button>
              <Button
                variant="primary"
                busy={busy}
                onClick={() => void complete()}
              >
                End session <Icon name="check" size={16} />
              </Button>
            </div>
          </div>
        </>
      ) : (
        <>
          <p className="notice">
            Your session observations are saved. Write a note or use an
            assistive draft, then review it before sending it to your BCBA.
          </p>
          <div className="panel-heading section-gap">
            <div>
              <h2>A thoughtful head start</h2>
              <p>
                Only numeric observations and anonymous target labels are sent
                to Groq.
              </p>
            </div>
            <Badge tone="blue">Assistive AI</Badge>
          </div>
          <div className="form-grid">
            <label className="field">
              Template
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
              >
                <option>SOAP</option>
                <option>Session</option>
              </select>
            </label>
            <label className="field">
              Tone
              <select value={tone} onChange={(e) => setTone(e.target.value)}>
                <option>Clinical</option>
                <option>Concise</option>
              </select>
            </label>
            <label className="field">
              Length
              <select
                value={length}
                onChange={(e) => setLength(e.target.value)}
              >
                <option>Brief</option>
                <option>Detailed</option>
              </select>
            </label>
            <div className="row-end" style={{ alignItems: "end" }}>
              <Button busy={generating} onClick={() => void generate()}>
                <Icon name="sparkle" size={16} />
                {original ? "Regenerate draft" : "Generate AI draft"}
              </Button>
            </div>
          </div>
          <div className={original ? "ai-draft-grid" : "section-gap"}>
            {original && (
              <div>
                <p className="eyebrow">
                  Original AI draft · needs clinician review
                </p>
                <div className="original-draft">{original}</div>
              </div>
            )}
            <label className="field">
              {original ? "Your reviewed version" : "Clinical session note"}
              <textarea
                value={summary}
                onChange={(e) => {
                  setSummary(e.target.value);
                  setReviewed(false);
                }}
                minLength={20}
                maxLength={12000}
                rows={12}
                placeholder="Document objective observations, context you directly observed, interventions actually delivered, and the plan for clinician review."
              />
            </label>
          </div>
          <p className="form-note">
            {client.targetBehaviors
              .map((t, i) => `Target ${i + 1}: ${t.name}`)
              .join(" · ")}
            . Do not add facts unsupported by the session record.
          </p>
          <label className="checkbox-label section-gap">
            <input
              type="checkbox"
              checked={reviewed}
              onChange={(e) => setReviewed(e.target.checked)}
            />
            I reviewed this note against the recorded observations and take
            responsibility for its accuracy. Final clinical approval is required
            from the assigned BCBA.
          </label>
          <div className="live-controls">
            <span className="sync-label" role="status">
              <span />
              {sync}
            </span>
            <div className="row">
              <Button
                onClick={async () => {
                  try {
                    await persist("save");
                    onClose();
                    refresh();
                  } catch {}
                }}
                disabled={busy || generating}
              >
                Save & close
              </Button>
              <Button
                variant="primary"
                busy={busy}
                disabled={generating}
                onClick={() => void submit()}
              >
                Submit for review <Icon name="arrow" size={15} />
              </Button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
