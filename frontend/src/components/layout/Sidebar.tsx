"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Research", href: "/research" },
  { label: "Strategy", href: "/strategy" },
  { label: "Engagement", href: "/engagement" },
  { label: "Memory", href: "/memory" },
  { label: "Voice", href: "/voice" },
  { label: "Campaigns", href: "/campaigns" },
  { label: "Settings", href: "/settings" },
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
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
