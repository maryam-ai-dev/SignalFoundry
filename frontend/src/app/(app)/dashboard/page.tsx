"use client";

import { useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { apiFetch } from "@/lib/api";

interface Insight {
  type: string;
  payload: Record<string, unknown>;
  confidence: number;
}

interface Opportunity {
  platform: string;
  postSummary: string;
  relevanceScore: number;
}

interface SwipeEntry {
  type: string;
  content: Record<string, unknown>;
  createdAt: string;
}

interface VoiceProfile {
  confidenceState: string;
  maturityScore: number;
}

export default function DashboardPage() {
  const { authenticated } = useRequireAuth();
  const workspaceId = useWorkspaceStore((s) => s.workspaceId);
  const [narratives, setNarratives] = useState<Insight[]>([]);
  const [objections, setObjections] = useState<Insight[]>([]);
  const [gaps, setGaps] = useState<Insight[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [savedHooks, setSavedHooks] = useState<SwipeEntry[]>([]);
  const [voice, setVoice] = useState<VoiceProfile | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadDashboard() {
    if (!workspaceId) return;
    setLoading(true);

    // Get latest run
    try {
      const runsRes = await apiFetch(`/api/research/runs?workspaceId=${workspaceId}`);
      const runs = await runsRes.json();
      if (Array.isArray(runs) && runs.length > 0) {
        const runId = runs[0].runId;

        const insRes = await apiFetch(`/api/insights?runId=${runId}`);
        const insights: Insight[] = await insRes.json();

        setNarratives(insights.filter((i) => i.type === "NARRATIVE").slice(0, 3));
        setObjections(insights.filter((i) => i.type === "OBJECTION").slice(0, 3));
        setGaps(insights.filter((i) => i.type === "BELIEF_GAP").slice(0, 3));
      }
    } catch {}

    // Opportunities
    try {
      const oppRes = await apiFetch(`/api/engagement/opportunities?workspaceId=${workspaceId}`);
      const opps = await oppRes.json();
      if (Array.isArray(opps)) setOpportunities(opps.slice(0, 5));
    } catch {}

    // Saved hooks
    try {
      const swRes = await apiFetch(`/api/swipe-file?workspaceId=${workspaceId}&type=HOOK`);
      const sw = await swRes.json();
      if (Array.isArray(sw)) setSavedHooks(sw.slice(0, 3));
    } catch {}

    // Voice profile
    try {
      const vRes = await apiFetch(`/api/voice-profiles/me?workspaceId=${workspaceId}`);
      const v = await vRes.json();
      if (v.confidenceState) setVoice(v);
    } catch {}

    setLastUpdated(new Date());
    setLoading(false);
  }

  useEffect(() => {
    loadDashboard();
  }, [workspaceId]);

  if (!authenticated) return null;

  const timeAgo = lastUpdated
    ? `${Math.round((Date.now() - lastUpdated.getTime()) / 60000)} min ago`
    : "";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
        <button
          onClick={loadDashboard}
          disabled={loading}
          className="rounded-md bg-[--primary] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {timeAgo && (
        <p className="text-xs text-[--text-muted]">Last updated {timeAgo}</p>
      )}

      <div className="grid grid-cols-3 gap-4">
        {/* Rising Narratives */}
        <DashCard title="Rising Narratives">
          {narratives.length === 0 ? (
            <Empty />
          ) : (
            narratives.map((n, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-purple-400">
                    {(n.payload.direction as string) || "STABLE"}
                  </span>
                </div>
                <p className="text-xs text-[--text-secondary]">
                  {(n.payload.summary as string)?.slice(0, 100) || "No summary"}
                </p>
              </div>
            ))
          )}
        </DashCard>

        {/* Strongest Objections */}
        <DashCard title="Strongest Objections">
          {objections.length === 0 ? (
            <Empty />
          ) : (
            objections.map((o, i) => (
              <div key={i} className="space-y-1">
                <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-amber-400">
                  {(o.payload.theme as string) || "Objection"}
                </span>
                <p className="text-xs text-[--text-secondary]">
                  {((o.payload.representative_quotes as string[]) || [])[0]?.slice(0, 80) || ""}
                </p>
              </div>
            ))
          )}
        </DashCard>

        {/* Content Gaps */}
        <DashCard title="Content Gaps">
          {gaps.length === 0 ? (
            <Empty />
          ) : (
            gaps.map((g, i) => (
              <div key={i} className="space-y-1">
                <p className="text-xs text-[--text-secondary]">
                  <span className="text-[--text-muted]">Gap: </span>
                  {(g.payload.gap_summary as string)?.slice(0, 100) || ""}
                </p>
              </div>
            ))
          )}
        </DashCard>

        {/* Comment Opportunities */}
        <DashCard title="Comment Opportunities">
          {opportunities.length === 0 ? (
            <Empty />
          ) : (
            opportunities.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-blue-400">
                  {o.platform}
                </span>
                <div className="flex-1">
                  <p className="text-xs text-[--text-secondary] line-clamp-1">
                    {o.postSummary?.slice(0, 60)}
                  </p>
                </div>
                <div className="h-1 w-12 rounded-full bg-[--bg-base]">
                  <div
                    className="h-1 rounded-full bg-green-400"
                    style={{ width: `${Math.round(o.relevanceScore * 100)}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </DashCard>

        {/* Recent Saved Hooks */}
        <DashCard title="Recent Saved Hooks">
          {savedHooks.length === 0 ? (
            <Empty />
          ) : (
            savedHooks.map((h, i) => (
              <p key={i} className="text-xs text-[--text-secondary]">
                {(h.content?.text as string)?.slice(0, 80) || JSON.stringify(h.content).slice(0, 80)}
              </p>
            ))
          )}
        </DashCard>

        {/* Voice Profile */}
        <DashCard title="Voice Profile">
          {voice ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    voice.confidenceState === "USABLE" || voice.confidenceState === "MATURE"
                      ? "bg-green-500/20 text-green-400"
                      : voice.confidenceState === "COLLECTING"
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {voice.confidenceState}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-[--text-muted]">
                  <span>Maturity</span>
                  <span>{Math.round(voice.maturityScore * 100)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-[--bg-base]">
                  <div
                    className="h-1.5 rounded-full"
                    style={{
                      width: `${Math.round(voice.maturityScore * 100)}%`,
                      background: "var(--rainbow)",
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <Empty />
          )}
        </DashCard>
      </div>
    </div>
  );
}

function DashCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[--border] bg-[--bg-panel] p-4 space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-[--text-muted]">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Empty() {
  return <p className="text-xs text-[--text-muted]">No data yet</p>;
}
