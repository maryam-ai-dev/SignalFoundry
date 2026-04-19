"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useWorkspaceStore, type AccountMode } from "@/stores/useWorkspaceStore";
import { apiFetch } from "@/lib/api";

export default function ModeSelectionPage() {
  const { authenticated } = useRequireAuth();
  const [mode, setMode] = useState<AccountMode | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const setAccountMode = useWorkspaceStore((s) => s.setAccountMode);
  const router = useRouter();

  async function handleContinue() {
    if (!mode) return;
    setSubmitting(true);
    setAccountMode(mode);
    try {
      await apiFetch("/api/preferences/account-mode", {
        method: "PUT",
        body: JSON.stringify({ mode }),
      });
    } catch {
      // Swallow — mode is already in localStorage via setAccountMode. Retry later.
    }
    router.push("/setup");
  }

  if (!authenticated) return null;

  return (
    <div className="w-full max-w-2xl space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-white">How will you use SignalFoundry?</h1>
        <p className="text-sm text-[--text-muted]">Pick the mode that matches how you work.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ModeCard
          selected={mode === "FOUNDER"}
          onSelect={() => setMode("FOUNDER")}
          accent="#9B5CFF"
          title="Founder"
          description="Signal scanning, idea validation against research and patents, voice-tuned hooks. For solo founders and indie hackers building a product."
          price="£29/mo"
          trial="14-day free trial · no card needed"
        />
        <ModeCard
          selected={mode === "INVESTOR"}
          onSelect={() => setMode("INVESTOR")}
          accent="#43E7C6"
          title="Investor"
          description="Portfolio-level whitespace detection across multiple niches. For angels, scouts, and emerging managers sourcing early-stage deals."
          price="£59/mo · or £269/mo per seat (fund)"
          trial="14-day free trial · no card needed"
        />
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleContinue}
          disabled={!mode || submitting}
          title={!mode ? "Select a mode to continue" : undefined}
          className="rounded-md bg-[--primary] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Continue to niche setup →"}
        </button>
      </div>

      <p className="text-center text-xs text-[--text-muted]">
        No credit card required · Cancel anytime · Founding cohort: £189 lifetime Founder / £749 lifetime Investor Angel (limited seats)
      </p>
    </div>
  );
}

function ModeCard({
  selected,
  onSelect,
  accent,
  title,
  description,
  price,
  trial,
}: {
  selected: boolean;
  onSelect: () => void;
  accent: string;
  title: string;
  description: string;
  price: string;
  trial: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className="group relative flex h-full flex-col items-start gap-3 rounded-lg border bg-[--bg-panel] p-5 text-left transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[--ring]"
      style={{
        borderColor: selected ? accent : "var(--border)",
        boxShadow: selected ? `0 0 0 1px ${accent}` : undefined,
      }}
    >
      {selected && (
        <span
          className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
          style={{ backgroundColor: accent }}
        >
          ✓
        </span>
      )}
      <span
        className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
        style={{ backgroundColor: `${accent}22`, color: accent }}
      >
        {title}
      </span>
      <p className="text-sm leading-relaxed text-[--text-secondary]">{description}</p>
      <div className="mt-auto space-y-1 pt-2">
        <p className="text-base font-semibold text-white">{price}</p>
        <p className="text-[11px] text-[--text-muted]">{trial}</p>
      </div>
    </button>
  );
}
