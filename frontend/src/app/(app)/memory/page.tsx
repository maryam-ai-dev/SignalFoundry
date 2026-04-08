"use client";

import { useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { apiFetch } from "@/lib/api";

const TABS = ["Swipe File", "Proof Assets", "Idea Bank"] as const;
type Tab = (typeof TABS)[number];

const TYPE_COLORS: Record<string, string> = {
  HOOK: "bg-purple-500/20 text-purple-400",
  ANGLE: "bg-blue-500/20 text-blue-400",
  COMMENT: "bg-pink-500/20 text-pink-400",
  OBJECTION: "bg-amber-500/20 text-amber-400",
  NARRATIVE: "bg-emerald-500/20 text-emerald-400",
  PROOF: "bg-teal-500/20 text-teal-400",
  PHRASE: "bg-cyan-500/20 text-cyan-400",
  TREND: "bg-green-500/20 text-green-400",
  PAIN: "bg-red-500/20 text-red-400",
  BELIEF_GAP: "bg-indigo-500/20 text-indigo-400",
  LANGUAGE: "bg-sky-500/20 text-sky-400",
};

interface SwipeEntry {
  id: string; type: string; content: Record<string, unknown>;
  tags: string[]; archived: boolean;
}
interface ProofAsset {
  id: string; title: string; content: string; type: string; tags: string[];
}
interface IdeaEntry {
  id: string; idea: string; angleType: string; status: string;
}

export default function MemoryPage() {
  const { authenticated } = useRequireAuth();
  const workspaceId = useWorkspaceStore((s) => s.workspaceId);
  const [tab, setTab] = useState<Tab>("Swipe File");
  const [swipeEntries, setSwipeEntries] = useState<SwipeEntry[]>([]);
  const [proofAssets, setProofAssets] = useState<ProofAsset[]>([]);
  const [ideas, setIdeas] = useState<IdeaEntry[]>([]);
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SwipeEntry[] | null>(null);

  // Load swipe file
  useEffect(() => {
    if (!workspaceId || tab !== "Swipe File") return;
    const url = typeFilter
      ? `/api/swipe-file?workspaceId=${workspaceId}&type=${typeFilter}`
      : `/api/swipe-file?workspaceId=${workspaceId}`;
    apiFetch(url).then((r) => r.json()).then((d) => { if (Array.isArray(d)) setSwipeEntries(d); }).catch(() => {});
  }, [workspaceId, tab, typeFilter]);

  // Load proof assets
  useEffect(() => {
    if (!workspaceId || tab !== "Proof Assets") return;
    apiFetch(`/api/proof-assets?workspaceId=${workspaceId}`)
      .then((r) => r.json()).then((d) => { if (Array.isArray(d)) setProofAssets(d); }).catch(() => {});
  }, [workspaceId, tab]);

  // Load ideas
  useEffect(() => {
    if (!workspaceId || tab !== "Idea Bank") return;
    apiFetch(`/api/idea-bank?workspaceId=${workspaceId}`)
      .then((r) => r.json()).then((d) => { if (Array.isArray(d)) setIdeas(d); }).catch(() => {});
  }, [workspaceId, tab]);

  // Debounced semantic search
  useEffect(() => {
    if (!search.trim() || !workspaceId) { setSearchResults(null); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await apiFetch("/internal/retrieval/similar", {
          method: "POST",
          body: JSON.stringify({ query_text: search, workspace_id: workspaceId, limit: 10 }),
        });
        // Note: this returns posts not swipe entries — show as search results
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results?.map((r: any) => ({
            id: r.canonical_id, type: "SEARCH_RESULT",
            content: { text: r.text_snippet, similarity: r.similarity_score },
            tags: [], archived: false,
          })) || []);
        }
      } catch {}
    }, 500);
    return () => clearTimeout(timer);
  }, [search, workspaceId]);

  async function handleArchive(id: string) {
    await apiFetch(`/api/swipe-file/${id}/archive`, { method: "POST" });
    setSwipeEntries((prev) => prev.filter((e) => e.id !== id));
  }

  if (!authenticated) return null;

  const displayEntries = searchResults ?? swipeEntries;

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-[--border] bg-[--bg-panel] p-1 w-fit">
        {TABS.map((t) => (
          <button key={t} onClick={() => { setTab(t); setSearch(""); setSearchResults(null); }}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${tab === t ? "bg-[--bg-secondary] text-white" : "text-[--text-muted] hover:text-[--text-secondary]"}`}
          >{t}</button>
        ))}
      </div>

      {/* Swipe File */}
      {tab === "Swipe File" && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input type="text" placeholder="Semantic search..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 rounded-md border border-[--border] bg-[--bg-secondary] px-3 py-2 text-sm text-white placeholder:text-[--text-muted] focus:outline-none focus:ring-1 focus:ring-[--ring]" />
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-md border border-[--border] bg-[--bg-secondary] px-3 py-2 text-sm text-white focus:outline-none">
              <option value="">All types</option>
              {["HOOK","ANGLE","COMMENT","NARRATIVE","PAIN","OBJECTION","BELIEF_GAP","LANGUAGE","TREND"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          {displayEntries.length === 0 ? (
            <p className="text-sm text-[--text-muted]">{search ? "No semantic matches" : "No saved items yet"}</p>
          ) : (
            displayEntries.map((e) => {
              const badge = TYPE_COLORS[e.type] || "bg-gray-500/20 text-gray-400";
              const text = (e.content?.text as string) || (e.content?.summary as string) || (e.content?.theme as string) || JSON.stringify(e.content).slice(0, 100);
              return (
                <div key={e.id} className="rounded-lg border border-[--border] bg-[--bg-secondary] p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${badge}`}>{e.type.replace("_", " ")}</span>
                      {e.tags?.map((t, i) => (
                        <span key={i} className="rounded-full bg-[--bg-panel] px-2 py-0.5 text-[10px] text-[--text-muted]">{t}</span>
                      ))}
                    </div>
                    {e.type !== "SEARCH_RESULT" && (
                      <div className="flex gap-1">
                        <button onClick={() => navigator.clipboard.writeText(text)}
                          className="rounded px-2 py-1 text-xs text-[--text-muted] hover:text-white">Copy</button>
                        <button onClick={() => handleArchive(e.id)}
                          className="rounded px-2 py-1 text-xs text-[--text-muted] hover:text-red-400">Archive</button>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-[--text-secondary]">{text}</p>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Proof Assets */}
      {tab === "Proof Assets" && (
        <div className="space-y-3">
          {proofAssets.length === 0 ? (
            <p className="text-sm text-[--text-muted]">No proof assets yet</p>
          ) : (
            proofAssets.map((p) => (
              <div key={p.id} className="rounded-lg border border-[--border] bg-[--bg-secondary] p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="rounded px-2 py-0.5 text-[10px] font-semibold uppercase bg-teal-500/20 text-teal-400">{p.type}</span>
                  {p.tags?.map((t, i) => (
                    <span key={i} className="rounded-full bg-[--bg-panel] px-2 py-0.5 text-[10px] text-[--text-muted]">{t}</span>
                  ))}
                </div>
                <h3 className="text-sm font-medium text-white">{p.title}</h3>
                <p className="text-sm text-[--text-secondary]">{p.content?.slice(0, 200)}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Idea Bank */}
      {tab === "Idea Bank" && (
        <div className="space-y-3">
          {ideas.length === 0 ? (
            <p className="text-sm text-[--text-muted]">No ideas yet</p>
          ) : (
            ideas.map((i) => (
              <div key={i.id} className="rounded-lg border border-[--border] bg-[--bg-secondary] p-3 space-y-2">
                <div className="flex items-center gap-2">
                  {i.angleType && (
                    <span className="rounded px-2 py-0.5 text-[10px] font-semibold uppercase bg-blue-500/20 text-blue-400">{i.angleType}</span>
                  )}
                  <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${i.status === "ACTIVE" ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}`}>{i.status}</span>
                </div>
                <p className="text-sm text-[--text-secondary]">{i.idea}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
