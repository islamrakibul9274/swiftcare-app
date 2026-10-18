"use client";
import {
  useState,
  useEffect,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Logo from "@/components/Logo";
import { Button, Icon, Modal, useToast } from "@/components/ui";
import { request } from "@/lib/client";
import { IDLE_MS, roleHome, type Role } from "@/lib/policy";
import type { NotificationDTO } from "@/lib/dto";
export function navigation(role: Role) {
  const links = [
    { label: "Overview", href: roleHome(role), icon: "grid" },
    { label: "Schedule", href: "/schedule", icon: "calendar" },
    {
      label: role === "BCBA" ? "My caseload" : "Clients",
      href: "/clients",
      icon: "users",
    },
  ];
  if (role === "ADMIN")
    links.push(
      { label: "Billing & claims", href: "/admin/billing", icon: "wallet" },
      { label: "Care team", href: "/admin/staff", icon: "users" },
      { label: "Audit trail", href: "/admin/audit", icon: "shield" },
    );
  else if (role === "BCBA")
    links.push(
      { label: "Note review", href: "/director/notes", icon: "note" },
      { label: "Behavior insights", href: "/director/graphs", icon: "chart" },
      { label: "Supervision", href: "/director/supervision", icon: "shield" },
    );
  else links.push({ label: "My notes", href: "/tech/notes", icon: "note" });
  return links;
}
const subscribeTheme = (callback: () => void) => {
  window.addEventListener("storage", callback);
  window.addEventListener("swiftcare-theme", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("swiftcare-theme", callback);
  };
};
export function ThemeControl() {
  const theme = useSyncExternalStore(
    subscribeTheme,
    () => localStorage.getItem("swiftcare-theme") || "light",
    () => "light",
  );
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      document.documentElement.dataset.theme =
        theme === "system" ? (media.matches ? "dark" : "light") : theme;
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);
  return (
    <label className="theme-control">
      <Icon name="sun" size={18} />
      <span className="sr-only">Color theme</span>
      <select
        value={theme}
        onChange={(event) => {
          localStorage.setItem("swiftcare-theme", event.target.value);
          window.dispatchEvent(new Event("swiftcare-theme"));
        }}
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
  );
}
function SessionGuard({ userId }: { userId: string }) {
  const { data: currentSession, status } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login?expired=1");
    else if (status === "authenticated" && currentSession.user.id !== userId)
      router.replace(roleHome(currentSession.user.role));
  }, [status, currentSession, router, userId]);
  const lastActivity = useRef(0);
  const lastHeartbeat = useRef(0);
  const [warning, setWarning] = useState(false);
  useEffect(() => {
    lastActivity.current = Date.now();
    const channel = new BroadcastChannel(`swiftcare-session-${userId}`);
    const heartbeat = () => {
      if (Date.now() - lastHeartbeat.current < 60000) return;
      lastHeartbeat.current = Date.now();
      void request("/api/workspace/activity", {
        method: "POST",
        body: "{}",
      }).catch(() => {});
    };
    const activity = () => {
      lastActivity.current = Date.now();
      setWarning(false);
      channel.postMessage(lastActivity.current);
      heartbeat();
    };
    channel.onmessage = (event) => {
      if (typeof event.data === "number") {
        lastActivity.current = event.data;
        setWarning(false);
      }
    };
    const timer = setInterval(() => {
      const idle = Date.now() - lastActivity.current;
      if (idle >= IDLE_MS) void signOut({ redirectTo: "/login?expired=1" });
      else if (idle >= IDLE_MS - 120000) setWarning(true);
    }, 5000);
    for (const event of ["pointerdown", "keydown", "touchstart"])
      window.addEventListener(event, activity, { passive: true });
    heartbeat();
    const sessionCheck = setInterval(() => {
      void request("/api/workspace/profile").catch(() => {});
    }, 60000);
    return () => {
      clearInterval(sessionCheck);
      clearInterval(timer);
      channel.close();
      for (const event of ["pointerdown", "keydown", "touchstart"])
        window.removeEventListener(event, activity);
    };
  }, [userId]);
  return (
    warning && (
      <div className="idle-warning" role="alert">
        <Icon name="clock" />
        <span>Your session will end soon due to inactivity.</span>
        <Button
          onClick={() => {
            lastActivity.current = Date.now();
            setWarning(false);
            void request("/api/workspace/activity", {
              method: "POST",
              body: "{}",
            });
          }}
        >
          Keep working
        </Button>
      </div>
    )
  );
}
export default function AppShell({
  user,
  demo,
  children,
}: {
  user: { id: string; name: string; role: Role; clinicName: string };
  demo: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const links = navigation(user.role);
  const toast = useToast();
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [palette, setPalette] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    { label: string; detail: string; href: string }[]
  >([]);
  const [searching, setSearching] = useState(false);
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPalette((open) => !open);
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);
  useEffect(() => {
    const load = () => {
      void request<{ notifications: NotificationDTO[] }>(
        "/api/workspace/notifications",
      )
        .then((data) => setNotifications(data.notifications))
        .catch(() => {});
    };
    load();
    window.addEventListener("swiftcare-notifications", load);
    return () => window.removeEventListener("swiftcare-notifications", load);
  }, [pathname]);
  useEffect(() => {
    if (query.trim().length < 2) return;
    const abort = new AbortController();
    const timer = setTimeout(() => {
      setSearching(true);
      request<{ results: typeof results }>(
        `/api/workspace/search?q=${encodeURIComponent(query)}`,
        { signal: abort.signal },
      )
        .then((data) => setResults(data.results))
        .catch((error) => {
          if (!abort.signal.aborted) toast(error.message, true);
        })
        .finally(() => setSearching(false));
    }, 250);
    return () => {
      clearTimeout(timer);
      abort.abort();
    };
  }, [query, toast]);
  const selected = links.find((link) => pathname === link.href) || {
    label:
      pathname.includes("/clients/") || pathname.includes("/client/")
        ? "Client profile"
        : pathname === "/settings"
          ? "Settings"
          : pathname === "/notifications"
            ? "Notifications"
            : "Workspace",
  };
  const nav = (
    <>
      <Link href={roleHome(user.role)} className="shell-brand">
        <Logo className="brand-icon" />
        <span>
          swift<span>care</span>
          <small>Care, connected.</small>
        </span>
      </Link>
      <div className="clinic-switch">
        <span className="clinic-monogram">
          {user.clinicName.trim()[0]?.toUpperCase() || "C"}
        </span>
        <span>
          {user.clinicName}
          <small>
            {user.role === "BCBA"
              ? "Clinical workspace"
              : user.role === "RBT"
                ? "Technician workspace"
                : "Practice workspace"}
          </small>
        </span>
      </div>
      <p className="nav-label">WORKSPACE</p>
      <nav aria-label="Workspace navigation">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setMobile(false)}
            title={collapsed ? link.label : undefined}
            aria-current={pathname === link.href ? "page" : undefined}
            className={pathname === link.href ? "active" : ""}
          >
            <Icon name={link.icon} />
            <span>{link.label}</span>
            {pathname === link.href && <span className="nav-dot" />}
          </Link>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="care-reminder">
          <Icon name="leaf" size={23} />
          <p>
            A little less admin.
            <br />
            <strong>A little more care.</strong>
          </p>
        </div>
        <Link href="/settings" onClick={() => setMobile(false)}>
          <Icon name="settings" />
          <span>Settings & preferences</span>
        </Link>
        <Button
          variant="ghost"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="collapse-control"
        >
          <Icon name="menu" />
          <span>Collapse sidebar</span>
        </Button>
      </div>
    </>
  );
  return (
    <div className={`app-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      <a className="skip-link" href="#workspace-content">
        Skip to main content
      </a>
      <aside className="sidebar">{nav}</aside>
      {mobile && (
        <Modal title="Workspace menu" onClose={() => setMobile(false)}>
          <div className="mobile-nav">{nav}</div>
        </Modal>
      )}
      <div className="app-body">
        <header className="topbar">
          <div className="topbar-start">
            <Button
              variant="ghost"
              aria-label="Open navigation"
              className="mobile-menu"
              onClick={() => setMobile(true)}
            >
              <Icon name="menu" />
            </Button>
            <nav className="breadcrumbs" aria-label="Breadcrumb">
              <Link href={roleHome(user.role)}>Workspace</Link>
              <Icon name="chevron" size={13} />
              <span>{selected.label}</span>
            </nav>
          </div>
          <div className="topbar-actions">
            <button className="search-trigger" onClick={() => setPalette(true)}>
              <Icon name="search" size={17} />
              <span>Search anything…</span>
              <kbd>⌘ K</kbd>
            </button>
            <ThemeControl />
            <Link
              className="icon-button notification-bell"
              href="/notifications"
              aria-label={`Notifications, ${notifications.filter((n) => !n.readAt).length} unread`}
            >
              <Icon name="bell" />
              {notifications.some((n) => !n.readAt) && (
                <span className="notification-dot" />
              )}
            </Link>
            <details className="user-menu">
              <summary aria-label="User menu">
                <span className="avatar">
                  {user.name
                    .split(" ")
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <span className="user-summary">
                  {user.name}
                  <small>
                    {user.role === "BCBA"
                      ? "Clinical director"
                      : user.role === "RBT"
                        ? "Behavior technician"
                        : "Clinic administrator"}
                  </small>
                </span>
                <Icon name="chevron" size={13} />
              </summary>
              <div>
                <Link href="/settings">Profile & settings</Link>
                <Link href="/">Public website</Link>
                <button onClick={() => void signOut({ redirectTo: "/login" })}>
                  <Icon name="logout" size={16} /> Sign out
                </button>
              </div>
            </details>
          </div>
        </header>
        {demo && (
          <div className="demo-banner">
            <span>DEMO WORKSPACE</span> Synthetic records only · Do not enter
            real patient information.
          </div>
        )}
        <main id="workspace-content" className="workspace-content">
          {children}
        </main>
        <footer className="app-footer">
          <span>SwiftCare · A little more space for care.</span>
          <span>
            <Icon name="shield" size={13} /> Role-scoped workspace
          </span>
        </footer>
      </div>
      <SessionGuard userId={user.id} />
      {palette && (
        <Modal
          title="Find your way"
          onClose={() => {
            setPalette(false);
            setQuery("");
          }}
        >
          <label className="palette-search">
            <Icon name="search" />
            <span className="sr-only">
              Search clients, staff, notes, and pages
            </span>
            <input
              data-autofocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search clients, notes, or pages…"
            />
          </label>
          <p className="eyebrow palette-label">
            {query.trim().length >= 2
              ? "Matching records"
              : "Jump to a workspace"}
          </p>
          <div className="command-results">
            {query.trim().length >= 2 ? (
              searching ? (
                <p className="muted">Searching your permitted records…</p>
              ) : results.length ? (
                results.map((item, index) => (
                  <Link
                    key={`${item.href}-${index}`}
                    href={item.href}
                    onClick={() => {
                      setPalette(false);
                      setQuery("");
                    }}
                  >
                    <Icon name="search" />
                    <span>
                      {item.label}
                      <small>{item.detail}</small>
                    </span>
                    <Icon name="arrow" size={16} />
                  </Link>
                ))
              ) : (
                <p className="muted">No matching records in your workspace.</p>
              )
            ) : (
              [
                ...links,
                { label: "Settings", href: "/settings", icon: "settings" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setPalette(false)}
                >
                  <Icon name={link.icon} />
                  <span>{link.label}</span>
                  <Icon name="arrow" size={16} />
                </Link>
              ))
            )}
          </div>
          <p className="small muted">
            Only records your role is allowed to access appear here. Press Esc
            to close.
          </p>
        </Modal>
      )}
    </div>
  );
}
