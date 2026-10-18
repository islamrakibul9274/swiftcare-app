import { redirect, notFound } from "next/navigation";
import { getActor, getClient, audit } from "@/lib/security";
import { AppError } from "@/lib/errors";
import { workspaceData } from "@/lib/workspace";
import type { Role } from "@/lib/policy";
import Workspace from "./Workspace";
export default async function WorkspacePage({
  view,
  role,
  id,
}: {
  view: string;
  role?: Role;
  id?: string;
}) {
  let actor;
  try {
    actor = await getActor(role ? [role] : undefined, view === "settings");
  } catch (error) {
    if (error instanceof AppError) {
      if (error.status === 401) redirect("/login?expired=1");
      if (error.code === "PASSWORD_CHANGE_REQUIRED")
        redirect("/settings?required=1");
      redirect("/unauthorized");
    }
    throw error;
  }
  if (id) {
    try {
      await getClient(actor, id);
      await audit(actor, "view", "client", id);
    } catch {
      notFound();
    }
  }
  const data = await workspaceData(actor, view === "audit", view);
  return <Workspace initialData={data} view={view} clientId={id} />;
}
