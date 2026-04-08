"use client";

import { useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { apiFetch } from "@/lib/api";
import DraftCard from "@/components/DraftCard";

const INTENT_TABS = ["All", "BUILD_TRUST", "JOIN_DISCUSSION", "HANDLE_OBJECTION"] as const;

interface Opportunity {
  id: string;
  platform: string;
  postSummary: string;
  postUrl: string;
  relevanceScore: number;
  engagementIntent: string;
  status: string;
  expiresAt: string;
}

interface Draft {
  id: string;
  draftText: string;
  editedText: string;
  strategyType: string;
  status: string;
  riskFlags: string[];
  requiresEdit: boolean;
}

export default function EngagementPage() {
  const { authenticated } = useRequireAuth();
  const workspaceId = useWorkspaceStore((s) => s.workspaceId);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [selected, setSelected] = useState<Opportunity | null>(null);
  const [intentFilter, setIntentFilter] = useState<string>("All");
  const [loading, setLoading] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [generatingDraft, setGeneratingDraft] = useState(false);

  useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);
    apiFetch(`/api/engagement/opportunities?workspaceId=${workspaceId}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setOpportunities(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [workspaceId]);

  // Load drafts when opportunity selected
  useEffect(() => {
    if (!selected) { setDrafts([]); return; }
    apiFetch(`/api/engagement/drafts?opportunityId=${selected.id}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setDrafts(data); })
      .catch(() => {});
  }, [selected]);

  async function handleGenerateDraft() {
    if (!selected) return;
    setGeneratingDraft(true);
    try {
      const res = await apiFetch(`/api/engagement/opportunities/${selected.id}/generate-draft`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setDrafts(data);
      }
    } catch {}
    setGeneratingDraft(false);
  }

  const filtered =
    intentFilter === "All"
      ? opportunities
      : opportunities.filter((o) => o.engagementIntent === intentFilter);

  if (!authenticated) return null;

  return (
    <div className="flex gap-4 h-[calc(100vh-5rem)]">
      {/* Left — Opportunity List */}
      <div className="w-[28%] flex flex-col rounded-lg border border-[--border] bg-[--bg-panel] overflow-hidden">
        {/* Intent filter tabs */}
        <div className="flex border-b border-[--border] p-1 gap-1 overflow-x-auto">
          {INTENT_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setIntentFilter(tab)}
              className={`whitespace-nowrap rounded px-2 py-1 text-[10px] font-medium transition-colors ${
                intentFilter === tab
                  ? "bg-[--bg-secondary] text-white"
                  : "text-[--text-muted] hover:text-[--text-secondary]"
              }`}
            >
              {tab === "All" ? "All" : tab.replace("_", " ")}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {loading ? (
            <p className="p-4 text-sm text-[--text-muted]">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="p-4 text-sm text-[--text-muted]">No opportunities yet</p>
          ) : (
            filtered.map((opp) => (
              <button
                key={opp.id}
                onClick={() => setSelected(opp)}
                className={`w-full rounded-md border p-3 text-left transition-colors ${
                  selected?.id === opp.id
                    ? "border-[--primary] bg-[--bg-secondary]"
                    : "border-[--border] bg-[--bg-secondary] hover:border-[--text-muted]"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-blue-400">
                    {opp.platform}
                  </span>
                  <span className="text-[10px] text-[--text-muted]">
                    {opp.engagementIntent?.replace("_", " ")}
                  </span>
                </div>
                <p className="text-xs text-[--text-secondary] line-clamp-2">
                  {opp.postSummary || "No summary"}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      opp.relevanceScore >= 0.7
                        ? "bg-green-400"
                        : opp.relevanceScore >= 0.5
                        ? "bg-amber-400"
                        : "bg-red-400"
                    }`}
                  />
                  <span className="text-[10px] text-[--text-muted]">
                    {Math.round(opp.relevanceScore * 100)}% relevant
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Centre — Post Detail */}
      <div className="flex-1 rounded-lg border border-[--border] bg-[--bg-panel] p-4 overflow-y-auto">
        {selected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="rounded bg-blue-500/20 px-2 py-0.5 text-xs font-semibold uppercase text-blue-400">
                {selected.platform}
              </span>
              <span className="text-xs text-[--text-muted]">{selected.status}</span>
            </div>
            <p className="text-sm leading-relaxed text-[--text-secondary]">
              {selected.postSummary}
            </p>
            {selected.postUrl && (
              <a
                href={selected.postUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[--primary] hover:underline"
              >
                View original post →
              </a>
            )}
            <button
              onClick={handleGenerateDraft}
              disabled={generatingDraft}
              className="mt-4 rounded-md bg-[--primary] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {generatingDraft ? "Generating..." : "Generate Draft"}
            </button>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-[--text-muted]">Select an opportunity</p>
          </div>
        )}
      </div>

      {/* Right — Draft Panel */}
      <div className="w-[28%] rounded-lg border border-[--border] bg-[--bg-panel] p-4 overflow-y-auto">
        {generatingDraft ? (
          <div className="flex h-full items-center justify-center">
            <div className="space-y-2 text-center">
              <div className="mx-auto h-6 w-6 animate-pulse rounded-full bg-[--primary]/30" />
              <p className="text-sm text-[--text-muted]">Generating drafts...</p>
            </div>
          </div>
        ) : drafts.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Drafts</h3>
            {drafts.map((d) => (
              <DraftCard
                key={d.id}
                id={d.id}
                draftText={d.draftText}
                editedText={d.editedText}
                strategyType={d.strategyType}
                status={d.status}
                riskFlags={d.riskFlags}
                requiresEdit={d.requiresEdit}
                onApprove={async () => {
                  await apiFetch(`/api/engagement/drafts/${d.id}/approve`, { method: "POST" });
                }}
                onReject={async () => {
                  await apiFetch(`/api/engagement/drafts/${d.id}/reject`, { method: "POST" });
                }}
                onEdit={async (text) => {
                  await apiFetch(`/api/engagement/drafts/${d.id}/edit`, {
                    method: "PUT",
                    body: JSON.stringify({ editedText: text }),
                  });
                }}
              />
            ))}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-[--text-muted]">
              {selected ? "Click Generate Draft" : "Select an opportunity"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
