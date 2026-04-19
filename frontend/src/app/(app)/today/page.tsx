"use client";

import { useCallback, useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { apiFetch } from "@/lib/api";
import MigrationBanner from "@/components/MigrationBanner";
import InterestStrip from "@/components/InterestStrip";
import SignalOfTheDay, { type Signal } from "@/components/SignalOfTheDay";
import HooksRow, { type QueuedHook } from "@/components/HooksRow";
import OpportunitiesList, { type Opportunity } from "@/components/OpportunitiesList";
import DigestNudge from "@/components/DigestNudge";
import WhatMovedStrip, { type MovedDeltas } from "@/components/WhatMovedStrip";

type Insight = Signal;
interface ResearchRun { runId: string; status: string; niche?: string }

type Section<T> = { data: T | null; loading: boolean; error: string | null };

function initial<T>(): Section<T> {
  return { data: null, loading: true, error: null };
}

export default function TodayPage() {
  const { authenticated } = useRequireAuth();
  const workspaceId = useWorkspaceStore((s) => s.workspaceId);
  const workspace = useWorkspaceStore((s) => s.workspace);
  const [signals, setSignals] = useState<Section<Insight[]>>(initial());
  const [hooks, setHooks] = useState<Section<QueuedHook[]>>(initial());
  const [opportunities, setOpportunities] = useState<Section<Opportunity[]>>(initial());
  const [runs, setRuns] = useState<Section<ResearchRun[]>>(initial());
  const [deltas, setDeltas] = useState<MovedDeltas | null>(null);
  const [autoScanStarted, setAutoScanStarted] = useState(false);
  const [interests, setInterests] = useState<string[]>([]);

  const handleInterestsChange = useCallback((list: string[]) => {
    setInterests(list);
  }, []);

  async function load() {
    if (!workspaceId) return;

    const fetchJson = async <T,>(path: string): Promise<T> => {
      const res = await apiFetch(path);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    };

    await Promise.allSettled([
      fetchJson<Insight[]>(
        `/api/insights?workspaceId=${workspaceId}&limit=1&sort=novelty`
      ).then(
        (data) => setSignals({ data, loading: false, error: null }),
        (e) => setSignals({ data: null, loading: false, error: (e as Error).message })
      ),
      fetchJson<QueuedHook[]>(
        `/api/strategy/hooks?workspaceId=${workspaceId}&status=QUEUED&limit=3`
      ).then(
        (data) => setHooks({ data, loading: false, error: null }),
        (e) => setHooks({ data: null, loading: false, error: (e as Error).message })
      ),
      fetchJson<Opportunity[]>(
        `/api/engagement/opportunities?workspaceId=${workspaceId}&status=OPEN&limit=10`
      ).then(
        (data) => setOpportunities({ data, loading: false, error: null }),
        (e) => setOpportunities({ data: null, loading: false, error: (e as Error).message })
      ),
      fetchJson<ResearchRun[]>(
        `/api/research/runs?workspaceId=${workspaceId}&limit=2`
      ).then(
        (data) => setRuns({ data, loading: false, error: null }),
        (e) => setRuns({ data: null, loading: false, error: (e as Error).message })
      ),
      fetchJson<MovedDeltas>(
        `/api/insights/deltas?workspaceId=${workspaceId}&window=7d`
      ).then(
        (data) => setDeltas(data),
        () => setDeltas(null)
      ),
    ]);
  }

  useEffect(() => {
    // Reset sections to loading skeletons so the previous workspace's data
    // never lingers while the new workspace's data is in flight.
    setSignals(initial());
    setHooks(initial());
    setOpportunities(initial());
    setRuns(initial());
    setDeltas(null);
    setAutoScanStarted(false);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  useEffect(() => {
    if (autoScanStarted) return;
    if (runs.loading || runs.error) return;
    if (runs.data && runs.data.length === 0 && workspaceId) {
      const niche =
        (workspace && typeof workspace.productName === "string" && (workspace.productName as string)) ||
        (workspace && typeof workspace.name === "string" && (workspace.name as string)) ||
        "default";
      setAutoScanStarted(true);
      apiFetch("/api/research/runs", {
        method: "POST",
        body: JSON.stringify({ workspaceId, niche, mode: "SCAN" }),
      }).catch(() => {});
    }
  }, [runs, workspaceId, workspace, autoScanStarted]);

  if (!authenticated) return null;

  const gathering =
    autoScanStarted || (runs.data && runs.data.some((r) => r.status === "PENDING" || r.status === "RUNNING"));

  return (
    <div className="space-y-6">
      <MigrationBanner />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Today</h1>
        {gathering && (
          <span className="flex items-center gap-2 rounded-full border border-[--border] bg-[--bg-secondary] px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-[--text-secondary]">
            <span
              className="inline-flex h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: "#9B5CFF" }}
            />
            Gathering signals…
          </span>
        )}
      </div>

      <InterestStrip workspaceId={workspaceId} onChange={handleInterestsChange} />

      <Section title="Signal of the day" state={signals} onRetry={load}>
        {(data) => (
          <SignalOfTheDay
            signal={data && data.length > 0 ? data[0] : null}
            interests={interests}
          />
        )}
      </Section>

      <Section title="Hooks ready to ship" state={hooks} onRetry={load}>
        {(data) => <HooksRow hooks={data} />}
      </Section>

      <Section title="Comment opportunities" state={opportunities} onRetry={load}>
        {(data) => <OpportunitiesList items={data} />}
      </Section>

      <DigestNudge />

      <WhatMovedStrip deltas={deltas} />
    </div>
  );
}

function Section<T>({
  title,
  state,
  onRetry,
  children,
}: {
  title: string;
  state: Section<T>;
  onRetry: () => void;
  children: (data: T | null) => React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="font-mono text-[10px] uppercase tracking-wide text-[--text-muted]">
        {title}
      </h2>
      {state.loading ? (
        <Skeleton />
      ) : state.error ? (
        <div className="flex items-center justify-between rounded-md border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-300">
          <span>Couldn&apos;t load — {state.error}</span>
          <button
            onClick={onRetry}
            className="rounded bg-red-500/20 px-2 py-0.5 text-[10px] font-medium text-red-200 hover:bg-red-500/30"
          >
            Retry
          </button>
        </div>
      ) : (
        children(state.data)
      )}
    </section>
  );
}

function Skeleton() {
  return (
    <div className="h-12 animate-pulse rounded-md border border-[--border] bg-[--bg-panel]" />
  );
}

type SectionState<T> = Section<T>;
export type { SectionState };
