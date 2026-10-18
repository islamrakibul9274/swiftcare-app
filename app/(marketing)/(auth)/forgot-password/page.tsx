import AccessForm from "@/components/auth/AccessForm";
export const metadata = { title: "Reset password | SwiftCare" };
export default function Page() {
  return (
    <section className="access-page">
      <div className="auth-card">
        <span className="eyebrow">Account recovery</span>
        <h1>Let’s get you back in.</h1>
        <p className="muted">
          Request a secure, single-use password reset link.
        </p>
        <AccessForm mode="reset" />
      </div>
    </section>
  );
}
