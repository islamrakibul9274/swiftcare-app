"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Badge,
  Button,
  Empty,
  Icon,
  Modal,
  PageHeading,
} from "@/components/ui";
import { useTask, useWorkspace, FormError } from "./context";
import { csvDownload, dateLabel, request } from "@/lib/client";
import { clientName, type NoteDTO, type SessionDTO } from "@/lib/dto";
import LiveSession from "./LiveSession";
function ReviewDialog({
  note,
  onClose,
}: {
  note: NoteDTO;
  onClose: () => void;
}) {
  const { data } = useWorkspace();
  const task = useTask();
  const bcba = data.actor.role === "BCBA";
  const observedSession = data.sessions.find(
    (session) => session._id === note.sessionId,
  );
  const [comment, setComment] = useState("");
  const [summary, setSummary] = useState(note.summary);
  const [reviewed, setReviewed] = useState(false);
  async function update(action: "approve" | "request_changes" | "resubmit") {
    if (
      await task.run(
        () =>
          request(`/api/notes/${note._id}`, {
            method: "PATCH",
            body: JSON.stringify({
              action,
              revision: note.revision,
              comment,
              reviewed,
              authorReviewed: reviewed,
              ...(action === "resubmit" ? { summary } : {}),
            }),
          }),
        action === "approve"
          ? "Note approved. A billing draft is ready for Admin review."
          : action === "request_changes"
            ? "Revision request sent to the author."
            : "Revised note sent for review.",
      )
    )
      onClose();
  }
  return (
    <Modal
      title={bcba ? "A thoughtful clinical review" : "Your session note"}
      onClose={onClose}
      wide
    >
      <div className="row-between">
        <div className="note-title">
          <h3>{note.clientName}</h3>
          <p>
            {dateLabel(note.date, true)} · {note.duration} · {note.rbtName}
          </p>
        </div>
        <Badge>{note.status}</Badge>
      </div>
      {note.aiGenerated && (
        <p className="ai-tag section-gap">
          <Icon name="sparkle" size={14} />
          AI-generated draft · clinician review is required before final
          approval.
        </p>
      )}
      {!bcba && note.status === "Changes Requested" ? (
        <label className="field section-gap">
          Revise your clinical note
          <textarea
            value={summary}
            onChange={(e) => {
              setSummary(e.target.value);
              setReviewed(false);
            }}
            rows={12}
            minLength={20}
            maxLength={12000}
          />
        </label>
      ) : (
        <div className="note-summary">{note.summary}</div>
      )}
      <div className="grid-two" style={{ gap: 12 }}>
        {note.behaviors.map((b) => (
          <div className="notice" key={b.name}>
            <strong>{b.name}</strong>
            <p>
              {b.count} occurrences · {b.durationSeconds || 0}s ·{" "}
              {b.intervals || 0}/{b.opportunities || 0} intervals
            </p>
          </div>
        ))}
      </div>
      {!!observedSession?.abcData.length && (
        <details className="abc-history">
          <summary>
            Recorded ABC context · {observedSession.abcData.length} observations
          </summary>
          {observedSession.abcData.map((entry, index) => (
            <div className="abc-entry" key={entry.at + index}>
              <strong>Observation {index + 1}</strong>
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
      {!!note.comments.length && (
        <div className="section-gap">
          <p className="eyebrow">Review conversation</p>
          {note.comments.map((c, i) => (
            <div className="note-comment" key={i}>
              <small>
                {c.authorName} · {dateLabel(c.at, true)}
              </small>
              {c.message}
            </div>
          ))}
        </div>
      )}
      {note.status === "Approved" && (
        <p className="notice section-gap">
          Finalized after clinician review
          {note.reviewedAt ? ` on ${dateLabel(note.reviewedAt, true)}` : ""}.
          Approved clinical notes are locked.
        </p>
      )}
      {bcba && note.status === "Pending Review" && (
        <label className="field section-gap">
          Review comment (required when requesting changes)
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={2000}
            placeholder="Give specific, actionable feedback to the technician."
          />
        </label>
      )}
      {((bcba && note.status === "Pending Review") ||
        (!bcba && note.status === "Changes Requested")) && (
        <label className="checkbox-label section-gap">
          <input
            type="checkbox"
            checked={reviewed}
            onChange={(e) => setReviewed(e.target.checked)}
          />
          {bcba
            ? "I have reviewed this note and its recorded observations and confirm the clinical documentation is accurate."
            : "I have reviewed my changes against the session observations."}
        </label>
      )}
      <FormError error={task.error} />
      <div className="modal-footer">
        <Button onClick={() => window.print()}>
          <Icon name="download" size={15} />
          Print / PDF
        </Button>
        {bcba && note.status === "Pending Review" ? (
          <>
            <Button
              busy={task.busy}
              onClick={() => void update("request_changes")}
            >
              Request changes
            </Button>
            <Button
              variant="primary"
              busy={task.busy}
              disabled={!reviewed}
              onClick={() => void update("approve")}
            >
              Approve & lock <Icon name="check" size={15} />
            </Button>
          </>
        ) : !bcba && note.status === "Changes Requested" ? (
          <Button
            variant="primary"
            busy={task.busy}
            disabled={!reviewed}
            onClick={() => void update("resubmit")}
          >
            Resubmit for review
          </Button>
        ) : (
          <Button onClick={onClose}>Close</Button>
        )}
      </div>
    </Modal>
  );
}
export default function Notes() {
  const { data } = useWorkspace();
  const task = useTask();
  const query = useSearchParams();
  const bcba = data.actor.role === "BCBA";
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [focused, setFocused] = useState<NoteDTO | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [bulk, setBulk] = useState(false);
  const [attested, setAttested] = useState(false);
  const [live, setLive] = useState<SessionDTO | null>(null);
  const [page, setPage] = useState(0);
  const noteId = query.get("note");
  useEffect(() => {
    if (!noteId) return;
    request<{ note: NoteDTO }>(`/api/notes/${noteId}`)
      .then((result) => setFocused(result.note))
      .catch(() => {});
  }, [noteId]);
  const filtered = data.notes.filter(
    (n) =>
      (filter === "All" || n.status === filter) &&
      `${n.clientName} ${n.rbtName} ${n.summary}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 8));
  const current = Math.min(page, pages - 1);
  const unsubmitted = data.sessions.filter(
    (s) =>
      s.status === "COMPLETED" &&
      !data.notes.some((n) => n.sessionId === s._id),
  );
  async function exportNotes() {
    await task.run(
      async () => {
        await request("/api/workspace/exports", {
          method: "POST",
          body: JSON.stringify({
            resource: "notes",
            ids: filtered.map((n) => n._id),
          }),
        });
        csvDownload("swiftcare-clinical-notes.csv", [
          ["Date", "Client", "Technician", "Duration", "Status", "Summary"],
          ...filtered.map((n) => [
            n.date,
            n.clientName,
            n.rbtName,
            n.duration,
            n.status,
            n.summary,
          ]),
        ]);
      },
      "Note export prepared.",
      false,
    );
  }
  async function approveBulk() {
    const notes = data.notes.filter(
      (n) => selected.includes(n._id) && n.status === "Pending Review",
    );
    let done = 0;
    const ok = await task.run(async () => {
      for (const note of notes) {
        await request(`/api/notes/${note._id}`, {
          method: "PATCH",
          body: JSON.stringify({
            action: "approve",
            revision: note.revision,
            reviewed: attested,
          }),
        });
        done++;
      }
    }, `${notes.length} notes approved.`);
    if (ok) {
      setBulk(false);
      setSelected([]);
    } else if (done)
      task.run(async () => {
        throw new Error(
          `${done} notes were approved before the remaining action failed. Refresh the queue before retrying.`,
        );
      });
  }
  if (live) {
    const client = data.clients.find((c) => c._id === live.client);
    return client ? (
      <>
        <PageHeading
          title="Finish the story of this session."
          description="Your observations are saved. Review the note before submitting it."
        />
        <LiveSession
          key={live._id}
          initialSession={live}
          client={client}
          onClose={() => setLive(null)}
        />
      </>
    ) : null;
  }
  return (
    <>
      <PageHeading
        eyebrow={
          bcba ? "Clinical documentation" : "Your clinical documentation"
        }
        title={bcba ? "Clinical review" : "My clinical notes"}
        description={
          bcba
            ? "Review session observations, give useful feedback, and keep the care team connected."
            : "Your submitted notes, review feedback, and saved sessions — all in one place."
        }
        action={
          <Button onClick={() => void exportNotes()} busy={task.busy}>
            <Icon name="download" size={15} />
            Export notes
          </Button>
        }
      />
      {!bcba && !!unsubmitted.length && (
        <div className="panel panel-pad" style={{ marginBottom: 22 }}>
          <div className="panel-heading">
            <div>
              <h2>Pick up where you left off</h2>
              <p>
                Completed sessions with saved observations and an unfinished
                note
              </p>
            </div>
            <Badge tone="amber">{unsubmitted.length} to finish</Badge>
          </div>
          {unsubmitted.slice(0, 5).map((s) => (
            <div key={s._id} className="list-row" data-session-id={s._id}>
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
                Finish note <Icon name="arrow" size={14} />
              </Button>
            </div>
          ))}
        </div>
      )}
      <div className="toolbar">
        <div className="tabs" role="tablist" aria-label="Note status">
          {["All", "Pending Review", "Changes Requested", "Approved"].map(
            (value) => (
              <button
                role="tab"
                aria-selected={filter === value}
                key={value}
                onClick={() => {
                  setFilter(value);
                  setPage(0);
                }}
              >
                {value}
                {value === "Pending Review"
                  ? ` (${data.notes.filter((n) => n.status === value).length})`
                  : ""}
              </button>
            ),
          )}
        </div>
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          placeholder="Find a client or note…"
          aria-label="Search clinical notes"
        />
      </div>
      {bcba && selected.length > 0 && (
        <div className="notice row-between" style={{ marginBottom: 20 }}>
          <span>{selected.length} notes selected for review.</span>
          <Button
            onClick={() => {
              setBulk(true);
              setAttested(false);
            }}
          >
            Review selected notes
          </Button>
        </div>
      )}
      {!filtered.length ? (
        <div className="panel">
          <Empty
            title={
              bcba
                ? "A clear queue. A little breathing room."
                : "Your notes will find a home here."
            }
            description="No notes match this view. Try another filter or complete a session to add documentation."
          />
        </div>
      ) : (
        filtered.slice(current * 8, (current + 1) * 8).map((note) => (
          <article className="panel note-card" key={note._id}>
            <div className="row-between">
              <div className="note-select">
                {bcba && note.status === "Pending Review" && (
                  <input
                    type="checkbox"
                    aria-label={`Select note for ${note.clientName} on ${dateLabel(note.date)}`}
                    checked={selected.includes(note._id)}
                    onChange={(e) =>
                      setSelected((ids) =>
                        e.target.checked
                          ? [...ids, note._id]
                          : ids.filter((id) => id !== note._id),
                      )
                    }
                  />
                )}
                <span className="avatar">
                  {note.clientName
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <div className="note-title">
                  <h3>{note.clientName}</h3>
                  <p>
                    {dateLabel(note.date, true)} · {note.duration} ·{" "}
                    {note.rbtName}
                  </p>
                </div>
              </div>
              <Badge>{note.status}</Badge>
            </div>
            <p className="note-summary">
              {note.summary.length > 360
                ? note.summary.slice(0, 360) + "…"
                : note.summary}
            </p>
            <div className="row-between">
              <span className="ai-tag">
                {note.aiGenerated ? (
                  <>
                    <Icon name="sparkle" size={13} />
                    AI-assisted · clinician review required
                  </>
                ) : (
                  <>
                    <Icon name="note" size={13} />
                    Clinician-authored documentation
                  </>
                )}
              </span>
              <Button onClick={() => setFocused(note)}>
                {bcba && note.status === "Pending Review"
                  ? "Review note"
                  : note.status === "Changes Requested" && !bcba
                    ? "Revise note"
                    : "View note"}
                <Icon name="arrow" size={14} />
              </Button>
            </div>
          </article>
        ))
      )}
      <div className="table-footer">
        <span>{filtered.length} notes</span>
        <div>
          <Button onClick={() => setPage(current - 1)} disabled={!current}>
            Previous
          </Button>
          <span>
            {current + 1} / {pages}
          </span>
          <Button
            onClick={() => setPage(current + 1)}
            disabled={current + 1 >= pages}
          >
            Next
          </Button>
        </div>
      </div>
      {focused && (
        <ReviewDialog
          key={focused._id}
          note={focused}
          onClose={() => setFocused(null)}
        />
      )}
      {bulk && (
        <Modal
          title="Review each selected note"
          onClose={() => setBulk(false)}
          wide
        >
          <p className="form-note">
            Read the documentation below before signing. Each approval creates
            one billing draft for Admin review.
          </p>
          {data.notes
            .filter(
              (n) => selected.includes(n._id) && n.status === "Pending Review",
            )
            .map((n) => (
              <div className="section-gap" key={n._id}>
                <h3>
                  {n.clientName} · {dateLabel(n.date)}
                </h3>
                <div className="note-summary">{n.summary}</div>
              </div>
            ))}
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={attested}
              onChange={(e) => setAttested(e.target.checked)}
            />
            I reviewed every selected note and confirm the clinical
            documentation is accurate.
          </label>
          <FormError error={task.error} />
          <div className="modal-footer">
            <Button onClick={() => setBulk(false)}>Cancel</Button>
            <Button
              variant="primary"
              busy={task.busy}
              disabled={!attested}
              onClick={() => void approveBulk()}
            >
              Approve {selected.length} notes
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
