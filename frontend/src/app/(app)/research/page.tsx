"use client";

import { useCallback, useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { apiFetch } from "@/lib/api";
import ResearchRunStatus from "@/components/ResearchRunStatus";
import InsightCard from "@/components/InsightCard";

const PLATFORMS = ["reddit", "youtube", "web", "producthunt"];
const INSIGHT_ORDER = ["TREND", "NARRATIVE", "PAIN", "OBJECTION", "BELIEF_GAP", "LANGUAGE"];

interface Insight {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  confidence: number;
}

interface Synthesis {
  summary: string;
  key_themes: string[];
  recommended_directions: string[];
}

type ScanMode = "SCAN" | "VALIDATE";

export default function ResearchPage() {
  const { authenticated } = useRequireAuth();
  const workspaceId = useWorkspaceStore((s) => s.workspaceId);
  const accountMode = useWorkspaceStore((s) => s.accountMode);
  const [query, setQuery] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["reddit"]);
  const [mode, setMode] = useState<ScanMode>(accountMode === "INVESTOR" ? "VALIDATE" : "SCAN");
  const [ideaDescription, setIdeaDescription] = useState("");
  const [runId, setRunId] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [insights, setInsights] = useState<Insight[]>([]);
  const [synthesis, setSynthesis] = useState<Synthesis | null>(null);
  const [generatingStrategy, setGeneratingStrategy] = useState(false);

  function togglePlatform(p: string) {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  async function handleRunScan() {
    if (!workspaceId || !query.trim()) return;
    if (mode === "VALIDATE" && !ideaDescription.trim()) {
      setError("Describe your idea before validating.");
      return;
    }
    setError("");
    setScanning(true);
    setInsights([]);
    setSynthesis(null);
    setGeneratingStrategy(false);
    try {
      const res = await apiFetch("/api/research/runs", {
        method: "POST",
        body: JSON.stringify({
          workspaceId,
          niche: query.trim(),
          queryText: query.trim(),
          platforms: selectedPlatforms,
          mode,
          ideaDescription: mode === "VALIDATE" ? ideaDescription.trim() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to start scan");
        setScanning(false);
        return;
      }
      setRunId(data.runId);
    } catch {
      setError("Network error");
      setScanning(false);
    }
  }

  const onPartialReady = useCallback(async () => {
    if (!runId) return;
    setGeneratingStrategy(true);
    try {
      const res = await apiFetch(`/api/insights?runId=${runId}`);
      if (res.ok) {
        const data = await res.json();
        setInsights(data);
      }
    } catch {
      // silently fail — insights will load on complete
    }
  }, [runId]);

  const onComplete = useCallback(async () => {
    setScanning(false);
    setGeneratingStrategy(false);
    if (!runId || !workspaceId) return;

    // Fetch insights if not already loaded
    try {
      const insRes = await apiFetch(`/api/insights?runId=${runId}`);
      if (insRes.ok) {
        const data = await insRes.json();
        setInsights(data);
      }
    } catch {}

    // Fetch positioning/synthesis
    try {
      const posRes = await apiFetch(`/api/strategy/positioning?workspaceId=${workspaceId}`);
      if (posRes.ok) {
        const data = await posRes.json();
        if (data.content) {
          setSynthesis(data.content as Synthesis);
        }
      }
    } catch {}
  }, [runId, workspaceId]);

  async function handleSaveInsight(insight: Insight) {
    if (!workspaceId) return;
    await apiFetch("/api/swipe-file", {
      method: "POST",
      body: JSON.stringify({
        workspaceId,
        type: insight.type,
        content: insight.payload,
      }),
    });
  }

  function insightTitle(insight: Insight): string {
    const p = insight.payload;
    if (p.topic_label) return p.topic_label as string;
    if (p.theme) return p.theme as string;
    if (p.current_belief) return `Gap: ${(p.current_belief as string).slice(0, 60)}`;
    return insight.type;
  }

  function insightSummary(insight: Insight): string {
    const p = insight.payload;
    if (p.summary) return p.summary as string;
    if (p.gap_summary) return p.gap_summary as string;
    if (p.representative_quotes)
      return (p.representative_quotes as string[]).slice(0, 2).join(" | ");
    if (p.top_phrases) return (p.top_phrases as string[]).join(", ");
    if (p.direction)
      return `${p.direction} (momentum: ${p.momentum_score})`;
    return JSON.stringify(p).slice(0, 200);
  }

  function insightSourceCount(insight: Insight): number {
    const p = insight.payload;
    if (typeof p.post_count === "number") return p.post_count;
    if (typeof p.frequency === "number") return p.frequency;
    return 0;
  }

  // Group insights by type in defined order
  const grouped = INSIGHT_ORDER.map((type) => ({
    type,
    items: insights.filter((i) => i.type === type),
  })).filter((g) => g.items.length > 0);

  if (!authenticated) return null;

  return (
    <div className="flex gap-4 h-[calc(100vh-5rem)]">
      {/* Left — Search Panel */}
      <div className="w-[22%] flex flex-col gap-4 rounded-lg border border-[--border] bg-[--bg-panel] p-4">
        <h2 className="text-sm font-semibold text-white">New Scan</h2>

        <div className="flex rounded-full border border-[--border] bg-[--bg-secondary] p-0.5 text-[11px] font-medium">
          <button
            type="button"
            onClick={() => setMode("SCAN")}
            className={`flex-1 rounded-full px-3 py-1.5 transition-colors ${
              mode === "SCAN"
                ? "bg-[--bg-panel] text-white"
                : "text-[--text-muted] hover:text-[--text-secondary]"
            }`}
          >
            Scan niche
          </button>
          <button
            type="button"
            onClick={() => setMode("VALIDATE")}
            className={`flex-1 rounded-full px-3 py-1.5 transition-colors ${
              mode === "VALIDATE"
                ? "bg-[--bg-panel] text-white"
                : "text-[--text-muted] hover:text-[--text-secondary]"
            }`}
          >
            Validate an idea
          </button>
        </div>

        <input
          type="text"
          placeholder="What do you want to research?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleRunScan()}
          className="w-full rounded-md border border-[--border] bg-[--bg-secondary] px-3 py-2 text-sm text-white placeholder:text-[--text-muted] focus:outline-none focus:ring-1 focus:ring-[--ring]"
        />

        {mode === "VALIDATE" && (
          <div className="space-y-1">
            <textarea
              value={ideaDescription}
              onChange={(e) => setIdeaDescription(e.target.value.slice(0, 280))}
              rows={3}
              placeholder="Describe your idea in one sentence"
              className="w-full rounded-md border border-[--border] bg-[--bg-secondary] px-3 py-2 text-sm text-white placeholder:text-[--text-muted] focus:outline-none focus:ring-1 focus:ring-[--ring]"
            />
            <div className="flex justify-between font-mono text-[10px] text-[--text-muted]">
              <span>
                {ideaDescription.trim().length === 0 && "Required for validate"}
              </span>
              <span>{ideaDescription.length}/280</span>
            </div>
          </div>
        )}
        <div className="space-y-2">
          <p className="text-xs font-medium text-[--text-secondary]">Platforms</p>
          {PLATFORMS.map((p) => (
            <label key={p} className="flex items-center gap-2 text-sm text-[--text-secondary] cursor-pointer">
              <input
                type="checkbox"
                checked={selectedPlatforms.includes(p)}
                onChange={() => togglePlatform(p)}
                className="rounded border-[--border] bg-[--bg-secondary]"
              />
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </label>
          ))}
        </div>
        {error && (
          <p className="rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>
        )}
        {runId && (
          <ResearchRunStatus
            runId={runId}
            mode={mode}
            onPartialReady={onPartialReady}
            onComplete={onComplete}
          />
        )}
        <button
          onClick={handleRunScan}
          disabled={
            !query.trim() ||
            selectedPlatforms.length === 0 ||
            scanning ||
            (mode === "VALIDATE" && !ideaDescription.trim())
          }
          className="mt-auto w-full rounded-md bg-[--primary] px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {scanning ? "Scanning..." : mode === "VALIDATE" ? "Validate idea" : "Run Scan"}
        </button>
      </div>

      {/* Centre — Result Stream */}
      <div className="flex-1 rounded-lg border border-[--border] bg-[--bg-panel] p-4 overflow-y-auto">
        {insights.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-[--text-muted]">Run a scan to see insights</p>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map((group) => (
              <div key={group.type}>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[--text-muted]">
                  {group.type.replace("_", " ")}
                </h3>
                <div className="space-y-3">
                  {group.items.map((insight) => (
                    <InsightCard
                      key={insight.id}
                      type={insight.type}
                      title={insightTitle(insight)}
                      summary={insightSummary(insight)}
                      confidence={insight.confidence}
                      sourceCount={insightSourceCount(insight)}
                      onSave={() => handleSaveInsight(insight)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right — Synthesis Panel */}
      <div className="w-[23%] rounded-lg border border-[--border] bg-[--bg-panel] p-4 overflow-y-auto">
        {synthesis ? (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">Synthesis</h3>
            <p className="text-sm leading-relaxed text-[--text-secondary]">{synthesis.summary}</p>
            {synthesis.key_themes?.length > 0 && (
              <div>
                <h4 className="mb-2 text-xs font-semibold text-[--text-muted]">Key Themes</h4>
                <div className="flex flex-wrap gap-1">
                  {synthesis.key_themes.map((t, i) => (
                    <span key={i} className="rounded-full bg-[--bg-secondary] px-2 py-0.5 text-xs text-[--text-secondary]">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {synthesis.recommended_directions?.length > 0 && (
              <div>
                <h4 className="mb-2 text-xs font-semibold text-[--text-muted]">Recommended Directions</h4>
                <ul className="space-y-1">
                  {synthesis.recommended_directions.map((d, i) => (
                    <li key={i} className="text-sm text-[--text-secondary]">
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : generatingStrategy ? (
          <div className="flex h-full items-center justify-center">
            <div className="space-y-2 text-center">
              <div className="mx-auto h-6 w-6 animate-pulse rounded-full bg-amber-400/30" />
              <p className="text-sm text-amber-400">Generating strategy...</p>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-[--text-muted]">Synthesis will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
