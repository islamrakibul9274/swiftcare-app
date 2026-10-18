import { csvText } from "@/lib/csv";
import { signOut } from "next-auth/react";
export async function request<T = { message: string }>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  const data = await response.json();
  if (response.status === 401) {
    void signOut({ redirectTo: "/login?expired=1" });
    throw new Error("Your session has ended. Please sign in again.");
  }
  if (!response.ok) throw new Error(data.message || "Please try again.");
  return data as T;
}
export function csvDownload(filename: string, rows: (string | number)[][]) {
  const blob = new Blob([csvText(rows)], { type: "text/csv;charset=utf-8" });
  download(filename, URL.createObjectURL(blob));
}
export function download(filename: string, url: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function currency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
export function dateLabel(value: string, withTime = false) {
  return new Date(value).toLocaleString(
    "en-US",
    withTime
      ? { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }
      : { month: "short", day: "numeric", year: "numeric" },
  );
}
