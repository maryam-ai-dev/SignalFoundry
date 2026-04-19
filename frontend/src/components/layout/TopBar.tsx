"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkspaceStore, type AccountMode } from "@/stores/useWorkspaceStore";
import { apiFetch } from "@/lib/api";

interface ResearchRun {
  runId: string;
  status: string;
  phaseStatuses?: Record<string, { status: string }>;
}

type PillState = { run: ResearchRun; fading: boolean } | null;

interface WorkspaceSummary {
  id?: string;
  workspaceId?: string;
  name?: string;
  niche?: string;
  productName?: string;
  lastScanAt?: string;
  accountMode?: AccountMode;
}

const ACTIVE_STATUSES = new Set(["PENDING", "RUNNING", "PARTIAL_ANALYSIS_READY"]);

function countPhases(run: ResearchRun) {
  const statuses = run.phaseStatuses ?? {};
  const keys = Object.keys(statuses);
  if (keys.length === 0) return { done: 0, total: 5 };
  const done = keys.filter((k) => statuses[k]?.status === "done").length;
  return { done, total: Math.max(5, keys.length) };
}

export default function TopBar() {
  const router = useRouter();
  const workspaceId = useWorkspaceStore((s) => s.workspaceId);
  const workspace = useWorkspaceStore((s) => s.workspace);
  const setWorkspace = useWorkspaceStore((s) => s.setWorkspace);
  const [pill, setPill] = useState<PillState>(null);
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [wsLoading, setWsLoading] = useState(false);
  const [wsError, setWsError] = useState("");
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Clear pill on workspace switch so we never display a stale run label.
  useEffect(() => {
    if (fadeTimer.current) {
      clearTimeout(fadeTimer.current);
      fadeTimer.current = null;
    }
    setPill(null);
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId) return;
    let cancelled = false;

    async function poll() {
      try {
        const res = await apiFetch(`/api/research/runs?workspaceId=${workspaceId}&limit=2`);
        if (!res.ok) return;
        const runs: ResearchRun[] = await res.json();
        if (cancelled || !Array.isArray(runs)) return;

        const active = runs.find((r) => ACTIVE_STATUSES.has(r.status));
        if (active) {
          if (fadeTimer.current) {
            clearTimeout(fadeTimer.current);
            fadeTimer.current = null;
          }
          setPill({ run: active, fading: false });
          return;
        }

        setPill((current) => {
          if (!current || current.fading) return current;
          if (fadeTimer.current) clearTimeout(fadeTimer.current);
          fadeTimer.current = setTimeout(() => setPill(null), 3000);
          return { ...current, fading: true };
        });
      } catch {}
    }

    poll();
    const interval = setInterval(poll, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
      if (fadeTimer.current) clearTimeout(fadeTimer.current);
    };
  }, [workspaceId]);

  useEffect(() => {
    if (!dropdownOpen) return;
    setWsLoading(true);
    setWsError("");
    apiFetch(`/api/workspaces`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (Array.isArray(data)) setWorkspaces(data);
      })
      .catch((e) => setWsError((e as Error).message || "Failed to load"))
      .finally(() => setWsLoading(false));
  }, [dropdownOpen]);

  useEffect(() => {
    if (!dropdownOpen) return;
    function onDown(e: MouseEvent) {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDropdownOpen(false);
    }
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [dropdownOpen]);

  const workspaceName =
    (workspace && typeof workspace.name === "string" ? (workspace.name as string) : null) ||
    "My Workspace";

  async function selectWorkspace(w: WorkspaceSummary) {
    const id = w.id || w.workspaceId;
    if (!id) return;
    // Optimistic: update the store with what we already know about this
    // workspace so the TopBar name and Today fetches flip immediately.
    setWorkspace(id, {
      id,
      name: w.name,
      niche: w.niche,
      productName: w.productName,
      accountMode: w.accountMode,
    });
    setDropdownOpen(false);
    router.push("/today");
    try {
      const res = await apiFetch(`/api/workspaces/${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setWorkspace(id, data);
    } catch (e) {
      setWsError((e as Error).message || "Switch failed");
    }
  }

  return (
    <header className="fixed top-0 left-56 right-0 z-20 flex h-14 items-center justify-between border-b border-[--border] bg-[--bg-panel] px-6">
      <div className="flex items-center gap-4">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-white hover:bg-[--bg-secondary]"
          >
            {workspaceName}
            <span className="text-[--text-muted]">▾</span>
          </button>

          {dropdownOpen && (
            <div className="absolute left-0 top-full mt-1 min-w-[280px] overflow-hidden rounded-lg border border-[--border] bg-[--bg-panel] shadow-xl">
              {wsLoading && (
                <p className="px-3 py-2 text-xs text-[--text-muted]">Loading…</p>
              )}
              {wsError && (
                <p className="px-3 py-2 text-xs text-red-300">{wsError}</p>
              )}
              {!wsLoading && !wsError && workspaces.length === 0 && (
                <p className="px-3 py-2 text-xs text-[--text-muted]">No workspaces</p>
              )}
              {!wsLoading && workspaces.map((w) => {
                const id = w.id || w.workspaceId;
                const active = id === workspaceId;
                const niche = w.niche || w.productName || "—";
                const last = w.lastScanAt ? formatRelative(w.lastScanAt) : "no scans yet";
                return (
                  <button
                    key={id}
                    onClick={() => selectWorkspace(w)}
                    className="relative flex w-full items-center gap-3 border-b border-[--border] px-3 py-2 text-left hover:bg-[--bg-secondary] last:border-b-0"
                  >
                    {active && (
                      <span
                        className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
                        style={{ backgroundColor: "#9B5CFF" }}
                      />
                    )}
                    <span className="flex-1 space-y-0.5 pl-2">
                      <p className="text-sm text-white">{w.name || id?.slice(0, 8)}</p>
                      <p className="font-mono text-[10px] text-[--text-muted]">
                        {niche} · {last}
                      </p>
                    </span>
                    {w.accountMode && (
                      <span className="rounded bg-[--bg-secondary] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[--text-secondary]">
                        {w.accountMode}
                      </span>
                    )}
                  </button>
                );
              })}
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  router.push("/setup");
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-[--text-secondary] hover:bg-[--bg-secondary]"
              >
                <span className="font-mono text-[11px]">+</span>
                New workspace
              </button>
            </div>
          )}
        </div>

        {pill && (
          <button
            onClick={() => {
              router.push(`/research#run-${pill.run.runId}`);
            }}
            className="flex items-center gap-2 rounded-full border border-[--border] bg-[--bg-secondary] px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-white transition-opacity"
            style={{ opacity: pill.fading ? 0.5 : 1 }}
          >
            <span
              className="relative inline-flex h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: "#9B5CFF" }}
            >
              <span
                className="absolute inset-0 rounded-full"
                style={{
                  backgroundColor: "#9B5CFF",
                  animation: pill.fading ? undefined : "sf-pulse 1.4s ease-out infinite",
                }}
              />
            </span>
            {(() => {
              const { done, total } = countPhases(pill.run);
              return `Research · ${done}/${total}`;
            })()}
          </button>
        )}
      </div>

      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[--bg-secondary] text-xs font-medium text-[--text-secondary]">
        M
      </div>

      <style>{`@keyframes sf-pulse { 0% { transform: scale(1); opacity: 0.6; } 70% { transform: scale(2.2); opacity: 0; } 100% { transform: scale(2.2); opacity: 0; } }`}</style>
    </header>
  );
}

function formatRelative(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return iso.slice(0, 10);
  const diff = Date.now() - t;
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
