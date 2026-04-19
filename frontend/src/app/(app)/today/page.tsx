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
import CampaignPill from "@/components/CampaignPill";

type Insight = Signal;
interface ResearchRun { runId: string; status: string; niche?: string }
interface ActiveCampaign { name: string; goalType?: string; targetAudience?: string }

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
  const [campaign, setCampaign] = useState<ActiveCampaign | null>(null);

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
      fetchJson<Array<Record<string, unknown>>>(
        `/api/campaigns?workspaceId=${workspaceId}`
      ).then(
        (list) => {
          const active = Array.isArray(list)
            ? list.find((c) => (c.status as string) === "ACTIVE")
            : null;
          if (active) {
            setCampaign({
              name: (active.name as string) || "Campaign",
              goalType: active.goalType as string,
              targetAudience: active.targetAudience as string,
            });
          } else {
            setCampaign(null);
          }
        },
        () => setCampaign(null)
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
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-white">Today</h1>
          {campaign && <CampaignPill name={campaign.name} goalType={campaign.goalType} />}
        </div>
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

      {campaign && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <PriorityCard
            title="Best opportunities for goal"
            empty="No open opportunities right now."
          >
            <OpportunitiesList
              items={(opportunities.data || []).slice(0, 3)}
            />
          </PriorityCard>
          <PriorityCard
            title="Objections blocking your goal"
            empty="No objection signals yet."
          >
            <ObjectionsSnippet signals={signals.data || []} />
          </PriorityCard>
        </div>
      )}

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

function PriorityCard({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-lg border bg-[--bg-panel] p-4"
      style={{
        border: "1px solid transparent",
        backgroundImage:
          "linear-gradient(var(--bg-panel), var(--bg-panel)), var(--rainbow)",
        backgroundOrigin: "border-box",
        backgroundClip: "padding-box, border-box",
      }}
    >
      <h3 className="mb-2 font-mono text-[10px] uppercase tracking-wider text-[--text-muted]">
        {title}
      </h3>
      {children || <p className="text-xs text-[--text-muted]">{empty}</p>}
    </section>
  );
}

function ObjectionsSnippet({ signals }: { signals: Signal[] }) {
  const objections = signals
    .filter((s) => s.type === "OBJECTION" || s.type === "BELIEF_GAP")
    .slice(0, 3);
  if (objections.length === 0) {
    return <p className="text-xs text-[--text-muted]">No objection signals yet.</p>;
  }
  return (
    <ul className="space-y-2">
      {objections.map((o, i) => (
        <li key={i} className="text-xs text-[--text-secondary]">
          {(o.payload?.summary as string) ||
            (Array.isArray(o.payload?.representative_quotes)
              ? (o.payload.representative_quotes as string[])[0]?.slice(0, 120)
              : JSON.stringify(o.payload).slice(0, 120))}
        </li>
      ))}
    </ul>
  );
}

type SectionState<T> = Section<T>;
export type { SectionState };
