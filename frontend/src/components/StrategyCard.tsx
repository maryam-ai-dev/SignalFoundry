"use client";

import { useState } from "react";

interface Props {
  id: string;
  type: string;
  typeLabel: string;
  text: string;
  secondaryText?: string;
  confidence: number;
  saved: boolean;
  onSave: () => Promise<void>;
  onArchive: () => Promise<void>;
  onRegenerate?: () => Promise<void>;
}

const TYPE_COLORS: Record<string, string> = {
  PROBLEM_AWARE: "bg-red-500/20 text-red-400",
  CONTRARIAN: "bg-amber-500/20 text-amber-400",
  EMPATHY: "bg-pink-500/20 text-pink-400",
  CURIOSITY: "bg-blue-500/20 text-blue-400",
  FOUNDER_STORY: "bg-purple-500/20 text-purple-400",
  BELIEF_CHALLENGE: "bg-teal-500/20 text-teal-400",
  EDUCATIONAL: "bg-emerald-500/20 text-emerald-400",
  PRODUCT_BUILDING: "bg-indigo-500/20 text-indigo-400",
  USER_PSYCHOLOGY: "bg-cyan-500/20 text-cyan-400",
};

function confidenceColor(c: number) {
  if (c >= 0.7) return "bg-green-400";
  if (c >= 0.5) return "bg-amber-400";
  return "bg-red-400";
}

export default function StrategyCard({
  type,
  typeLabel,
  text,
  secondaryText,
  confidence,
  saved: initialSaved,
  onSave,
  onArchive,
  onRegenerate,
}: Props) {
  const [saved, setSaved] = useState(initialSaved);
  const [archived, setArchived] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [displayText, setDisplayText] = useState(text);

  if (archived) return null;

  const badgeClass = TYPE_COLORS[type] || "bg-gray-500/20 text-gray-400";

  async function handleSave() {
    if (saved) return;
    setSaved(true);
    await onSave();
  }

  async function handleArchive() {
    setArchived(true);
    await onArchive();
  }

  async function handleRegenerate() {
    if (!onRegenerate || regenerating) return;
    setRegenerating(true);
    await onRegenerate();
    setRegenerating(false);
  }

  return (
    <div className="rounded-lg border border-[--border] bg-[--bg-secondary] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badgeClass}`}>
            {typeLabel}
          </span>
          <span className={`h-2 w-2 rounded-full ${confidenceColor(confidence)}`} />
        </div>
        <div className="flex items-center gap-1">
          {onRegenerate && (
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="rounded px-2 py-1 text-xs text-[--text-muted] hover:text-white transition-colors disabled:opacity-50"
            >
              {regenerating ? "..." : "Regen"}
            </button>
          )}
          <button
            onClick={handleArchive}
            className="rounded px-2 py-1 text-xs text-[--text-muted] hover:text-red-400 transition-colors"
          >
            Archive
          </button>
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
      </div>
      <p className="text-sm leading-relaxed text-white">{displayText}</p>
      {secondaryText && (
        <p className="text-xs text-[--text-muted]">{secondaryText}</p>
      )}
    </div>
  );
}
