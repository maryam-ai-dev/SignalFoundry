"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { apiFetch } from "@/lib/api";

type VaultTab = "hooks" | "signals" | "threads" | "reports";

const TABS: { id: VaultTab; label: string; type: string }[] = [
  { id: "hooks", label: "Hooks", type: "HOOK" },
  { id: "signals", label: "Signals", type: "SIGNAL" },
  { id: "threads", label: "Threads", type: "COMMENT" },
  { id: "reports", label: "Reports", type: "REPORT" },
];

type Sort = "new" | "old";

export interface SwipeEntry {
  id?: string;
  entryId?: string;
  type: string;
  status?: string;
  content: Record<string, unknown>;
  source?: string;
  createdAt?: string;
  expiresAt?: string;
}

export default function VaultPage() {
  const { authenticated } = useRequireAuth();
  const workspaceId = useWorkspaceStore((s) => s.workspaceId);
  const [tab, setTab] = useState<VaultTab>("hooks");
  const [entries, setEntries] = useState<Record<VaultTab, SwipeEntry[]>>({
    hooks: [],
    signals: [],
    threads: [],
    reports: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("new");

  const load = useCallback(
    async (active: VaultTab) => {
      if (!workspaceId) return;
      const spec = TABS.find((t) => t.id === active);
      if (!spec) return;
      setLoading(true);
      setError("");
      try {
        const res = await apiFetch(
          `/api/swipe-file?workspaceId=${workspaceId}&type=${spec.type}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setEntries((prev) => ({
          ...prev,
          [active]: Array.isArray(data) ? data : [],
        }));
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [workspaceId]
  );

  useEffect(() => {
    void load(tab);
  }, [tab, load]);

  const visible = useMemo(() => {
    const rows = entries[tab] || [];
    const filtered = query
      ? rows.filter((r) => extractText(r).toLowerCase().includes(query.toLowerCase()))
      : rows;
    return [...filtered].sort((a, b) => {
      const ad = Date.parse(a.createdAt || "");
      const bd = Date.parse(b.createdAt || "");
      if (Number.isNaN(ad) || Number.isNaN(bd)) return 0;
      return sort === "new" ? bd - ad : ad - bd;
    });
  }, [entries, tab, query, sort]);

  if (!authenticated) return null;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold text-white">Vault</h1>

      <nav className="flex border-b border-[--border]">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative px-4 py-2 text-sm transition-colors ${
                active ? "text-white" : "text-[--text-muted] hover:text-white"
              }`}
            >
              {t.label}
              {active && (
                <span
                  className="absolute inset-x-3 bottom-0 h-0.5"
                  style={{ background: "var(--rainbow)" }}
                />
              )}
            </button>
          );
        })}
      </nav>

      <div className="flex items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${tab}…`}
          className="flex-1 rounded-md border border-[--border] bg-[--bg-secondary] px-3 py-1.5 text-sm text-white placeholder:text-[--text-muted] focus:outline-none focus:ring-1 focus:ring-[--ring]"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="rounded-md border border-[--border] bg-[--bg-secondary] px-2 py-1.5 font-mono text-[11px] text-[--text-secondary]"
        >
          <option value="new">Newest</option>
          <option value="old">Oldest</option>
        </select>
      </div>

      {error ? (
        <div className="rounded-md border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-300">
          Couldn&apos;t load — {error}
        </div>
      ) : loading && visible.length === 0 ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-10 animate-pulse rounded-md border border-[--border] bg-[--bg-panel]"
            />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <p className="rounded-md border border-[--border] bg-[--bg-panel] px-3 py-6 text-center text-xs text-[--text-muted]">
          {query ? "No matches." : "Nothing saved here yet."}
        </p>
      ) : (
        <ul className="space-y-2">
          {visible.map((entry, i) => (
            <EntryRow key={entry.id || entry.entryId || i} entry={entry} />
          ))}
        </ul>
      )}
    </div>
  );
}

export function extractText(entry: SwipeEntry): string {
  const c = entry.content || {};
  if (typeof c.text === "string") return c.text;
  if (typeof c.title === "string") return c.title as string;
  return JSON.stringify(c).slice(0, 200);
}

function EntryRow({ entry }: { entry: SwipeEntry }) {
  const text = extractText(entry);
  const date = entry.createdAt ? entry.createdAt.slice(0, 10) : "";
  const status = entry.status;
  const expired =
    entry.expiresAt && Date.parse(entry.expiresAt) < Date.now();

  return (
    <li className="flex items-center gap-3 rounded-md border border-[--border] bg-[--bg-panel] px-3 py-2">
      <span className="rounded bg-[--bg-secondary] px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-[--text-secondary]">
        {entry.type}
      </span>
      <span className="flex-1 truncate text-xs text-[--text-secondary]">{text}</span>
      {status === "SHIPPED" && (
        <span className="rounded bg-green-500/20 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-green-300">
          SHIPPED
        </span>
      )}
      {expired && (
        <span className="rounded bg-[--bg-secondary] px-1.5 py-0.5 font-mono text-[9px] text-[--text-muted]">
          EXPIRED
        </span>
      )}
      {entry.source && (
        <span className="font-mono text-[10px] text-[--text-muted]">{entry.source}</span>
      )}
      {date && (
        <span className="font-mono text-[10px] text-[--text-muted]">{date}</span>
      )}
    </li>
  );
}
