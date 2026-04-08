"use client";

import { useState } from "react";
import GoalFitBadge from "./GoalFitBadge";

interface Props {
  type: string;
  title: string;
  summary: string;
  confidence: number;
  sourceCount?: number;
  goalFitScore?: number | null;
  onSave?: () => void;
}

const TYPE_COLORS: Record<string, string> = {
  TREND: "bg-emerald-500/20 text-emerald-400",
  NARRATIVE: "bg-purple-500/20 text-purple-400",
  PAIN: "bg-red-500/20 text-red-400",
  OBJECTION: "bg-amber-500/20 text-amber-400",
  BELIEF_GAP: "bg-blue-500/20 text-blue-400",
  LANGUAGE: "bg-teal-500/20 text-teal-400",
};

function confidenceColor(c: number) {
  if (c >= 0.7) return "bg-green-400";
  if (c >= 0.5) return "bg-amber-400";
  return "bg-red-400";
}

export default function InsightCard({
  type,
  title,
  summary,
  confidence,
  sourceCount,
  goalFitScore,
  onSave,
}: Props) {
  const [saved, setSaved] = useState(false);

  function handleSave() {
    if (saved) return;
    setSaved(true);
    onSave?.();
  }

  const badgeClass = TYPE_COLORS[type] || "bg-gray-500/20 text-gray-400";

  return (
    <div className="rounded-lg border border-[--border] bg-[--bg-secondary] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badgeClass}`}
          >
            {type.replace("_", " ")}
          </span>
          <span className={`h-2 w-2 rounded-full ${confidenceColor(confidence)}`} />
          {sourceCount != null && sourceCount > 0 && (
            <span className="text-[10px] text-[--text-muted]">
              {sourceCount} sources
            </span>
          )}
          <GoalFitBadge score={goalFitScore ?? null} />
        </div>
        <button
          onClick={handleSave}
          className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
            saved
              ? "bg-[--primary] text-white"
              : "border border-[--border] text-[--text-secondary] hover:border-[--primary] hover:text-[--primary]"
          }`}
        >
          {saved ? "Saved" : "Save"}
        </button>
      </div>
      {title && (
        <h3 className="text-sm font-medium text-white">{title}</h3>
      )}
      <p className="text-sm leading-relaxed text-[--text-secondary]">
        {summary}
      </p>
    </div>
  );
}
