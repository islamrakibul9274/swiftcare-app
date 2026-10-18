import Link from "next/link";
export default function NotFound() {
  return (
    <div className="error-page">
      <span className="eyebrow">404 · Record unavailable</span>
      <h1>There’s nothing here to open.</h1>
      <p className="muted">
        This page may have moved, or the record may be outside your assigned
        workspace.
      </p>
      <Link className="button primary" href="/login">
        Return to your workspace →
      </Link>
    </div>
  );
}
