"use client";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { PageHeading, Skeleton } from "@/components/ui";
import type { WorkspaceData } from "@/lib/dto";
import { WorkspaceContext } from "./context";
const Dashboard = dynamic(() => import("./Dashboard"), {
  loading: () => <Skeleton />,
});
const Notes = dynamic(() => import("./Notes"), { loading: () => <Skeleton /> });
const Staff = dynamic(() => import("./Staff"), { loading: () => <Skeleton /> });
const Billing = dynamic(() => import("./Billing"), {
  loading: () => <Skeleton />,
});
const Clients = dynamic(() => import("./Clients"), {
  loading: () => <Skeleton />,
});
const Schedule = dynamic(() => import("./Schedule"), {
  loading: () => <Skeleton />,
});
const Settings = dynamic(() => import("./Settings"), {
  loading: () => <Skeleton />,
});
const AuditTrail = dynamic(
  () => import("./Operations").then((m) => m.AuditTrail),
  { loading: () => <Skeleton /> },
);
const Notifications = dynamic(
  () => import("./Operations").then((m) => m.Notifications),
  { loading: () => <Skeleton /> },
);
const Supervision = dynamic(
  () => import("./Operations").then((m) => m.Supervision),
  { loading: () => <Skeleton /> },
);
const Charts = dynamic(() => import("./Charts"), {
  loading: () => <Skeleton />,
});
export default function Workspace({
  initialData,
  view,
  clientId,
}: {
  initialData: WorkspaceData;
  view: string;
  clientId?: string;
}) {
  const router = useRouter();
  return (
    <WorkspaceContext.Provider
      value={{ data: initialData, refresh: () => router.refresh() }}
    >
      {initialData.capped && (
        <p className="notice warning" style={{ marginBottom: 20 }}>
          This workspace shows the latest 250 records per collection. Use your
          clinic’s reporting process for a complete historical export.
        </p>
      )}
      {view === "overview" ? (
        <Dashboard />
      ) : view === "notes" ? (
        <Notes />
      ) : view === "staff" ? (
        <Staff />
      ) : view === "billing" ? (
        <Billing />
      ) : view === "clients" || view === "client" ? (
        <Clients clientId={clientId} />
      ) : view === "schedule" ? (
        <Schedule />
      ) : view === "settings" ? (
        <Settings />
      ) : view === "audit" ? (
        <AuditTrail />
      ) : view === "notifications" ? (
        <Notifications />
      ) : view === "supervision" ? (
        <Supervision />
      ) : view === "graphs" ? (
        <>
          <PageHeading
            eyebrow="Clinical insights"
            title="Behavior insights"
            description="Explore approved observations by client, target, and measurement type."
          />
          <Charts data={initialData} />
        </>
      ) : null}
    </WorkspaceContext.Provider>
  );
}
