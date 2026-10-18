import AccessForm from "@/components/auth/AccessForm";
export const metadata = {
  title: "Set password | SwiftCare",
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <section className="access-page">
      <div className="auth-card">
        <span className="eyebrow">Your secure invitation</span>
        <h1>Make yourself at home.</h1>
        <p className="muted">
          Choose your own password to activate your account or complete a reset.
          Links work once and expire automatically.
        </p>
        <AccessForm mode="set" />
      </div>
    </section>
  );
}
