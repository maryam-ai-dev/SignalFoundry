"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";

export interface Opportunity {
  id?: string;
  opportunityId?: string;
  platform: string;
  postSummary: string;
  postTitle?: string;
  relevanceScore: number;
  painScore?: number;
  createdAt?: string;
  expiresAt?: string;
}

interface Draft {
  draftId?: string;
  id?: string;
  text: string;
  requiresEdit?: boolean;
}

function notExpired(o: Opportunity): boolean {
  if (!o.expiresAt) return true;
  const exp = Date.parse(o.expiresAt);
  if (Number.isNaN(exp)) return true;
  return exp > Date.now();
}

export default function OpportunitiesList({ items }: { items: Opportunity[] | null }) {
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  if (!items || items.length === 0) {
    return <p className="text-xs text-[--text-muted]">No open opportunities right now.</p>;
  }

  const visible = items.filter(notExpired).slice(0, 10);

  async function generateDraft(o: Opportunity) {
    const id = o.id || o.opportunityId;
    if (!id) return;
    setLoadingId(id);
    setError("");
    try {
      const res = await apiFetch(`/api/engagement/opportunities/${id}/generate-draft`, {
        method: "POST",
      });
      if (!res.ok) {
        setError("Draft failed");
        return;
      }
      const data: Draft | Draft[] = await res.json();
      const first = Array.isArray(data) ? data[0] : data;
      setDrafts((prev) => ({ ...prev, [id]: first }));
    } catch {
      setError("Draft failed");
    } finally {
      setLoadingId(null);
    }
  }

  async function approve(opportunityId: string, draft: Draft) {
    if (draft.requiresEdit) return;
    const draftId = draft.draftId || draft.id;
    if (!draftId) return;
    try {
      await apiFetch(`/api/engagement/drafts/${draftId}/approve`, { method: "POST" });
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[opportunityId];
        return next;
      });
    } catch {
      setError("Approve failed");
    }
  }

  return (
    <div className="space-y-2">
      {error && (
        <p className="rounded-md bg-red-500/10 px-3 py-1.5 text-[11px] text-red-300">{error}</p>
      )}
      <ul className="space-y-2">
        {visible.map((o, i) => {
          const id = o.id || o.opportunityId || String(i);
          const draft = drafts[id];
          return (
            <li
              key={id}
              className="rounded-md border border-[--border] bg-[--bg-panel] px-3 py-2"
            >
              <div className="flex items-center gap-3">
                <span className="rounded bg-blue-500/20 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-blue-300">
                  {o.platform}
                </span>
                <span className="flex-1 truncate text-xs text-[--text-secondary]">
                  {o.postTitle || o.postSummary}
                </span>
                <div className="h-1 w-14 flex-shrink-0 rounded-full bg-[--bg-base]">
                  <div
                    className="h-1 rounded-full bg-green-400"
                    style={{ width: `${Math.round((o.painScore ?? o.relevanceScore) * 100)}%` }}
                  />
                </div>
                <button
                  onClick={() => generateDraft(o)}
                  disabled={loadingId === id}
                  className="rounded-md bg-[--primary] px-2.5 py-1 text-[11px] font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
                  {loadingId === id ? "Drafting…" : "Draft reply"}
                </button>
              </div>
              {draft && (
                <div className="mt-2 space-y-2 rounded-md border border-[--border] bg-[--bg-secondary] p-3">
                  <p className="text-[11px] text-[--text-secondary]">{draft.text}</p>
                  <div className="flex justify-end gap-2">
                    {draft.requiresEdit && (
                      <span className="text-[10px] text-amber-300">Edit required before approval</span>
                    )}
                    <button
                      onClick={() => approve(id, draft)}
                      disabled={draft.requiresEdit}
                      className="rounded-md bg-green-500/20 px-2 py-0.5 text-[10px] font-medium text-green-300 hover:bg-green-500/30 disabled:opacity-50"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
