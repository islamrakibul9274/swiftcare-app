import LoginForm from "./LoginForm";
import Link from "next/link";
export const metadata = { title: "Sign in | SwiftCare" };
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  return (
    <section className="auth-wrap">
      <div className="auth-story">
        <span className="eyebrow">Your clinical workspace</span>
        <h2>
          Great care.
          <br />
          Clearly connected.
        </h2>
        <p>
          Your sessions, clinical insights, and care team. Thoughtfully
          connected in one workspace.
        </p>
        <p className="small">Built for the people behind every breakthrough.</p>
      </div>
      <div className="auth-card">
        <span className="eyebrow">Your clinic workspace</span>
        <h1>Sign in to SwiftCare.</h1>
        <p className="muted">
          Sign in with the account provided by your administrator.
        </p>
        <LoginForm
          callbackUrl={
            typeof query.callbackUrl === "string"
              ? query.callbackUrl
              : undefined
          }
          expired={query.expired === "1"}
        />
        <div className="auth-help">
          New to your team?{" "}
          <Link href="/register">Use your invitation to get started</Link>
        </div>
        {process.env.SWIFTCARE_DEMO === "true" && (
          <div className="demo-credentials">
            <strong>Synthetic demo clinic</strong>
            <p>
              Use <code>rbt@demo.swiftcare.example</code>,{" "}
              <code>bcba@demo.swiftcare.example</code>, or{" "}
              <code>admin@demo.swiftcare.example</code>.
            </p>
            <p>
              Password: <code>SwiftCareDemo2026!</code>
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
