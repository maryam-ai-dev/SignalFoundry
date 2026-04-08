"use client";

import { useEffect, useRef } from "react";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";

interface Props {
  runId: string;
  onPartialReady?: () => void;
  onComplete?: () => void;
}

const TERMINAL = ["COMPLETED", "FAILED"];

async function fetcher(url: string) {
  const res = await apiFetch(url);
  if (!res.ok) throw new Error("Failed to fetch run status");
  return res.json();
}

export default function ResearchRunStatus({
  runId,
  onPartialReady,
  onComplete,
}: Props) {
  const calledPartial = useRef(false);
  const calledComplete = useRef(false);

  const { data, error } = useSWR(
    runId ? `/api/research/runs/${runId}` : null,
    fetcher,
    {
      refreshInterval: (latestData) => {
        if (latestData && TERMINAL.includes(latestData.status)) return 0;
        return 3000;
      },
    }
  );

  const status = data?.status as string | undefined;

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
        Starting...
      </div>
    );
  }

  switch (status) {
    case "PENDING":
    case "RUNNING":
      return (
        <div className="flex items-center gap-2 text-sm text-[--text-secondary]">
          <span className="h-2 w-2 animate-pulse rounded-full bg-blue-400" />
          Scanning...
        </div>
      );
    case "PARTIAL_ANALYSIS_READY":
      return (
        <div className="flex items-center gap-2 text-sm text-amber-400">
          <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
          Insights ready — generating strategy...
        </div>
      );
    case "COMPLETED":
      return (
        <div className="flex items-center gap-2 text-sm text-green-400">
          <span className="h-2 w-2 rounded-full bg-green-400" />
          Complete
        </div>
      );
    case "FAILED":
      return (
        <div className="flex items-center gap-2 text-sm text-red-400">
          <span className="h-2 w-2 rounded-full bg-red-400" />
          Failed{data.errorMessage ? `: ${data.errorMessage}` : ""}
        </div>
      );
    default:
      return null;
  }
}
