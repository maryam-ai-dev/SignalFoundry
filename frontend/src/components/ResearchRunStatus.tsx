"use client";

import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";

interface Props {
  runId: string;
  mode?: "SCAN" | "VALIDATE";
  onPartialReady?: () => void;
  onComplete?: () => void;
}

interface PhaseStatus {
  status?: "pending" | "running" | "done" | "error" | string;
  detail?: string;
  updatedAt?: string;
}

interface RunData {
  runId: string;
  status: string;
  mode?: string;
  errorMessage?: string | null;
  phaseStatuses?: Record<string, PhaseStatus>;
}

const TERMINAL = ["COMPLETED", "FAILED"];

const PHASE_DEFS: { id: string; label: string; aliases: string[]; validateOnly?: boolean }[] = [
  { id: "gathering_signals", label: "Gathering signals", aliases: ["scan", "scanning", "gather"] },
  { id: "extracting_patterns", label: "Extracting patterns", aliases: ["embedding", "embed", "analysis", "analyse", "analyzing"] },
  { id: "scoring_novelty", label: "Scoring novelty", aliases: ["gap_detection", "gap", "novelty"], validateOnly: true },
  { id: "generating_hooks", label: "Generating hooks", aliases: ["generation", "generate"] },
  { id: "finalising_report", label: "Finalising report", aliases: ["finalize", "finalise", "persist", "wrapup"] },
];

function resolvePhase(
  def: typeof PHASE_DEFS[number],
  phases: Record<string, PhaseStatus>
): PhaseStatus | undefined {
  const keys = [def.id, ...def.aliases];
  for (const k of keys) {
    if (phases[k]) return phases[k];
  }
  return undefined;
}

function statusColor(status?: string): string {
  switch (status) {
    case "done":
      return "#7CFF6B";
    case "running":
      return "#9B5CFF";
    case "error":
      return "#FF4444";
    default:
      return "rgba(255,255,255,0.3)";
  }
}

async function fetcher(url: string): Promise<RunData> {
  const res = await apiFetch(url);
  if (!res.ok) throw new Error("Failed to fetch run status");
  return res.json();
}

export default function ResearchRunStatus({
  runId,
  mode,
  onPartialReady,
  onComplete,
}: Props) {
  const calledPartial = useRef(false);
  const calledComplete = useRef(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [retrying, setRetrying] = useState<string | null>(null);

  const { data, error, mutate } = useSWR<RunData>(
    runId ? `/api/research/runs/${runId}` : null,
    fetcher,
    {
      refreshInterval: (latestData) => {
        if (latestData && TERMINAL.includes(latestData.status)) return 0;
        return 3000;
      },
    }
  );

  const status = data?.status;
  const runMode = (data?.mode || mode || "SCAN").toUpperCase();

  useEffect(() => {
    if (
      status === "PARTIAL_ANALYSIS_READY" &&
      !calledPartial.current &&
      onPartialReady
    ) {
      calledPartial.current = true;
      onPartialReady();
    }
    if (status === "COMPLETED" && !calledComplete.current && onComplete) {
      calledComplete.current = true;
      onComplete();
    }
  }, [status, onPartialReady, onComplete]);

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-400">
        <span className="h-2 w-2 rounded-full bg-red-400" />
        Error loading status
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center gap-2 text-sm text-[--text-muted]">
        <span className="h-2 w-2 animate-pulse rounded-full bg-[--text-muted]" />
        Starting…
      </div>
    );
  }

  const phases = data.phaseStatuses || {};
  const visibleDefs = PHASE_DEFS.filter((d) => !d.validateOnly || runMode === "VALIDATE");

  async function retryPhase(phaseId: string) {
    setRetrying(phaseId);
    try {
      await apiFetch(`/api/research/runs/${runId}/retry-phase`, {
        method: "POST",
        body: JSON.stringify({ phase: phaseId }),
      });
      await mutate();
    } catch {
      // best effort
    } finally {
      setRetrying(null);
    }
  }

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-2">
      <ol className="space-y-1">
        {visibleDefs.map((def) => {
          const phase = resolvePhase(def, phases);
          const st = phase?.status || "pending";
          const isExpanded = expanded.has(def.id);
          return (
            <li
              key={def.id}
              className="rounded-md border border-[--border] bg-[--bg-secondary]"
            >
              <div className="flex items-center gap-2 px-2.5 py-1.5">
                <span
                  className="inline-flex h-1.5 w-1.5 rounded-full"
                  style={{
                    backgroundColor: statusColor(st),
                    animation: st === "running" ? "sf-pulse-dot 1.4s ease-in-out infinite" : undefined,
                  }}
                />
                <button
                  onClick={() => toggle(def.id)}
                  className="flex-1 text-left font-mono text-[11px] uppercase tracking-wider text-[--text-secondary] hover:text-white"
                >
                  {def.label}
                </button>
                {st === "error" && (
                  <button
                    onClick={() => retryPhase(def.id)}
                    disabled={retrying === def.id}
                    className="rounded bg-red-500/20 px-1.5 py-0.5 font-mono text-[9px] uppercase text-red-300 hover:bg-red-500/30 disabled:opacity-50"
                  >
                    {retrying === def.id ? "Retrying…" : "Retry"}
                  </button>
                )}
              </div>
              {isExpanded && phase?.detail && (
                <p className="border-t border-[--border] bg-[--bg-panel] px-3 py-1.5 text-[11px] text-[--text-muted]">
                  {phase.detail}
                </p>
              )}
            </li>
          );
        })}
      </ol>

      {data.errorMessage && status === "FAILED" && (
        <p className="rounded-md bg-red-500/10 px-2 py-1 text-[11px] text-red-300">
          {data.errorMessage}
        </p>
      )}

      <style>{`@keyframes sf-pulse-dot { 0%, 100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.3); } }`}</style>
    </div>
  );
}
