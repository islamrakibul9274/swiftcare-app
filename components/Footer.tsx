import Link from "next/link";
import Logo from "@/components/Logo";
import { ThemeControl } from "@/components/workspace/AppShell";
export default function Footer() {
  return (
    <footer className="public-footer">
      <Link href="/" className="public-brand">
        <Logo className="brand-icon" />
        <span>
          swift<span>care</span>
        </span>
      </Link>
      <span>
        © {new Date().getFullYear()} SwiftCare. Built around better care.
      </span>
      <div>
        <Link href="/#features">Product</Link>
        <Link href="/login">Your workspace</Link>
        <span className="theme-public">
          <ThemeControl />
        </span>
      </div>
    </footer>
  );
}
