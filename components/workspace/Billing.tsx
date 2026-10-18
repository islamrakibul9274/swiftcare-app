"use client";
import { useState, type FormEvent } from "react";
import {
  Badge,
  Button,
  DataTable,
  Icon,
  Modal,
  PageHeading,
  Stat,
} from "@/components/ui";
import { useWorkspace, useTask, FormError } from "./context";
import { currency, dateLabel, csvDownload, request } from "@/lib/client";
import { claimPatchSchema } from "@/lib/validation";
import type { ClaimDTO } from "@/lib/dto";
function ClaimEditor({
  claim,
  onClose,
}: {
  claim: ClaimDTO;
  onClose: () => void;
}) {
  const task = useTask();
  const next: Record<string, string[]> = {
    "Pending Submission": ["Pending Submission", "Submitted"],
    Submitted: ["Submitted", "Paid", "Denied"],
    Denied: ["Denied", "Pending Submission"],
    Paid: ["Paid"],
  };
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      id: claim._id,
      status: form.get("status"),
      payerReference: String(form.get("reference") || ""),
      ...(claim.status !== "Paid"
        ? {
            amount: Number(form.get("amount")),
            billingCode: String(form.get("code")),
          }
        : {}),
    };
    const parsed = claimPatchSchema.safeParse(payload);
    if (!parsed.success) {
      await task.run(async () => {
        throw new Error(parsed.error.issues[0].message);
      });
      return;
    }
    if (
      await task.run(
        () =>
          request("/api/claims", {
            method: "PATCH",
            body: JSON.stringify(parsed.data),
          }),
        "Claim ledger updated.",
      )
    )
      onClose();
  }
  return (
    <Modal title="Review the claim ledger" onClose={onClose}>
      <div className="row-between">
        <div>
          <h3>{claim.clientName}</h3>
          <p className="small muted">
            Service date {dateLabel(claim.dateOfService)} · {claim.units} units
          </p>
        </div>
        <Badge>
          {claim.status === "Pending Submission" ? "Draft" : claim.status}
        </Badge>
      </div>
      <p className="notice section-gap">
        This is your internal claim ledger. Payer submissions and payments must
        be completed in your billing system, then recorded here. Review coding,
        units, coverage, and charge accuracy first.
      </p>
      <form method="post" className="form-stack" onSubmit={submit}>
        <div className="form-grid">
          <label className="field">
            Charge amount (USD)
            <input
              name="amount"
              type="number"
              step="0.01"
              min={0}
              max={1000000}
              defaultValue={claim.amount}
              disabled={claim.status === "Paid"}
              required
            />
          </label>
          <label className="field">
            CPT code
            <input
              name="code"
              pattern="[0-9]{5}"
              defaultValue={claim.billingCode}
              disabled={claim.status === "Paid"}
              required
            />
          </label>
        </div>
        <label className="field">
          Recorded status
          <select name="status" defaultValue={claim.status}>
            {next[claim.status].map((value) => (
              <option key={value} value={value}>
                {value === "Pending Submission"
                  ? "Draft / pending submission"
                  : value}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Payer reference
          <input
            name="reference"
            maxLength={100}
            defaultValue={claim.payerReference}
            placeholder="Reference from your billing system"
          />
        </label>
        <FormError error={task.error} />
        <div className="modal-footer">
          <Button type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" busy={task.busy}>
            Save ledger update
          </Button>
        </div>
      </form>
    </Modal>
  );
}
export default function Billing() {
  const { data } = useWorkspace();
  const task = useTask();
  const [status, setStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<ClaimDTO | null>(null);
  const filtered = data.claims.filter(
    (c) =>
      (status === "All" || c.status === status) &&
      `${c.clientName} ${c.billingCode} ${c.payerReference}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const paid = data.claims.filter((c) => c.status === "Paid");
  const outstanding = data.claims.filter((c) => c.status !== "Paid");
  const total = (rows: ClaimDTO[]) => rows.reduce((n, c) => n + c.amount, 0);
  async function exportLedger() {
    await task.run(
      async () => {
        await request("/api/workspace/exports", {
          method: "POST",
          body: JSON.stringify({
            resource: "billing",
            ids: filtered.map((c) => c._id),
          }),
        });
        csvDownload("swiftcare-billing-ledger.csv", [
          [
            "Client",
            "Service date",
            "CPT",
            "Units",
            "Amount USD",
            "Status",
            "Payer reference",
          ],
          ...filtered.map((c) => [
            c.clientName,
            c.dateOfService,
            c.billingCode,
            c.units,
            c.amount,
            c.status,
            c.payerReference,
          ]),
        ]);
      },
      "Billing export prepared.",
      false,
    );
  }
  return (
    <>
      <PageHeading
        eyebrow="Practice operations"
        title="Billing & claims"
        description="A clear claim pipeline, thoughtful follow-up, and fewer details slipping through the cracks."
        action={
          <Button onClick={() => void exportLedger()} busy={task.busy}>
            <Icon name="download" size={15} />
            Export CSV
          </Button>
        }
      />
      <div className="stats-grid">
        <Stat
          label="Total billed"
          value={currency(total(data.claims))}
          detail="Value of claims in the loaded ledger"
          icon="wallet"
        />
        <Stat
          label="Collected"
          value={currency(total(paid))}
          detail={`${paid.length} claims recorded as paid`}
          icon="check"
        />
        <Stat
          label="Outstanding"
          value={currency(total(outstanding))}
          detail={`${outstanding.length} claims to keep moving`}
          icon="clock"
          tone="amber"
        />
        <Stat
          label="Needs follow-up"
          value={data.claims.filter((c) => c.status === "Denied").length}
          detail="Denied claims awaiting your attention"
          icon="alert"
          tone="rose"
        />
      </div>
      <div className="panel" style={{ marginBottom: 24 }}>
        <div className="panel-pad" style={{ paddingBottom: 0 }}>
          <h2 style={{ fontSize: 16 }}>Outstanding aging</h2>
          <p className="small muted">
            Days since service date · includes drafts and denied claims
          </p>
        </div>
        <div className="billing-aging">
          {[
            [0, 30],
            [31, 60],
            [61, 90],
            [91, Infinity],
          ].map(([min, max]) => (
            <div key={min}>
              <span>
                {max === Infinity ? "90+ days" : `${min}–${max} days`}
              </span>
              <strong>
                {currency(
                  total(
                    outstanding.filter((c) => {
                      const days = Math.floor(
                        (+new Date(data.asOf) - +new Date(c.dateOfService)) /
                          86400000,
                      );
                      return days >= min && days <= max;
                    }),
                  ),
                )}
              </strong>
            </div>
          ))}
        </div>
      </div>
      <div className="toolbar">
        <div className="tabs" role="tablist" aria-label="Claim status">
          {["All", "Pending Submission", "Submitted", "Paid", "Denied"].map(
            (value) => (
              <button
                key={value}
                role="tab"
                aria-selected={status === value}
                onClick={() => setStatus(value)}
              >
                {value === "Pending Submission" ? "Draft" : value}
              </button>
            ),
          )}
        </div>
        <input
          aria-label="Search claims"
          placeholder="Search client, CPT, or reference…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="panel">
        <DataTable
          title="Billing and claims ledger"
          rows={filtered}
          rowKey={(c) => c._id}
          columns={[
            {
              key: "client",
              title: "Client",
              sort: (c) => c.clientName,
              render: (c) => <strong>{c.clientName}</strong>,
            },
            {
              key: "date",
              title: "Service date",
              sort: (c) => c.dateOfService,
              render: (c) => dateLabel(c.dateOfService),
            },
            {
              key: "code",
              title: "CPT / units",
              render: (c) => (
                <>
                  {c.billingCode}
                  <small>{c.units} units</small>
                </>
              ),
            },
            {
              key: "amount",
              title: "Amount",
              sort: (c) => c.amount,
              render: (c) => <strong>{currency(c.amount)}</strong>,
            },
            {
              key: "status",
              title: "Status",
              sort: (c) => c.status,
              render: (c) => (
                <>
                  <Badge>
                    {c.status === "Pending Submission" ? "Draft" : c.status}
                  </Badge>
                  {c.requiresReview && <small>Billing review required</small>}
                </>
              ),
            },
            {
              key: "action",
              title: "",
              render: (c) => (
                <Button onClick={() => setEditing(c)}>
                  Review <Icon name="arrow" size={13} />
                </Button>
              ),
            },
          ]}
        />
      </div>
      {editing && (
        <ClaimEditor claim={editing} onClose={() => setEditing(null)} />
      )}
    </>
  );
}
