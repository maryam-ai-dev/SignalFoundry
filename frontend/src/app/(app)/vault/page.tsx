"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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

function entryId(entry: SwipeEntry): string {
  return entry.id || entry.entryId || "";
}

export default function VaultPage() {
  const { authenticated } = useRequireAuth();
  const router = useRouter();
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
  const [cursor, setCursor] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState("");
  const listRef = useRef<HTMLUListElement | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 1800);
    return () => clearTimeout(t);
  }, [toast]);

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
    setCursor(0);
    setExpanded(null);
    setSelected(new Set());
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

  function copyText(entry: SwipeEntry) {
    const text = extractText(entry);
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(
        () => setToast("Copied"),
        () => setToast("Copy failed")
      );
    } else {
      setToast("Clipboard unavailable");
    }
  }

  async function archiveOne(entry: SwipeEntry) {
    const id = entryId(entry);
    if (!id) return;
    try {
      await apiFetch(`/api/swipe-file/${id}/archive`, { method: "POST" });
      setEntries((prev) => ({
        ...prev,
        [tab]: prev[tab].filter((e) => entryId(e) !== id),
      }));
    } catch {
      setToast("Archive failed");
    }
  }

  async function archiveSelected() {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    const results = await Promise.allSettled(
      ids.map((id) =>
        apiFetch(`/api/swipe-file/${id}/archive`, { method: "POST" })
      )
    );
    const succeeded = new Set(
      ids.filter((_, i) => results[i].status === "fulfilled")
    );
    setEntries((prev) => ({
      ...prev,
      [tab]: prev[tab].filter((e) => !succeeded.has(entryId(e))),
    }));
    setSelected(new Set());
  }

  function toggleSelect(entry: SwipeEntry) {
    const id = entryId(entry);
    if (!id) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function turnIntoHook(entry: SwipeEntry) {
    const id = entryId(entry);
    router.push(`/studio?signal=${encodeURIComponent(id)}`);
  }

  function regenerateInStudio(entry: SwipeEntry) {
    const id = entryId(entry);
    router.push(`/studio?hook=${encodeURIComponent(id)}`);
  }

  function onListKeyDown(e: React.KeyboardEvent<HTMLUListElement>) {
    if (visible.length === 0) return;
    if (e.key === "j" || e.key === "J" || e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(visible.length - 1, c + 1));
    } else if (e.key === "k" || e.key === "K" || e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(0, c - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const entry = visible[cursor];
      if (entry) setExpanded(entryId(entry) === expanded ? null : entryId(entry));
    } else if (e.key === "a" || e.key === "A") {
      e.preventDefault();
      const entry = visible[cursor];
      if (entry) void archiveOne(entry);
    } else if (e.key === "c" || e.key === "C") {
      e.preventDefault();
      const entry = visible[cursor];
      if (entry) copyText(entry);
    }
  }

  if (!authenticated) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Vault</h1>
        {selected.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-[--text-muted]">
              {selected.size} selected
            </span>
            <button
              onClick={archiveSelected}
              className="rounded-md border border-[--border] bg-[--bg-secondary] px-3 py-1 text-xs text-[--text-secondary] hover:text-white"
            >
              Archive selected
            </button>
          </div>
        )}
      </div>

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

      {toast && (
        <p className="rounded-md bg-[--bg-panel] px-3 py-1.5 text-[11px] text-[--text-secondary]">
          {toast}
        </p>
      )}

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
        <ul
          ref={listRef}
          tabIndex={0}
          onKeyDown={onListKeyDown}
          className="space-y-2 focus:outline-none"
        >
          {visible.map((entry, i) => {
            const id = entryId(entry);
            const isCursor = i === cursor;
            const isExpanded = expanded === id;
            return (
              <EntryRow
                key={id || i}
                entry={entry}
                tab={tab}
                active={isCursor}
                expanded={isExpanded}
                selected={selected.has(id)}
                onSelect={() => toggleSelect(entry)}
                onCopy={() => copyText(entry)}
                onArchive={() => archiveOne(entry)}
                onTurnIntoHook={() => turnIntoHook(entry)}
                onRegenerateInStudio={() => regenerateInStudio(entry)}
                onToggleExpand={() =>
                  setExpanded((x) => (x === id ? null : id))
                }
              />
            );
          })}
        </ul>
      )}

      <p className="font-mono text-[9px] uppercase tracking-wider text-[--text-muted]">
        J/K navigate · Enter expand · A archive · C copy
      </p>
    </div>
  );
}

export function extractText(entry: SwipeEntry): string {
  const c = entry.content || {};
  if (typeof c.text === "string") return c.text;
  if (typeof c.title === "string") return c.title as string;
  return JSON.stringify(c).slice(0, 200);
}

function EntryRow({
  entry,
  tab,
  active,
  expanded,
  selected,
  onSelect,
  onCopy,
  onArchive,
  onTurnIntoHook,
  onRegenerateInStudio,
  onToggleExpand,
}: {
  entry: SwipeEntry;
  tab: VaultTab;
  active: boolean;
  expanded: boolean;
  selected: boolean;
  onSelect: () => void;
  onCopy: () => void;
  onArchive: () => void;
  onTurnIntoHook: () => void;
  onRegenerateInStudio: () => void;
  onToggleExpand: () => void;
}) {
  const text = extractText(entry);
  const date = entry.createdAt ? entry.createdAt.slice(0, 10) : "";
  const status = entry.status;
  const expired =
    entry.expiresAt && Date.parse(entry.expiresAt) < Date.now();

  return (
    <li
      className="rounded-md border bg-[--bg-panel] px-3 py-2 transition-colors"
      style={{
        borderColor: active ? "var(--primary)" : "var(--border)",
      }}
    >
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          className="h-3.5 w-3.5 accent-[--primary]"
          aria-label={`Select ${text.slice(0, 40)}`}
        />
        <span className="rounded bg-[--bg-secondary] px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-[--text-secondary]">
          {entry.type}
        </span>
        <button
          onClick={onToggleExpand}
          className="flex-1 truncate text-left text-xs text-[--text-secondary] hover:text-white"
        >
          {text}
        </button>
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
        {date && (
          <span className="font-mono text-[10px] text-[--text-muted]">{date}</span>
        )}
        <div className="flex items-center gap-1">
          {tab === "hooks" && (
            <>
              <RowAction onClick={onCopy} label="Copy" />
              <RowAction onClick={onRegenerateInStudio} label="In Studio" />
            </>
          )}
          {tab === "signals" && (
            <RowAction onClick={onTurnIntoHook} label="To hook" />
          )}
          {(tab === "threads" || tab === "reports") && (
            <RowAction onClick={onCopy} label="Copy" />
          )}
          <RowAction onClick={onArchive} label="Archive" />
        </div>
      </div>

      {expanded && (
        <div className="mt-2 whitespace-pre-wrap rounded-md border border-[--border] bg-[--bg-secondary] p-2 text-[11px] text-[--text-secondary]">
          {text}
        </div>
      )}
    </li>
  );
}

function RowAction({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="rounded border border-[--border] bg-[--bg-secondary] px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[--text-muted] hover:text-white"
    >
      {label}
    </button>
  );
}
