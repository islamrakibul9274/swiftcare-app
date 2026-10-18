"use client";
import { useState, useRef } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Button, Empty, Icon, useToast, useHydrated } from "@/components/ui";
import { currency, download, request } from "@/lib/client";
import { clientName, type WorkspaceData } from "@/lib/dto";
export default function Charts({
  data,
  revenue = false,
}: {
  data: WorkspaceData;
  revenue?: boolean;
}) {
  const toast = useToast();
  const hydrated = useHydrated();
  const [clientId, setClientId] = useState(data.clients[0]?._id || "");
  const [target, setTarget] = useState("");
  const [days, setDays] = useState(30);
  const [compare, setCompare] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const client =
    data.clients.find((c) => c._id === clientId) || data.clients[0];
  const behavior =
    client?.targetBehaviors.find((b) => b.name === target) ||
    client?.targetBehaviors[0];
  const goal = client?.goals.find((g) => g.name === behavior?.name);
  const approved = data.notes
    .filter((n) => n.status === "Approved" && n.clientId === client?._id)
    .sort((a, b) => +new Date(a.date) - +new Date(b.date));
  const cutoff = +new Date(data.asOf) - days * 86400000;
  const current = approved.filter((n) => +new Date(n.date) >= cutoff);
  const previous = approved
    .filter((n) => +new Date(n.date) < cutoff)
    .slice(-current.length);
  const measurement = behavior?.measurement || "frequency";
  const valueFor = (note: (typeof approved)[number]) => {
    const value = note.behaviors.find((b) => b.name === behavior?.name);
    return !value
      ? null
      : measurement === "duration"
        ? +(value.durationSeconds / 60).toFixed(1)
        : measurement === "interval"
          ? value.opportunities
            ? Math.round((value.intervals / value.opportunities) * 100)
            : null
          : value.count;
  };
  const points = current.map((note, i) => ({
    date: new Date(note.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    value: valueFor(note),
    previous: previous[i] ? valueFor(previous[i]) : null,
  }));
  const phase = goal?.phaseDate
    ? current.find((n) => +new Date(n.date) >= +new Date(goal.phaseDate!))
    : null;
  const revenueGroups: Record<
    string,
    { date: string; paid: number; outstanding: number }
  > = {};
  data.claims
    .filter((c) => +new Date(c.dateOfService) >= cutoff)
    .sort((a, b) => +new Date(a.dateOfService) - +new Date(b.dateOfService))
    .forEach((c) => {
      const key = c.dateOfService.slice(0, 10);
      revenueGroups[key] ??= {
        date: new Date(c.dateOfService).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        paid: 0,
        outstanding: 0,
      };
      revenueGroups[key][c.status === "Paid" ? "paid" : "outstanding"] +=
        c.amount;
    });
  const moneyPoints = Object.values(revenueGroups);
  async function exportImage() {
    const svg = chartRef.current?.querySelector("svg.recharts-surface");
    if (!svg) return;
    try {
      await request("/api/workspace/exports", {
        method: "POST",
        body: JSON.stringify({
          resource: revenue ? "billing" : "notes",
          ids: revenue
            ? data.claims
                .filter((c) => +new Date(c.dateOfService) >= cutoff)
                .map((c) => c._id)
            : current.map((n) => n._id),
        }),
      });
    } catch (error) {
      toast(
        error instanceof Error
          ? error.message
          : "The export could not be prepared.",
        true,
      );
      return;
    }
    const clone = svg.cloneNode(true) as SVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute(
      "style",
      "background:#fff;color:#262626;--muted:#666;--surface:#fff;--text:#262626;--border:#ddd;--brand:#262626",
    );
    const width = svg.clientWidth || 800,
      height = svg.clientHeight || 300;
    clone.setAttribute("width", String(width));
    clone.setAttribute("height", String(height));
    const blob = new Blob([new XMLSerializer().serializeToString(clone)], {
      type: "image/svg+xml",
    });
    const url = URL.createObjectURL(blob);
    const image = new window.Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width * 2;
      canvas.height = (height + 75) * 2;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(2, 2);
        ctx.fillStyle = "#222";
        ctx.font = "600 13px Arial";
        ctx.fillText(
          revenue
            ? "SwiftCare · Practice revenue"
            : `SwiftCare · ${client?.code || clientName(client)} · ${behavior?.name || "Observations"}`,
          12,
          22,
          width - 24,
        );
        ctx.font = "10px Arial";
        ctx.fillStyle = "#666";
        ctx.fillText(
          `Last ${days} days · ${revenue ? "Amounts in USD" : measurement === "duration" ? "Duration in minutes" : measurement === "interval" ? "Positive intervals (%)" : "Observed frequency"}`,
          12,
          40,
          width - 24,
        );
        ctx.drawImage(image, 0, 50, width, height);
        ctx.fillText(
          "Approved records · Assistive visualization; clinical interpretation required",
          12,
          height + 67,
          width - 24,
        );
        canvas.toBlob((png) => {
          if (png) download("swiftcare-chart.png", URL.createObjectURL(png));
        });
      }
      URL.revokeObjectURL(url);
    };
    image.onerror = () => {
      download("swiftcare-chart.svg", url);
    };
    image.src = url;
  }
  return (
    <div className="panel panel-pad">
      <div className="panel-heading">
        <div>
          <h2>
            {revenue ? "Practice revenue" : "Progress, one session at a time"}
          </h2>
          <p>
            {revenue
              ? "Paid and outstanding ledger amounts by service date"
              : "Approved clinical records · client-level observations"}
          </p>
        </div>
        <div className="chart-controls">
          <label>
            <span className="sr-only">Chart date range</span>
            <select value={days} onChange={(e) => setDays(+e.target.value)}>
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </label>
          <button
            className="icon-button no-print"
            onClick={() => void exportImage()}
            aria-label="Export chart as image"
            disabled={
              !hydrated || (revenue ? !moneyPoints.length : !points.length)
            }
          >
            <Icon name="download" size={16} />
          </button>
        </div>
      </div>
      {!revenue && (
        <div className="toolbar no-print">
          <div className="chart-controls">
            <label>
              <span className="sr-only">Chart client</span>
              <select
                value={client?._id || ""}
                onChange={(e) => setClientId(e.target.value)}
              >
                {data.clients.map((c) => (
                  <option value={c._id} key={c._id}>
                    {clientName(c)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="sr-only">Chart target</span>
              <select
                value={behavior?.name || ""}
                onChange={(e) => setTarget(e.target.value)}
              >
                {client?.targetBehaviors.map((b) => (
                  <option value={b.name} key={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="checkbox-label small">
            <input
              type="checkbox"
              checked={compare}
              onChange={(e) => setCompare(e.target.checked)}
            />
            Previous sessions
          </label>
        </div>
      )}
      <div className="chart-container" ref={chartRef}>
        {(revenue ? !moneyPoints.length : !points.length) ? (
          <Empty
            title="Progress will take shape here"
            description="Approved observations in this date range will appear in the chart."
          />
        ) : (
          <ResponsiveContainer
            width="100%"
            height="100%"
            initialDimension={{ width: 600, height: 290 }}
            minWidth={1}
            minHeight={1}
          >
            {revenue ? (
              <AreaChart
                data={moneyPoints}
                margin={{ top: 20, right: 10, left: -25, bottom: 0 }}
                accessibilityLayer
              >
                <defs>
                  <linearGradient
                    id="revenueGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0" stopColor="#7a7a7a" stopOpacity={0.25} />
                    <stop offset="1" stopColor="#7a7a7a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="#8e8e8e"
                  strokeOpacity={0.2}
                  vertical={false}
                  strokeDasharray="3 5"
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 9, fill: "var(--muted)" }}
                  dy={10}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 9, fill: "var(--muted)" }}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    color: "var(--text)",
                    fontSize: 11,
                  }}
                  formatter={(value) => currency(Number(value))}
                />
                <Area
                  name="Paid"
                  type="monotone"
                  dataKey="paid"
                  stroke="#707070"
                  fill="url(#revenueGradient)"
                  strokeWidth={2.5}
                  isAnimationActive={false}
                />
                <Area
                  name="Outstanding"
                  type="monotone"
                  dataKey="outstanding"
                  stroke="#888888"
                  fill="transparent"
                  strokeWidth={1.5}
                  strokeDasharray="4 5"
                  isAnimationActive={false}
                />
              </AreaChart>
            ) : (
              <LineChart
                data={points}
                margin={{ top: 25, right: 20, left: -25, bottom: 0 }}
                accessibilityLayer
              >
                <CartesianGrid
                  stroke="#8e8e8e"
                  strokeOpacity={0.2}
                  vertical={false}
                  strokeDasharray="3 5"
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 9, fill: "var(--muted)" }}
                  dy={10}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 9, fill: "var(--muted)" }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    color: "var(--text)",
                    fontSize: 11,
                  }}
                />
                {goal && (
                  <ReferenceLine
                    y={goal.target}
                    stroke="#888888"
                    strokeDasharray="5 5"
                    label={{
                      value: `Aim: ${goal.target}`,
                      position: "insideTopRight",
                      fontSize: 9,
                      fill: "var(--muted)",
                    }}
                  />
                )}
                {phase && (
                  <ReferenceLine
                    x={new Date(phase.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                    stroke="#888888"
                    strokeDasharray="3 5"
                    label={{
                      value: "Phase start",
                      position: "insideTopLeft",
                      fontSize: 9,
                      fill: "var(--muted)",
                    }}
                  />
                )}
                <Line
                  name={
                    measurement === "duration"
                      ? "Minutes"
                      : measurement === "interval"
                        ? "Positive intervals (%)"
                        : "Frequency"
                  }
                  type="linear"
                  dataKey="value"
                  stroke="#707070"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "var(--surface)", strokeWidth: 2 }}
                  activeDot={{ r: 5 }}
                  isAnimationActive={false}
                />
                {compare && (
                  <Line
                    name="Prior sessions"
                    type="linear"
                    dataKey="previous"
                    stroke="#888888"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                    isAnimationActive={false}
                  />
                )}
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
      <div className="row-between section-gap">
        <div className="chart-key">
          <span>
            <i />
            {revenue ? "Paid" : behavior?.name || "Observations"}
          </span>
          {revenue ? (
            <span>
              <i className="second" />
              Outstanding
            </span>
          ) : goal ? (
            <span>
              <i className="second" />
              Goal / aim line
            </span>
          ) : null}
        </div>
        <Button
          variant="ghost"
          onClick={() => window.print()}
          className="no-print"
        >
          Print / PDF <Icon name="arrow" size={13} />
        </Button>
      </div>
      {!revenue && (
        <p className="small muted" style={{ marginTop: 10 }}>
          Each point is one approved session.{" "}
          {measurement === "duration"
            ? "Duration shown in minutes."
            : measurement === "interval"
              ? "Positive intervals shown as a percentage of observed intervals."
              : "Frequency is an observed count, without duration normalization."}{" "}
          {compare &&
            "Comparison uses the most recent sessions before the selected date range, aligned by session order."}
        </p>
      )}
    </div>
  );
}
