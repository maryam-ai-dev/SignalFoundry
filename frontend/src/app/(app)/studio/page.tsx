"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { apiFetch } from "@/lib/api";
import HookSlotCard, {
  newBlankCard,
  type HookCardData,
  type SlotName,
} from "@/components/HookSlotCard";
import VoicePanel, {
  DEFAULT_SLIDERS,
  type VoiceSliders,
} from "@/components/VoicePanel";
import {
  addArchivedHook,
  addShippedHook,
  readArchivedHooks,
} from "@/lib/hookSession";

interface ContextData {
  signalId: string | null;
  summary: string | null;
  niche: string | null;
  scanDate: string | null;
  matchedInterests: string[];
  topic: string | null;
}

export default function StudioPage() {
  return (
    <Suspense fallback={<StudioSkeleton />}>
      <StudioBody />
    </Suspense>
  );
}

function StudioBody() {
  const { authenticated } = useRequireAuth();
  const workspaceId = useWorkspaceStore((s) => s.workspaceId);
  const accountMode = useWorkspaceStore((s) => s.accountMode);
  const searchParams = useSearchParams();
  const router = useRouter();
  const signalParam = searchParams.get("signal");
  const hookParam = searchParams.get("hook");

  const [context, setContext] = useState<ContextData>({
    signalId: signalParam,
    summary: null,
    niche: null,
    scanDate: null,
    matchedInterests: [],
    topic: null,
  });
  const [topicDraft, setTopicDraft] = useState("");
  const [sliders, setSliders] = useState<VoiceSliders>(DEFAULT_SLIDERS);

  const isInvestor = accountMode === "INVESTOR";

  const loadContext = useCallback(async () => {
    if (!workspaceId) return;
    try {
      if (hookParam) {
        const res = await apiFetch(`/api/swipe-file/${hookParam}`);
        if (res.ok) {
          const entry = await res.json();
          const content = (entry?.content as Record<string, unknown>) || {};
          const text =
            (content.text as string) ||
            (entry?.type as string) ||
            "Hook from vault";
          setContext((c) => ({
            ...c,
            signalId: null,
            summary: text,
            topic: text,
            matchedInterests: [],
          }));
          return;
        }
      }
      let insight: Record<string, unknown> | null = null;
      if (signalParam) {
        const res = await apiFetch(`/api/insights/${signalParam}`);
        if (res.ok) insight = await res.json();
      }
      if (!insight) {
        const runsRes = await apiFetch(
          `/api/research/runs?workspaceId=${workspaceId}&limit=1`
        );
        if (runsRes.ok) {
          const runs: Array<{ runId: string; niche?: string; createdAt?: string }> =
            await runsRes.json();
          if (Array.isArray(runs) && runs.length > 0) {
            const run = runs[0];
            const insRes = await apiFetch(`/api/insights?runId=${run.runId}&limit=1&sort=novelty`);
            if (insRes.ok) {
              const list = await insRes.json();
              if (Array.isArray(list) && list.length > 0) insight = list[0];
            }
            setContext((c) => ({
              ...c,
              niche: run.niche ?? c.niche,
              scanDate: run.createdAt ?? c.scanDate,
            }));
          }
        }
      }

      if (insight) {
        const payload = (insight.payload as Record<string, unknown>) || {};
        const matched = Array.isArray(payload.matched_interests)
          ? (payload.matched_interests as string[]).map(String)
          : [];
        setContext((c) => ({
          ...c,
          signalId:
            (insight?.id as string) ||
            (insight?.insightId as string) ||
            c.signalId,
          summary:
            (payload.summary as string) ||
            (payload.text as string) ||
            (insight?.type as string) ||
            null,
          matchedInterests: matched,
          scanDate:
            (insight?.createdAt as string) ||
            (payload.timestamp as string) ||
            c.scanDate,
        }));
      }
    } catch {
      // best effort
    }
  }, [workspaceId, signalParam, hookParam]);

  useEffect(() => {
    loadContext();
  }, [loadContext]);

  function newSession() {
    setContext({
      signalId: null,
      summary: null,
      niche: context.niche,
      scanDate: null,
      matchedInterests: [],
      topic: null,
    });
    router.replace("/studio");
  }

  function confirmTopic() {
    const t = topicDraft.trim();
    if (!t) return;
    setContext((c) => ({ ...c, topic: t, summary: t }));
    setTopicDraft("");
  }

  const hasContext = useMemo(
    () => Boolean(context.signalId || context.summary || context.topic),
    [context]
  );

  if (!authenticated) return null;

  return (
    <div className="-m-6 flex h-[calc(100vh-3.5rem)] flex-col sm:flex-row">
      {/* Context pane */}
      <aside
        className={`border-b border-[--border] bg-[--bg-panel] p-5 sm:border-b-0 sm:border-r ${
          isInvestor ? "sm:w-72" : "sm:w-60"
        } sm:flex-shrink-0`}
      >
        <div className="flex items-center justify-between pb-3">
          <h2 className="font-mono text-[10px] uppercase tracking-wide text-[--text-muted]">
            Context
          </h2>
          <button
            onClick={newSession}
            className="text-[11px] text-[--text-muted] hover:text-white"
          >
            New session
          </button>
        </div>

        {hasContext ? (
          <div className="space-y-3">
            {context.summary && (
              <p className="text-[13px] leading-relaxed text-white">
                {context.summary}
              </p>
            )}
            <dl className="space-y-1 text-[11px]">
              {context.niche && (
                <div className="flex justify-between">
                  <dt className="text-[--text-muted]">Niche</dt>
                  <dd className="text-[--text-secondary]">{context.niche}</dd>
                </div>
              )}
              {context.scanDate && (
                <div className="flex justify-between">
                  <dt className="text-[--text-muted]">Scanned</dt>
                  <dd className="font-mono text-[--text-secondary]">
                    {context.scanDate.slice(0, 10)}
                  </dd>
                </div>
              )}
            </dl>
            {context.matchedInterests.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {context.matchedInterests.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-medium text-purple-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-[11px] text-[--text-muted]">Enter a topic</label>
            <input
              autoFocus
              value={topicDraft}
              onChange={(e) => setTopicDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmTopic();
              }}
              placeholder="e.g. onboarding friction for freelancers"
              className="w-full rounded-md border border-[--border] bg-[--bg-secondary] px-3 py-2 text-sm text-white placeholder:text-[--text-muted] focus:outline-none focus:ring-1 focus:ring-[--ring]"
            />
            <button
              onClick={confirmTopic}
              disabled={!topicDraft.trim()}
              className="w-full rounded-md bg-[--primary] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              Start session
            </button>
          </div>
        )}
      </aside>

      {/* Hooks pane */}
      <section className="flex-1 overflow-y-auto p-6">
        <h2 className="mb-4 font-mono text-[10px] uppercase tracking-wide text-[--text-muted]">
          Hooks
        </h2>
        {hasContext ? (
          <HookSessionBody
            workspaceId={workspaceId}
            topic={context.topic || context.summary}
            signalId={context.signalId}
            sliders={sliders}
          />
        ) : (
          <p className="text-xs text-[--text-muted]">
            Pick a context or enter a topic to start generating hooks.
          </p>
        )}
      </section>

      {/* Voice pane — FOUNDER only */}
      {!isInvestor && (
        <aside className="w-full border-t border-[--border] bg-[--bg-panel] p-5 sm:w-48 sm:border-l sm:border-t-0 sm:flex-shrink-0">
          <VoicePanel
            workspaceId={workspaceId}
            sliders={sliders}
            onSlidersChange={setSliders}
          />
        </aside>
      )}
    </div>
  );
}

function StudioSkeleton() {
  return (
    <div className="-m-6 flex h-[calc(100vh-3.5rem)] animate-pulse flex-col sm:flex-row">
      <div className="h-32 border-b border-[--border] bg-[--bg-panel] sm:h-auto sm:w-60 sm:border-b-0 sm:border-r" />
      <div className="flex-1 bg-[--bg-base]" />
      <div className="hidden sm:block sm:w-48 sm:border-l sm:border-[--border] sm:bg-[--bg-panel]" />
    </div>
  );
}

interface HookGenResponse {
  hookId?: string;
  id?: string;
  angle?: string;
  opener?: string;
  proof?: string;
  voiceMatch?: number;
  voiceRef?: string;
  draft?: boolean;
  text?: string;
}

function responseToCard(r: HookGenResponse, fallbackId: string): HookCardData {
  const id = r.hookId || r.id || fallbackId;
  const slots: Record<SlotName, string> = {
    angle: r.angle || "",
    opener: r.opener || "",
    proof: r.proof || "",
  };
  if (!slots.opener && r.text) {
    slots.opener = r.text;
  }
  return {
    id,
    slots,
    voiceMatch: typeof r.voiceMatch === "number" ? r.voiceMatch : null,
    voiceRef: r.voiceRef || null,
    draft: r.draft ?? false,
  };
}

function HookSessionBody({
  workspaceId,
  topic,
  signalId,
  sliders,
}: {
  workspaceId: string | null;
  topic: string | null;
  signalId: string | null;
  sliders: VoiceSliders;
}) {
  const [cards, setCards] = useState<HookCardData[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const archivedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const initialRequested = useRef(false);

  useEffect(() => {
    archivedRef.current = new Set(readArchivedHooks(topic));
  }, [topic]);

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (dirtyIds.size === 0) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirtyIds]);

  useEffect(() => {
    if (initialRequested.current) return;
    if (!workspaceId || (!topic && !signalId)) return;
    initialRequested.current = true;
    void loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, topic, signalId]);

  function filterArchived(list: HookCardData[]): HookCardData[] {
    return list.filter((c) => !archivedRef.current.has(c.id));
  }

  function handleDirtyChange(id: string, dirty: boolean) {
    setDirtyIds((prev) => {
      const next = new Set(prev);
      if (dirty) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function handleSaved() {
    // save handled by card; nothing extra beyond clearing dirty.
  }

  function handleShipped(card: HookCardData) {
    addShippedHook(topic, card.id);
  }

  function handleArchived(card: HookCardData) {
    archivedRef.current.add(card.id);
    addArchivedHook(topic, card.id);
  }

  async function loadInitial() {
    setLoading(true);
    try {
      const res = await apiFetch("/api/strategy/hooks", {
        method: "POST",
        body: JSON.stringify({ workspaceId, topic, signalId, count: 3, sliders }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const next = filterArchived(
            data
              .slice(0, 3)
              .map((r: HookGenResponse, i: number) => responseToCard(r, `hook-${Date.now()}-${i}`))
          );
          setCards(next.length > 0 ? next : [newBlankCard(`hook-${Date.now()}-0`), newBlankCard(`hook-${Date.now()}-1`), newBlankCard(`hook-${Date.now()}-2`)]);
          return;
        }
      }
    } catch {}
    // Fallback: show blank cards for manual work.
    setCards([
      newBlankCard(`hook-${Date.now()}-0`),
      newBlankCard(`hook-${Date.now()}-1`),
      newBlankCard(`hook-${Date.now()}-2`),
    ]);
    setLoading(false);
  }

  async function regenerateCard(
    locked: Record<SlotName, boolean>,
    card: HookCardData
  ): Promise<HookCardData | null> {
    try {
      const res = await apiFetch(`/api/strategy/hooks/${card.id}/regenerate`, {
        method: "POST",
        body: JSON.stringify({
          workspaceId,
          topic,
          signalId,
          locked,
          existing: card.slots,
          sliders,
        }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const response: HookGenResponse = Array.isArray(data) ? data[0] : data;
      if (!response) return null;
      return responseToCard(response, card.id);
    } catch {
      return null;
    }
  }

  async function loadMore() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await apiFetch("/api/strategy/hooks", {
        method: "POST",
        body: JSON.stringify({ workspaceId, topic, signalId, count: 3, sliders }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const next = filterArchived(
            data
              .slice(0, 3)
              .map((r: HookGenResponse, i: number) => responseToCard(r, `hook-${Date.now()}-m${i}`))
          );
          setCards((prev) => [...prev, ...next]);
          return;
        }
      }
      setCards((prev) => [
        ...prev,
        newBlankCard(`hook-${Date.now()}-m0`),
        newBlankCard(`hook-${Date.now()}-m1`),
        newBlankCard(`hook-${Date.now()}-m2`),
      ]);
    } finally {
      setLoading(false);
    }
  }

  function updateCard(next: HookCardData) {
    setCards((prev) => prev.map((c) => (c.id === next.id ? next : c)));
  }

  function removeCard(id: string) {
    setCards((prev) => prev.filter((c) => c.id !== id));
  }

  if (!workspaceId || (!topic && !signalId)) {
    return (
      <p className="text-xs text-[--text-muted]">
        Pick a context or enter a topic to start generating hooks.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {toast && (
        <p className="rounded-md bg-amber-500/10 px-3 py-1.5 text-[11px] text-amber-200">
          {toast}
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <HookSlotCard
            key={card.id}
            card={card}
            onChange={updateCard}
            onRemove={removeCard}
            regenerate={regenerateCard}
            onToast={setToast}
            onDirtyChange={handleDirtyChange}
            onSaved={handleSaved}
            onShipped={handleShipped}
            onArchived={handleArchived}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={loadMore}
        disabled={loading}
        className="rounded-md border border-[--border] bg-[--bg-secondary] px-3 py-1.5 text-[11px] text-[--text-secondary] hover:text-white disabled:opacity-50"
      >
        {loading ? "Loading…" : "+3 more"}
      </button>
    </div>
  );
}

