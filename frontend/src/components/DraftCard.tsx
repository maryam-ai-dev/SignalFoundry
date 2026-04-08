"use client";

import { useRef, useState } from "react";
import VoiceMatchBadge from "./VoiceMatchBadge";

interface Props {
  id: string;
  draftText: string;
  editedText: string;
  strategyType: string;
  status: string;
  riskFlags: string[];
  requiresEdit: boolean;
  voiceScore?: number | null;
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
  onEdit: (text: string) => Promise<void>;
}

const STRATEGY_COLORS: Record<string, string> = {
  INSIGHTFUL: "bg-blue-500/20 text-blue-400",
  EMPATHETIC: "bg-pink-500/20 text-pink-400",
  FOUNDER_PERSPECTIVE: "bg-purple-500/20 text-purple-400",
};

export default function DraftCard({
  id,
  draftText,
  editedText,
  strategyType,
  status: initialStatus,
  riskFlags,
  requiresEdit,
  voiceScore,
  onApprove,
  onReject,
  onEdit,
}: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [text, setText] = useState(editedText || draftText);
  const [saving, setSaving] = useState(false);
  const textRef = useRef(text);

  const isApproved = status === "APPROVED";
  const isRejected = status === "REJECTED";

  async function handleBlur() {
    if (textRef.current !== text || isApproved || isRejected) return;
    textRef.current = text;
    setSaving(true);
    await onEdit(text);
    setSaving(false);
  }

  async function handleApprove() {
    try {
      await onApprove();
      setStatus("APPROVED");
    } catch {
      // error handled by caller
    }
  }

  async function handleReject() {
    await onReject();
    setStatus("REJECTED");
  }

  const chipClass = STRATEGY_COLORS[strategyType] || "bg-gray-500/20 text-gray-400";

  return (
    <div
      className={`rounded-lg border p-3 space-y-2 transition-opacity ${
        isRejected
          ? "border-[--border] bg-[--bg-secondary] opacity-40"
          : "border-[--border] bg-[--bg-secondary]"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${chipClass}`}
          >
            {strategyType.replace("_", " ")}
          </span>
          <VoiceMatchBadge score={voiceScore ?? null} />
          {isApproved && (
            <span className="rounded bg-green-500/20 px-2 py-0.5 text-[10px] font-semibold text-green-400">
              Approved
            </span>
          )}
          {isRejected && (
            <span className="rounded bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold text-red-400">
              Rejected
            </span>
          )}
          {saving && (
            <span className="text-[10px] text-[--text-muted]">Saving...</span>
          )}
        </div>
        {!isApproved && !isRejected && (
          <div className="flex gap-1">
            <button
              onClick={handleReject}
              className="rounded px-2 py-1 text-xs text-[--text-muted] hover:text-red-400 transition-colors"
            >
              Reject
            </button>
            <button
              onClick={handleApprove}
              className="rounded bg-green-500/20 px-2 py-1 text-xs font-medium text-green-400 hover:bg-green-500/30 transition-colors"
            >
              Approve
            </button>
          </div>
        )}
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleBlur}
        disabled={isApproved || isRejected}
        rows={3}
        className="w-full resize-none rounded border border-[--border] bg-[--bg-base] px-2 py-1.5 text-sm text-white placeholder:text-[--text-muted] focus:outline-none focus:ring-1 focus:ring-[--ring] disabled:opacity-60"
      />

      {riskFlags.length > 0 && (
        <div className="space-y-1">
          {riskFlags.map((flag, i) => (
            <p key={i} className="text-[10px] text-amber-400">
              ⚠ {flag}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
