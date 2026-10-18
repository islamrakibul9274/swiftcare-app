import { redirect } from "next/navigation";
import { getActor } from "@/lib/security";
import { AppError } from "@/lib/errors";
import AppShell from "@/components/workspace/AppShell";
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let actor;
  try {
    actor = await getActor(undefined, true);
  } catch (error) {
    if (error instanceof AppError && error.status === 401)
      redirect("/login?expired=1");
    if (error instanceof AppError && error.code === "CLINIC_MAPPING_REQUIRED")
      redirect("/unauthorized?setup=1");
    throw error;
  }
  return (
    <AppShell
      user={{
        id: actor.id,
        name: actor.name,
        role: actor.role,
        clinicName: actor.clinicName,
      }}
      demo={process.env.SWIFTCARE_DEMO === "true"}
    >
      {children}
    </AppShell>
  );
}
