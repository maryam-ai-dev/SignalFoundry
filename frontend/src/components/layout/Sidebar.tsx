"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Today", href: "/today" },
  { label: "Research", href: "/research" },
  { label: "Studio", href: "/studio" },
  { label: "Vault", href: "/vault" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-full w-56 flex-col border-r border-[--border] bg-[--bg-base]">
      <div className="flex h-14 items-center px-5">
        <span className="text-sm font-semibold tracking-wide text-white">
          SignalFoundry
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-2 py-2">
        {navItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center rounded-md px-3 py-2 text-sm transition-colors ${
                active
                  ? "text-white bg-[--bg-secondary]"
                  : "text-[--text-secondary] hover:text-white hover:bg-[--bg-secondary]"
              }`}
            >
              {active && (
                <span
                  className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full"
                  style={{ background: "var(--rainbow)" }}
                />
              )}
              <span className="hidden sm:inline">{item.label}</span>
              <span className="sm:hidden text-[10px] uppercase tracking-wide">
                {item.label.slice(0, 1)}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[--border] px-2 py-3">
        <Link
          href="/settings"
          className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
            pathname === "/settings" || pathname.startsWith("/settings/")
              ? "text-white bg-[--bg-secondary]"
              : "text-[--text-secondary] hover:text-white hover:bg-[--bg-secondary]"
          }`}
          aria-label="Settings"
        >
          <SettingsIcon />
          <span className="hidden sm:inline">Settings</span>
        </Link>
        <div className="mt-2 flex items-center justify-between px-3 py-1 font-mono text-[8px] uppercase tracking-wider text-[--text-muted]">
          <span>Command palette</span>
          <span>⌘K</span>
        </div>
      </div>
    </aside>
  );
}

function SettingsIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
