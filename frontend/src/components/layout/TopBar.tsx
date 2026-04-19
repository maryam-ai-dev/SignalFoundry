"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { apiFetch } from "@/lib/api";

interface ResearchRun {
  runId: string;
  status: string;
  phaseStatuses?: Record<string, { status: string }>;
}

type PillState = { run: ResearchRun; fading: boolean } | null;

const ACTIVE_STATUSES = new Set(["PENDING", "RUNNING", "PARTIAL_ANALYSIS_READY"]);

function countPhases(run: ResearchRun) {
  const statuses = run.phaseStatuses ?? {};
  const keys = Object.keys(statuses);
  if (keys.length === 0) return { done: 0, total: 5 };
  const done = keys.filter((k) => statuses[k]?.status === "done").length;
  return { done, total: Math.max(5, keys.length) };
}

export default function TopBar() {
  const router = useRouter();
  const workspaceId = useWorkspaceStore((s) => s.workspaceId);
  const workspace = useWorkspaceStore((s) => s.workspace);
  const [pill, setPill] = useState<PillState>(null);
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!workspaceId) return;
    let cancelled = false;

    async function poll() {
      try {
        const res = await apiFetch(`/api/research/runs?workspaceId=${workspaceId}&limit=2`);
        if (!res.ok) return;
        const runs: ResearchRun[] = await res.json();
        if (cancelled || !Array.isArray(runs)) return;

        const active = runs.find((r) => ACTIVE_STATUSES.has(r.status));
        if (active) {
          if (fadeTimer.current) {
            clearTimeout(fadeTimer.current);
            fadeTimer.current = null;
          }
          setPill({ run: active, fading: false });
          return;
        }

        setPill((current) => {
          if (!current || current.fading) return current;
          if (fadeTimer.current) clearTimeout(fadeTimer.current);
          fadeTimer.current = setTimeout(() => setPill(null), 3000);
          return { ...current, fading: true };
        });
      } catch {
        // Network error — leave pill as-is.
      }
    }

    poll();
    const interval = setInterval(poll, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
      if (fadeTimer.current) clearTimeout(fadeTimer.current);
    };
  }, [workspaceId]);

  const workspaceName =
    (workspace && typeof workspace.name === "string" ? workspace.name : null) ||
    "My Workspace";

  return (
    <header className="fixed top-0 left-56 right-0 z-20 flex h-14 items-center justify-between border-b border-[--border] bg-[--bg-panel] px-6">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-white">{workspaceName}</span>

        {pill && (
          <button
            onClick={() => {
              router.push(`/research#run-${pill.run.runId}`);
            }}
            className="flex items-center gap-2 rounded-full border border-[--border] bg-[--bg-secondary] px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-white transition-opacity"
            style={{ opacity: pill.fading ? 0.5 : 1 }}
          >
            <span
              className="relative inline-flex h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: "#9B5CFF" }}
            >
              <span
                className="absolute inset-0 rounded-full"
                style={{
                  backgroundColor: "#9B5CFF",
                  animation: pill.fading ? undefined : "sf-pulse 1.4s ease-out infinite",
                }}
              />
            </span>
            {(() => {
              const { done, total } = countPhases(pill.run);
              return `Research · ${done}/${total}`;
            })()}
          </button>
        )}
      </div>

      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[--bg-secondary] text-xs font-medium text-[--text-secondary]">
        M
      </div>

      <style>{`@keyframes sf-pulse { 0% { transform: scale(1); opacity: 0.6; } 70% { transform: scale(2.2); opacity: 0; } 100% { transform: scale(2.2); opacity: 0; } }`}</style>
    </header>
  );
}
