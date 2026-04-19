"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { apiFetch } from "@/lib/api";
import type { GapReport } from "@/components/gapReport/types";
import VerdictBox from "@/components/gapReport/VerdictBox";
import ReportFolds from "@/components/gapReport/ReportFolds";

interface RunMeta {
  runId: string;
  mode?: string;
  niche?: string;
  ideaDescription?: string;
  createdAt?: string;
}

type LoadState =
  | { kind: "loading" }
  | { kind: "unavailable" }
  | { kind: "wrong_mode" }
  | { kind: "pending" }
  | { kind: "ready"; report: GapReport };

export default function GapReportPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = use(params);
  const router = useRouter();
  const { authenticated } = useRequireAuth();
  const [run, setRun] = useState<RunMeta | null>(null);
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    apiFetch(`/api/research/runs/${runId}`)
      .then(async (res) => {
        if (!res.ok || cancelled) return;
        const data: RunMeta = await res.json();
        setRun(data);
        if ((data.mode || "SCAN").toUpperCase() === "SCAN") {
          setState({ kind: "wrong_mode" });
          const msg = encodeURIComponent("Gap report only available for Validate runs");
          setTimeout(() => router.replace(`/research?toast=${msg}`), 1200);
        }
      })
      .catch(() => {});

    apiFetch(`/api/research/runs/${runId}/gap-report`)
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 404) {
          setState({ kind: "unavailable" });
          return;
        }
        if (res.status === 202) {
          setState({ kind: "pending" });
          return;
        }
        if (!res.ok) {
          setState({ kind: "unavailable" });
          return;
        }
        const report: GapReport = await res.json();
        setState({ kind: "ready", report });
      })
      .catch(() => {
        if (!cancelled) setState({ kind: "unavailable" });
      });

    return () => {
      cancelled = true;
    };
  }, [runId, router]);

  if (!authenticated) return null;

  if (state.kind === "wrong_mode") {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-[--text-muted]">
          Gap report only available for Validate runs — redirecting…
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href={`/research/runs/${runId}`}
          className="font-mono text-[10px] uppercase tracking-wider text-[--text-muted] hover:text-white"
        >
          ← Run
        </Link>
        <h1 className="text-2xl font-semibold text-white">Gap report</h1>
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

      {state.kind === "loading" && <Skeleton />}
      {state.kind === "unavailable" && (
        <p className="rounded-md border border-[--border] bg-[--bg-panel] px-4 py-6 text-sm text-[--text-muted]">
          No gap report for this run yet.
        </p>
      )}
      {state.kind === "pending" && (
        <p className="rounded-md border border-amber-500/20 bg-amber-500/5 px-4 py-6 text-sm text-amber-200">
          Scoring novelty — this report is still being generated.
        </p>
      )}
      {state.kind === "ready" && (
        <>
          <VerdictBox report={state.report} />
          <ReportFolds report={state.report} />
        </>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-3">
      <div className="h-24 animate-pulse rounded-lg border border-[--border] bg-[--bg-panel]" />
      <div className="h-16 animate-pulse rounded-lg border border-[--border] bg-[--bg-panel]" />
    </div>
  );
}
