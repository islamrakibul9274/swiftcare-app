import { auth } from "@/auth"
import { redirect } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = (session.user as any).role;
  const userName = session.user.name || "User";

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar role={userRole} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header userName={userName} role={userRole} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}