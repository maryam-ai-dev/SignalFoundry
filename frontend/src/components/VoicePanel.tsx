"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

export type VoiceState = "CALIBRATED" | "DRAFT" | "SLIDERS_ONLY" | "UNKNOWN";

export interface VoiceSliders {
  formalCasual: number;  // 0 = formal, 100 = casual
  directReflective: number; // 0 = direct, 100 = reflective
  technicalPlain: number; // 0 = technical, 100 = plain
}

export const DEFAULT_SLIDERS: VoiceSliders = {
  formalCasual: 50,
  directReflective: 50,
  technicalPlain: 50,
};

interface VoicePanelProps {
  workspaceId: string | null;
  sliders: VoiceSliders;
  onSlidersChange: (s: VoiceSliders) => void;
}

interface VoiceProfile {
  confidenceState?: string;
  state?: string;
  voiceVersion?: string;
  version?: string;
  excerpt?: string;
  representativePhrase?: string;
}

function mapState(p: VoiceProfile | null): VoiceState {
  if (!p) return "SLIDERS_ONLY";
  const raw = (p.confidenceState || p.state || "").toUpperCase();
  if (raw === "USABLE" || raw === "MATURE" || raw === "CALIBRATED") return "CALIBRATED";
  if (raw === "DRAFT" || raw === "COLLECTING") return "DRAFT";
  return "SLIDERS_ONLY";
}

export default function VoicePanel({
  workspaceId,
  sliders,
  onSlidersChange,
}: VoicePanelProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<VoiceProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    if (!workspaceId) return;
    let cancelled = false;
    apiFetch(`/api/voice-profiles/me?workspaceId=${workspaceId}`)
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          setUnavailable(true);
          return;
        }
        setProfile(await res.json());
      })
      .catch(() => {
        if (!cancelled) setUnavailable(true);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  const state = unavailable ? "SLIDERS_ONLY" : mapState(profile);
  const version = profile?.voiceVersion || profile?.version || "v1";
  const excerpt = profile?.excerpt || profile?.representativePhrase || "";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-[10px] uppercase tracking-wide text-[--text-muted]">
          Voice
        </h2>
        <StatePill state={state} version={version} />
      </div>

      {unavailable && (
        <p className="rounded-md border border-[--border] bg-[--bg-secondary] px-2 py-1 text-[10px] text-[--text-muted]">
          Voice unavailable — using sliders
        </p>
      )}

      {state === "CALIBRATED" && excerpt && (
        <div className="space-y-1">
          <p className="font-mono text-[8px] uppercase tracking-wide text-[--text-muted]">
            How we read your voice
          </p>
          <blockquote
            className="border-l-2 pl-2 text-[11px] italic leading-snug text-[--text-secondary]"
            style={{ borderColor: "#9B5CFF" }}
          >
            {excerpt}
          </blockquote>
        </div>
      )}

      {(state === "DRAFT" || state === "SLIDERS_ONLY" || unavailable) && (
        <div className="space-y-3">
          <Slider
            label="Formal ↔ Casual"
            value={sliders.formalCasual}
            onChange={(v) => onSlidersChange({ ...sliders, formalCasual: v })}
          />
          <Slider
            label="Direct ↔ Reflective"
            value={sliders.directReflective}
            onChange={(v) => onSlidersChange({ ...sliders, directReflective: v })}
          />
          <Slider
            label="Technical ↔ Plain"
            value={sliders.technicalPlain}
            onChange={(v) => onSlidersChange({ ...sliders, technicalPlain: v })}
          />
        </div>
      )}

      <button
        onClick={() => router.push("/settings#voice")}
        className="text-[11px] text-[--primary] hover:underline"
      >
        Add samples →
      </button>

      {loading && !profile && !unavailable && (
        <div className="h-4 animate-pulse rounded bg-[--bg-secondary]" />
      )}
    </div>
  );
}

function StatePill({ state, version }: { state: VoiceState; version: string }) {
  const map: Record<VoiceState, { label: string; color: string; bg: string }> = {
    CALIBRATED: { label: `Calibrated · ${version}`, color: "#7CFF6B", bg: "rgba(124,255,107,0.15)" },
    DRAFT: { label: "Draft", color: "#FFAA40", bg: "rgba(255,170,64,0.15)" },
    SLIDERS_ONLY: { label: "Sliders only", color: "rgba(255,255,255,0.5)", bg: "rgba(255,255,255,0.05)" },
    UNKNOWN: { label: "—", color: "rgba(255,255,255,0.5)", bg: "rgba(255,255,255,0.05)" },
  };
  const m = map[state];
  return (
    <span
      className="rounded-full px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider"
      style={{ backgroundColor: m.bg, color: m.color }}
    >
      {m.label}
    </span>
  );
}

function Slider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block space-y-1">
      <span className="font-mono text-[9px] uppercase tracking-wide text-[--text-muted]">
        {label}
      </span>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[--primary]"
      />
    </label>
  );
}
