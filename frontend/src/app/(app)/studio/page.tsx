"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { apiFetch } from "@/lib/api";

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

  const [context, setContext] = useState<ContextData>({
    signalId: signalParam,
    summary: null,
    niche: null,
    scanDate: null,
    matchedInterests: [],
    topic: null,
  });
  const [topicDraft, setTopicDraft] = useState("");

  const isInvestor = accountMode === "INVESTOR";

  const loadContext = useCallback(async () => {
    if (!workspaceId) return;
    try {
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
  }, [workspaceId, signalParam]);

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
        <HookCardsPlaceholder hasContext={hasContext} />
      </section>

      {/* Voice pane — FOUNDER only */}
      {!isInvestor && (
        <aside className="w-full border-t border-[--border] bg-[--bg-panel] p-5 sm:w-48 sm:border-l sm:border-t-0 sm:flex-shrink-0">
          <VoicePanelPlaceholder />
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

function HookCardsPlaceholder({ hasContext }: { hasContext: boolean }) {
  if (!hasContext) {
    return (
      <p className="text-xs text-[--text-muted]">
        Pick a context to start generating hooks.
      </p>
    );
  }
  return (
    <p className="text-xs text-[--text-muted]">
      Hook cards arrive in the next sprint.
    </p>
  );
}

function VoicePanelPlaceholder() {
  return (
    <div className="space-y-3">
      <h2 className="font-mono text-[10px] uppercase tracking-wide text-[--text-muted]">
        Voice
      </h2>
      <p className="text-xs text-[--text-muted]">Voice panel arrives in the next sprint.</p>
    </div>
  );
}
