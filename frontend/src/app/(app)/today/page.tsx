"use client";

import { useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { apiFetch } from "@/lib/api";

interface Insight { type: string; payload: Record<string, unknown>; confidence: number }
interface HookItem { hookId?: string; id?: string; text: string; voiceMatch?: number; status?: string }
interface Opportunity { id?: string; platform: string; postSummary: string; relevanceScore: number }
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
  const [hooks, setHooks] = useState<Section<HookItem[]>>(initial());
  const [opportunities, setOpportunities] = useState<Section<Opportunity[]>>(initial());
  const [runs, setRuns] = useState<Section<ResearchRun[]>>(initial());
  const [autoScanStarted, setAutoScanStarted] = useState(false);

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
      fetchJson<HookItem[]>(
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
    ]);
  }

  useEffect(() => {
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
      }).catch(() => {
        // Silent failure — pill is best-effort.
      });
    }
  }, [runs, workspaceId, workspace, autoScanStarted]);

  if (!authenticated) return null;

  const gathering =
    autoScanStarted || (runs.data && runs.data.some((r) => r.status === "PENDING" || r.status === "RUNNING"));

  return (
    <div className="space-y-6">
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

      <Section title="Signal of the day" state={signals} onRetry={load}>
        {(data) =>
          data && data.length > 0 ? (
            <p className="text-sm text-[--text-secondary]">
              {(data[0].payload?.summary as string) || JSON.stringify(data[0].payload).slice(0, 140)}
            </p>
          ) : (
            <p className="text-xs text-[--text-muted]">Signals arriving…</p>
          )
        }
      </Section>

      <Section title="Hooks ready to ship" state={hooks} onRetry={load}>
        {(data) =>
          data && data.length > 0 ? (
            <ul className="grid grid-cols-3 gap-3">
              {data.map((h, i) => (
                <li
                  key={h.hookId || h.id || i}
                  className="rounded-lg border border-[--border] bg-[--bg-secondary] p-3 text-xs text-[--text-secondary]"
                >
                  {h.text}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-[--text-muted]">No hooks queued.</p>
          )
        }
      </Section>

      <Section title="Comment opportunities" state={opportunities} onRetry={load}>
        {(data) =>
          data && data.length > 0 ? (
            <ul className="space-y-2">
              {data.slice(0, 5).map((o, i) => (
                <li
                  key={o.id || i}
                  className="flex items-center gap-3 rounded-md border border-[--border] bg-[--bg-panel] px-3 py-2"
                >
                  <span className="rounded bg-blue-500/20 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-blue-400">
                    {o.platform}
                  </span>
                  <span className="flex-1 truncate text-xs text-[--text-secondary]">
                    {o.postSummary}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-[--text-muted]">No open opportunities.</p>
          )
        }
      </Section>

      <Section title="Recent runs" state={runs} onRetry={load}>
        {(data) =>
          data && data.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {data.map((r) => (
                <li
                  key={r.runId}
                  className="rounded-md border border-[--border] bg-[--bg-panel] px-3 py-1 font-mono text-[10px] text-[--text-secondary]"
                >
                  {r.niche || r.runId.slice(0, 8)} · {r.status}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-[--text-muted]">No runs yet.</p>
          )
        }
      </Section>
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
