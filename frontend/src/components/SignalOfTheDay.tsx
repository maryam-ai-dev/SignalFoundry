"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

export interface SignalPayload {
  summary?: string;
  text?: string;
  novelty?: number;
  source?: string | string[];
  niche?: string;
  timestamp?: string;
  matched_interests?: string[];
  [key: string]: unknown;
}

export interface Signal {
  id?: string;
  insightId?: string;
  type: string;
  payload: SignalPayload;
  confidence: number;
  createdAt?: string;
}

function noveltyColor(score: number): string {
  if (score >= 0.7) return "#7CFF6B";
  if (score >= 0.5) return "#FFAA40";
  return "#FF4444";
}

function pickSources(payload: SignalPayload): string[] {
  if (Array.isArray(payload.source)) return payload.source;
  if (typeof payload.source === "string") return [payload.source];
  return [];
}

export default function SignalOfTheDay({
  signal,
  interests,
}: {
  signal: Signal | null;
  interests: string[];
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [archived, setArchived] = useState(false);
  const [saved, setSaved] = useState(false);

  const signalId = signal?.id || signal?.insightId;

  const matched = useMemo(() => {
    if (!signal) return [] as string[];
    if (Array.isArray(signal.payload.matched_interests)) {
      return signal.payload.matched_interests.map(String);
    }
    const text = `${signal.payload.summary ?? ""} ${signal.payload.text ?? ""}`.toLowerCase();
    return interests.filter((tag) => tag && text.includes(tag.toLowerCase()));
  }, [signal, interests]);

  if (!signal) {
    return (
      <div className="rounded-lg border border-[--border] bg-[--bg-panel] p-6 text-sm text-[--text-muted]">
        Signals arriving — your first scan is in progress.
      </div>
    );
  }

  if (archived) {
    return (
      <div className="rounded-lg border border-[--border] bg-[--bg-panel] p-4 text-xs text-[--text-muted]">
        Archived.
      </div>
    );
  }

  const summary = signal.payload.summary || signal.payload.text || "Signal";
  const sources = pickSources(signal.payload);
  const novelty = Math.max(0, Math.min(1, signal.payload.novelty ?? signal.confidence ?? 0));
  const timestamp = signal.payload.timestamp || signal.createdAt;
  const niche = signal.payload.niche;

  async function handleSave() {
    if (!signal) return;
    try {
      await apiFetch("/api/swipe-file", {
        method: "POST",
        body: JSON.stringify({
          type: "SIGNAL",
          content: { text: summary, signalId },
        }),
      });
      setSaved(true);
    } catch {
      // best-effort
    }
  }

  function handleTurnIntoHook() {
    const id = signalId || "";
    router.push(`/studio?signal=${encodeURIComponent(id)}`);
  }

  return (
    <div className="space-y-3 rounded-lg border border-[--border] bg-[--bg-panel] p-5">
      <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-wide">
        {sources.map((s) => (
          <span
            key={s}
            className="rounded bg-blue-500/20 px-1.5 py-0.5 font-semibold text-blue-300"
          >
            {s}
          </span>
        ))}
        {niche && (
          <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-purple-300">{niche}</span>
        )}
        {timestamp && (
          <span className="text-[--text-muted] normal-case">{timestamp}</span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <div className="h-1 w-16 rounded-full bg-[--bg-base]">
            <div
              className="h-1 rounded-full"
              style={{ width: `${Math.round(novelty * 100)}%`, backgroundColor: noveltyColor(novelty) }}
            />
          </div>
          <span className="font-mono text-[10px]" style={{ color: noveltyColor(novelty) }}>
            novelty {Math.round(novelty * 100)}
          </span>
        </div>
      </div>

      <button
        onClick={() => setExpanded((v) => !v)}
        className="block w-full cursor-pointer text-left"
      >
        <p
          className={`text-[13px] leading-relaxed text-white ${expanded ? "" : "line-clamp-3"}`}
        >
          {summary}
        </p>
      </button>

      {matched.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {matched.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-medium text-purple-300"
            >
              ✓ {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={handleTurnIntoHook}
          className="rounded-md bg-[--primary] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
        >
          Turn into hook
        </button>
        <button
          onClick={handleSave}
          disabled={saved}
          className="rounded-md border border-[--border] bg-[--bg-secondary] px-3 py-1.5 text-xs text-[--text-secondary] hover:text-white disabled:opacity-50"
        >
          {saved ? "Saved" : "Save"}
        </button>
        <button
          onClick={() => setArchived(true)}
          className="rounded-md border border-[--border] bg-[--bg-secondary] px-3 py-1.5 text-xs text-[--text-muted] hover:text-white"
        >
          Archive
        </button>
      </div>
    </div>
  );
}
