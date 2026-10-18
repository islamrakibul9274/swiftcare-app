import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
export default async function Unauthorized({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const setup = (await searchParams).setup === "1";
  return (
    <div className="error-page">
      <span className="eyebrow">
        {setup ? "Clinic setup" : "Workspace permissions"}
      </span>
      <h1>
        {setup
          ? "Your clinic access needs verification."
          : "This area needs a different role."}
      </h1>
      <p className="muted">
        {setup
          ? "Your administrator must complete the verified clinic mapping before this account can access clinical records. Your existing records are preserved."
          : "Your account does not have permission to open this workspace. Contact your clinic administrator if your role needs updating."}
      </p>
      <div className="row">
        <Link href="/login" className="button primary">
          Return to your workspace →
        </Link>
        <form action={logoutAction}>
          <button className="button secondary">Sign out</button>
        </form>
      </div>
    </div>
  );
}
