import Link from "next/link";
import Logo from "@/components/Logo";
export default function Navbar() {
  return (
    <header className="public-nav">
      <Link className="public-brand" href="/" aria-label="SwiftCare home">
        <Logo className="brand-icon" />
        <span>
          swift<span>care</span>
        </span>
      </Link>
      <nav className="public-nav-links" aria-label="Main navigation">
        <Link href="/#features">Made for your team</Link>
        <Link href="/#workflow">How it works</Link>
        <Link href="/#care">Our approach</Link>
      </nav>
      <div className="public-nav-actions">
        <Link className="text-link" href="/login">
          Sign in
        </Link>
        <Link className="button primary" href="/register">
          Join your workspace <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </header>
  );
}
