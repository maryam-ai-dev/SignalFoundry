"use client";

import { useCallback, useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { apiFetch } from "@/lib/api";
import StrategyCard from "@/components/StrategyCard";

const TABS = ["Hooks", "Angles", "Positioning", "Platform"] as const;
type Tab = (typeof TABS)[number];

interface HookItem {
  id: string;
  hookType: string;
  confidence: number;
  content: Record<string, unknown>;
  saved: boolean;
}

export default function StrategyPage() {
  const { authenticated } = useRequireAuth();
  const workspaceId = useWorkspaceStore((s) => s.workspaceId);
  const [tab, setTab] = useState<Tab>("Hooks");
  const [hooks, setHooks] = useState<HookItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [latestRunId, setLatestRunId] = useState<string | null>(null);

  // Fetch latest run for this workspace
  useEffect(() => {
    if (!workspaceId) return;
    apiFetch(`/api/research/runs?workspaceId=${workspaceId}`)
      .then((r) => r.json())
      .then((runs) => {
        if (Array.isArray(runs) && runs.length > 0) {
          setLatestRunId(runs[0].runId);
        }
      })
      .catch(() => {});
  }, [workspaceId]);

  // Fetch hooks when tab is Hooks and we have a runId
  useEffect(() => {
    if (tab !== "Hooks" || !latestRunId) return;
    setLoading(true);
    apiFetch(`/api/strategy/hooks?runId=${latestRunId}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setHooks(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tab, latestRunId]);

  async function saveHook(id: string) {
    await apiFetch(`/api/strategy/hooks/${id}/save`, { method: "POST" });
  }

  async function archiveHook(id: string) {
    await apiFetch(`/api/strategy/hooks/${id}/archive`, { method: "POST" });
    setHooks((prev) => prev.filter((h) => h.id !== id));
  }

  async function regenerateHook(id: string) {
    const res = await apiFetch(`/api/strategy/hooks/${id}/regenerate`, { method: "POST" });
    if (res.ok) {
      const updated = await res.json();
      setHooks((prev) => prev.map((h) => (h.id === id ? { ...h, content: updated.content } : h)));
    }
  }

  if (!authenticated) return null;

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 rounded-lg border border-[--border] bg-[--bg-panel] p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t
                ? "bg-[--bg-secondary] text-white"
                : "text-[--text-muted] hover:text-[--text-secondary]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "Hooks" && (
        <div className="space-y-3">
          {loading ? (
            <p className="text-sm text-[--text-muted]">Loading hooks...</p>
          ) : hooks.length === 0 ? (
            <p className="text-sm text-[--text-muted]">No hooks yet. Run a scan first.</p>
          ) : (
            hooks.map((h) => (
              <StrategyCard
                key={h.id}
                id={h.id}
                type={h.hookType}
                typeLabel={h.hookType.replace("_", " ")}
                text={(h.content?.text as string) || ""}
                secondaryText={(h.content?.source_basis as string) || ""}
                confidence={h.confidence}
                saved={h.saved}
                onSave={() => saveHook(h.id)}
                onArchive={() => archiveHook(h.id)}
                onRegenerate={() => regenerateHook(h.id)}
              />
            ))
          )}
        </div>
      )}

      {tab === "Angles" && (
        <p className="text-sm text-[--text-muted]">Angles tab — wired in next sprint</p>
      )}

      {tab === "Positioning" && (
        <p className="text-sm text-[--text-muted]">Positioning tab — wired in next sprint</p>
      )}

      {tab === "Platform" && (
        <p className="text-sm text-[--text-muted]">Platform adaptation — wired in next sprint</p>
      )}
    </div>
  );
}
