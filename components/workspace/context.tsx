"use client";
import { createContext, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui";
import type { WorkspaceData } from "@/lib/dto";
export const WorkspaceContext = createContext<{
  data: WorkspaceData;
  refresh: () => void;
} | null>(null);
export function useWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error("Workspace context is required");
  return value;
}
export function useTask() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();
  const router = useRouter();
  async function run(
    work: () => Promise<unknown>,
    message?: string,
    refresh = true,
  ) {
    if (busy) return false;
    setBusy(true);
    setError("");
    try {
      await work();
      if (message) toast(message);
      if (refresh) router.refresh();
      return true;
    } catch (cause) {
      const text =
        cause instanceof Error
          ? cause.message
          : "We could not save this. Please try again.";
      setError(text);
      toast(text, true);
      return false;
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, run };
}
export function FormError({ error }: { error: string }) {
  return error ? (
    <p role="alert" className="notice danger">
      {error}
    </p>
  ) : null;
}
