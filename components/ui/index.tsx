"use client";
import { createPortal } from "react-dom";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
  type ButtonHTMLAttributes,
} from "react";
const subscribeHydration = () => () => {};
export function useHydrated() {
  return useSyncExternalStore(
    subscribeHydration,
    () => true,
    () => false,
  );
}
export function Icon({
  name,
  size = 20,
  ...props
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const paths: Record<string, string> = {
    grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
    calendar:
      "M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z",
    users:
      "M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M16 3a4 4 0 010 8m6 10v-2a4 4 0 00-3-3.87M13 7a4 4 0 11-8 0 4 4 0 018 0z",
    note: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M8 13h8m-8 4h6",
    chart: "M3 3v18h18M7 14l4-5 4 3 5-7",
    wallet:
      "M20 8V5a2 2 0 00-2-2H5a3 3 0 000 6h15v11H5a3 3 0 01-3-3V6m18 7h-5v3h5",
    shield: "M12 22s9-4 9-11V5l-9-3-9 3v6c0 7 9 11 9 11zM8 12l3 3 5-6",
    search: "M21 21l-5-5M18 10a8 8 0 11-16 0 8 8 0 0116 0z",
    bell: "M18 8a6 6 0 00-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4",
    chevron: "M9 5l7 7-7 7",
    arrow: "M5 12h14m-6-6l6 6-6 6",
    plus: "M12 5v14M5 12h14",
    minus: "M5 12h14",
    check: "M5 12l4 4L19 6",
    close: "M6 6l12 12M6 18L18 6",
    menu: "M4 6h16M4 12h16M4 18h16",
    settings:
      "M12 8a4 4 0 100 8 4 4 0 000-8M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10l2 2M5 19l2-2M17 7l2-2",
    sun: "M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6L7 7m10 10l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4M16 12a4 4 0 11-8 0 4 4 0 018 0z",
    clock: "M12 8v4l3 2M22 12a10 10 0 11-20 0 10 10 0 0120 0z",
    sparkle: "M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3z",
    download: "M12 3v12m-5-5l5 5 5-5M4 16v5h16v-5",
    play: "M7 4l14 8-14 8z",
    logout: "M9 4H4v16h5m6-13l5 5-5 5m-7-5h12",
    alert: "M12 8v5m0 4h.01M12 2L2 21h20z",
    leaf: "M20 3C7 2 2 9 5 16s15 5 15-13zM4 21L16 9",
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name] || paths.grid} />
    </svg>
  );
}
export function Button({
  children,
  variant = "secondary",
  busy,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  busy?: boolean;
}) {
  const hydrated = useHydrated();
  return (
    <button
      {...props}
      disabled={!hydrated || busy || props.disabled}
      className={`button ${variant} ${props.className || ""}`}
      aria-busy={busy}
    >
      {busy && <span className="spinner" />}
      {children}
    </button>
  );
}
export function Badge({
  children,
  tone,
}: {
  children: ReactNode;
  tone?: string;
}) {
  const text = typeof children === "string" ? children : "";
  return (
    <span
      className={`badge ${tone || (/Approved|Paid|Active|COMPLETED/.test(text) ? "green" : /Denied|Changes|Inactive/.test(text) ? "red" : /Pending|SCHEDULED/.test(text) ? "amber" : "neutral")}`}
    >
      <span />
      {children}
    </span>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        <p className="muted">{description}</p>
      </div>
      {action && <div className="heading-action">{action}</div>}
    </div>
  );
}
export function Empty({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-art">
        <Icon name="leaf" size={32} />
        <span>✦</span>
      </div>
      <h3>{title}</h3>
      <p className="muted">{description}</p>
      {action}
    </div>
  );
}
export function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div
      className="skeleton-stack"
      aria-label="Loading workspace"
      role="status"
    >
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton" />
      ))}
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    dialog?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    return () => dialog?.close();
  }, []);
  if (typeof document === "undefined") return null;
  return createPortal(
    <dialog
      ref={ref}
      className={`modal ${wide ? "wide" : ""}`}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-label={title}
    >
      <div className="modal-inner">
        <div className="modal-heading">
          <h2>{title}</h2>
          <Button variant="ghost" aria-label="Close dialog" onClick={onClose}>
            <Icon name="close" />
          </Button>
        </div>
        {children}
      </div>
    </dialog>,
    document.body,
  );
}
const ToastContext = createContext<(message: string, error?: boolean) => void>(
  () => {},
);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<
    { id: number; text: string; error: boolean }[]
  >([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const toast = useCallback((text: string, error = false) => {
    const id = Date.now() + Math.random();
    setMessages((items) => [...items.slice(-2), { id, text, error }]);
    timers.current.push(
      setTimeout(
        () => setMessages((items) => items.filter((m) => m.id !== id)),
        6000,
      ),
    );
  }, []);
  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {messages.map((m) => (
          <div key={m.id} className={`toast ${m.error ? "danger" : ""}`}>
            <Icon name={m.error ? "alert" : "check"} />
            <span>{m.text}</span>
            <button
              aria-label="Dismiss notification"
              onClick={() =>
                setMessages((items) => items.filter((n) => n.id !== m.id))
              }
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
export const useToast = () => useContext(ToastContext);
export function DataTable<T>({
  title,
  rows,
  columns,
  rowKey,
  pageSize = 8,
}: {
  title: string;
  rows: T[];
  columns: {
    key: string;
    title: string;
    render: (row: T) => ReactNode;
    sort?: (row: T) => string | number;
  }[];
  rowKey: (row: T) => string;
  pageSize?: number;
}) {
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<{ key: string; reverse: boolean } | null>(
    null,
  );
  const sorted = useMemo(() => {
    const column = columns.find((c) => c.key === sort?.key);
    if (!column?.sort || !sort) return rows;
    const value = column.sort;
    return [...rows].sort((a, b) => {
      const x = value(a),
        y = value(b);
      return (
        (typeof x === "number" && typeof y === "number"
          ? x - y
          : String(x).localeCompare(String(y))) * (sort.reverse ? -1 : 1)
      );
    });
  }, [rows, columns, sort]);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pages - 1);
  return (
    <div className="table-wrap">
      <div className="table-scroll">
        <table>
          <caption className="sr-only">{title}</caption>
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  aria-sort={
                    sort?.key === c.key
                      ? sort.reverse
                        ? "descending"
                        : "ascending"
                      : undefined
                  }
                >
                  {c.sort ? (
                    <button
                      onClick={() =>
                        setSort((s) => ({
                          key: c.key,
                          reverse: s?.key === c.key ? !s.reverse : false,
                        }))
                      }
                    >
                      {c.title} <span aria-hidden="true">↕</span>
                    </button>
                  ) : (
                    c.title
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted
              .slice(current * pageSize, (current + 1) * pageSize)
              .map((row) => (
                <tr key={rowKey(row)} data-record-id={rowKey(row)}>
                  {columns.map((c) => (
                    <td key={c.key}>{c.render(row)}</td>
                  ))}
                </tr>
              ))}
            {!rows.length && (
              <tr>
                <td colSpan={columns.length}>
                  <Empty
                    title="Nothing here yet"
                    description="Records will appear here when your team adds them."
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="table-footer">
        <span>
          {rows.length
            ? `${current * pageSize + 1}–${Math.min((current + 1) * pageSize, rows.length)}`
            : "0"}{" "}
          of {rows.length} records
        </span>
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
    </div>
  );
}
function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const previous = useRef(value);
  useEffect(() => {
    const from = previous.current;
    previous.current = value;
    if (from === value) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const progress = reduced ? 1 : Math.min(1, (now - start) / 220);
      setDisplay(Math.round(from + (value - from) * progress));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <>{display}</>;
}
export function Stat({
  label,
  value,
  detail,
  icon,
  tone = "neutral",
  trend,
  trendLabel,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: string;
  tone?: string;
  trend?: number[];
  trendLabel?: string;
}) {
  const low = Math.min(...(trend || [0]));
  const high = Math.max(...(trend || [0]));
  const points = trend
    ?.map(
      (v, i) =>
        `${(i * 76) / Math.max(1, trend.length - 1)},${high === low ? 13 : 24 - ((v - low) / (high - low)) * 22}`,
    )
    .join(" ");
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{label}</span>
        <span className={`icon-tile ${tone}`}>
          <Icon name={icon} />
        </span>
      </div>
      <div className="stat-value-row">
        <strong>
          {typeof value === "number" ? <AnimatedNumber value={value} /> : value}
        </strong>
        {points && (
          <svg
            viewBox="0 0 80 28"
            className="stat-sparkline"
            role="img"
            aria-label={`${trendLabel || "Daily values"}: ${trend!.join(", ")}`}
          >
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              points={points}
            />
          </svg>
        )}
      </div>
      <p>{detail}</p>
    </div>
  );
}
