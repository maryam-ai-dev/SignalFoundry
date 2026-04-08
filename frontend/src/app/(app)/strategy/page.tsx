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

interface AngleItem {
  id: string;
  angleType: string;
  confidence: number;
  content: Record<string, unknown>;
  saved: boolean;
}

interface Positioning {
  summary: string;
  key_themes: string[];
  recommended_directions: string[];
}

export default function StrategyPage() {
  const { authenticated } = useRequireAuth();
  const workspaceId = useWorkspaceStore((s) => s.workspaceId);
  const [tab, setTab] = useState<Tab>("Hooks");
  const [hooks, setHooks] = useState<HookItem[]>([]);
  const [angles, setAngles] = useState<AngleItem[]>([]);
  const [positioning, setPositioning] = useState<Positioning | null>(null);
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

  // Fetch angles
  useEffect(() => {
    if (tab !== "Angles" || !latestRunId) return;
    setLoading(true);
    apiFetch(`/api/strategy/angles?runId=${latestRunId}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setAngles(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tab, latestRunId]);

  // Fetch positioning
  useEffect(() => {
    if (tab !== "Positioning" || !workspaceId) return;
    setLoading(true);
    apiFetch(`/api/strategy/positioning?workspaceId=${workspaceId}`)
      .then((r) => r.json())
      .then((data) => { if (data.content) setPositioning(data.content as Positioning); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tab, workspaceId]);

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

  async function saveAngle(id: string) {
    await apiFetch(`/api/strategy/angles/${id}/save`, { method: "POST" });
  }

  async function archiveAngle(id: string) {
    await apiFetch(`/api/strategy/angles/${id}/archive`, { method: "POST" });
    setAngles((prev) => prev.filter((a) => a.id !== id));
  }

  async function regenerateAngle(id: string) {
    const res = await apiFetch(`/api/strategy/angles/${id}/regenerate`, { method: "POST" });
    if (res.ok) {
      const updated = await res.json();
      setAngles((prev) => prev.map((a) => (a.id === id ? { ...a, content: updated.content } : a)));
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
        <div className="space-y-3">
          {loading ? (
            <p className="text-sm text-[--text-muted]">Loading angles...</p>
          ) : angles.length === 0 ? (
            <p className="text-sm text-[--text-muted]">No angles yet. Run a scan first.</p>
          ) : (
            angles.map((a) => (
              <StrategyCard
                key={a.id}
                id={a.id}
                type={a.angleType}
                typeLabel={a.angleType.replace("_", " ")}
                text={(a.content?.title as string) || ""}
                secondaryText={(a.content?.example_opening_line as string) || (a.content?.description as string) || ""}
                confidence={a.confidence}
                saved={a.saved}
                onSave={() => saveAngle(a.id)}
                onArchive={() => archiveAngle(a.id)}
                onRegenerate={() => regenerateAngle(a.id)}
              />
            ))
          )}
        </div>
      )}

      {tab === "Positioning" && (
        <div className="rounded-lg border border-[--border] bg-[--bg-panel] p-6">
          {loading ? (
            <p className="text-sm text-[--text-muted]">Loading positioning...</p>
          ) : !positioning ? (
            <p className="text-sm text-[--text-muted]">No positioning profile yet. Run a scan first.</p>
          ) : (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-white">Positioning Profile</h2>
              <p className="text-sm leading-relaxed text-[--text-secondary]">{positioning.summary}</p>
              {positioning.key_themes?.length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[--text-muted]">Key Themes</h3>
                  <div className="flex flex-wrap gap-2">
                    {positioning.key_themes.map((t, i) => (
                      <span key={i} className="rounded-full bg-[--bg-secondary] px-3 py-1 text-xs text-[--text-secondary]">{t}</span>
                    ))}
                  </div>
                </div>
              )}
              {positioning.recommended_directions?.length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[--text-muted]">Recommended Directions</h3>
                  <ul className="space-y-2">
                    {positioning.recommended_directions.map((d, i) => (
                      <li key={i} className="text-sm text-[--text-secondary]">{d}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === "Platform" && (
        <p className="text-sm text-[--text-muted]">Platform adaptation — coming soon</p>
      )}
    </div>
  );
}
