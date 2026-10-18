import Link from "next/link";
export const metadata = { title: "Join your clinic | SwiftCare" };
export default function RegisterPage() {
  return (
    <section className="access-page">
      <div className="auth-card">
        <span className="eyebrow">Join your care team</span>
        <h1>Care starts with connection.</h1>
        <p className="muted">
          Your clinic administrator creates your account and gives you a secure
          invitation link. Open it to choose your password and join the team.
        </p>
        <p className="notice">
          Invitations expire after 24 hours. Ask your administrator for a fresh
          link if yours has expired.
        </p>
        <Link className="button primary full" href="/login">
          I already have an account →
        </Link>
        <Link className="text-link" href="/forgot-password">
          Recover an existing account
        </Link>
      </div>
    </section>
  );
}
