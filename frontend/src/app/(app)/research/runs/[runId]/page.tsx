"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { apiFetch } from "@/lib/api";
import ResearchRunStatus from "@/components/ResearchRunStatus";
import InsightCard from "@/components/InsightCard";

interface Insight {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  confidence: number;
}

interface RunData {
  runId: string;
  status: string;
  mode?: string;
  niche?: string;
  queryText?: string;
  ideaDescription?: string;
  createdAt?: string;
  errorMessage?: string | null;
}

const INSIGHT_ORDER = ["TREND", "NARRATIVE", "PAIN", "OBJECTION", "BELIEF_GAP", "LANGUAGE"];

export default function RunDetailPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = use(params);
  const { authenticated } = useRequireAuth();
  const [run, setRun] = useState<RunData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [insights, setInsights] = useState<Insight[]>([]);

  const loadRun = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/research/runs/${runId}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!res.ok) return;
      setRun(await res.json());
    } catch {}
  }, [runId]);

  const loadInsights = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/insights?runId=${runId}`);
      if (res.ok) setInsights(await res.json());
    } catch {}
  }, [runId]);

  useEffect(() => {
    void loadRun();
    void loadInsights();
  }, [loadRun, loadInsights]);

  if (!authenticated) return null;

  if (notFound) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-xl font-semibold text-white">Run not found</h1>
        <Link href="/research" className="text-sm text-[--primary] hover:underline">
          Return to Research →
        </Link>
      </div>
    );
  }

  const grouped = INSIGHT_ORDER.map((type) => ({
    type,
    items: insights.filter((i) => i.type === type),
  })).filter((g) => g.items.length > 0);

  const mode = (run?.mode as "SCAN" | "VALIDATE") || "SCAN";

  return (
    <div className="space-y-5" id={`run-${runId}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Link
            href="/research"
            className="font-mono text-[10px] uppercase tracking-wider text-[--text-muted] hover:text-white"
          >
            ← Research
          </Link>
          <h1 className="text-xl font-semibold text-white">
            {run?.niche || run?.queryText || runId.slice(0, 8)}
          </h1>
          {run?.ideaDescription && (
            <p className="max-w-2xl text-sm italic text-[--text-muted]">
              {run.ideaDescription}
            </p>
          )}
          {run?.createdAt && (
            <p className="font-mono text-[10px] text-[--text-muted]">
              {run.createdAt}
            </p>
          )}
        </div>
        <span className="rounded-full border border-[--border] bg-[--bg-secondary] px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-[--text-secondary]">
          {mode}
        </span>
      </div>

      <section className="rounded-lg border border-[--border] bg-[--bg-panel] p-4">
        <h2 className="mb-3 font-mono text-[10px] uppercase tracking-wide text-[--text-muted]">
          Phases
        </h2>
        <ResearchRunStatus runId={runId} mode={mode} />
      </section>

      {mode === "VALIDATE" && (
        <Link
          href={`/research/runs/${runId}/gap-report`}
          className="inline-block rounded-md bg-[--primary] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
        >
          Open gap report →
        </Link>
      )}

      <section className="rounded-lg border border-[--border] bg-[--bg-panel] p-4">
        <h2 className="mb-3 font-mono text-[10px] uppercase tracking-wide text-[--text-muted]">
          Insights
        </h2>
        {grouped.length === 0 ? (
          <p className="text-xs text-[--text-muted]">Insights will appear as the run completes.</p>
        ) : (
          <div className="space-y-6">
            {grouped.map((group) => (
              <div key={group.type}>
                <h3 className="mb-2 font-mono text-[10px] uppercase tracking-wide text-[--text-muted]">
                  {group.type.replace("_", " ")}
                </h3>
                <div className="space-y-3">
                  {group.items.map((insight) => (
                    <InsightCard
                      key={insight.id}
                      type={insight.type}
                      title={(insight.payload.topic_label as string) || (insight.payload.theme as string) || insight.type}
                      summary={(insight.payload.summary as string) || (insight.payload.gap_summary as string) || ""}
                      confidence={insight.confidence}
                      sourceCount={(insight.payload.post_count as number) || 0}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
