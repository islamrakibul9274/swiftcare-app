"use client";
import { Button, Icon } from "@/components/ui";
export default function ErrorBoundary({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="error-page">
      <span className="icon-tile">
        <Icon name="alert" />
      </span>
      <h1>We couldn’t load this workspace.</h1>
      <p className="muted">
        Your saved records remain available. Try again, or return to sign in if
        your session has ended.
      </p>
      <div className="row">
        <Button onClick={reset} variant="primary">
          Try again
        </Button>
        <a className="button secondary" href="/login">
          Return to sign in
        </a>
      </div>
    </div>
  );
}
