"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import {
  useWorkspaceStore,
  DIGEST_DAYS,
  type DigestDay,
} from "@/stores/useWorkspaceStore";
import { apiFetch } from "@/lib/api";

const DAY_LABELS: Record<DigestDay, string> = {
  MON: "Mon",
  TUE: "Tue",
  WED: "Wed",
  THU: "Thu",
  FRI: "Fri",
  SAT: "Sat",
  SUN: "Sun",
};

export default function DigestDayPage() {
  const { authenticated } = useRequireAuth();
  const [day, setDay] = useState<DigestDay>("MON");
  const [submitting, setSubmitting] = useState(false);
  const setDigestDay = useWorkspaceStore((s) => s.setDigestDay);
  const router = useRouter();

  async function handleContinue(selected: DigestDay) {
    setSubmitting(true);
    setDigestDay(selected);
    try {
      await apiFetch("/api/preferences/digest-day", {
        method: "PUT",
        body: JSON.stringify({ day: selected }),
      });
    } catch {
      // Swallow — day already in localStorage via setDigestDay.
    }
    router.push("/setup");
  }

  if (!authenticated) return null;

  return (
    <div className="w-full max-w-xl space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-white">
          When should we send your weekly brief?
        </h1>
        <p className="text-sm text-[--text-muted]">
          Every week we send a digest of what moved in your niche — top signals, new patents, open grants, and hooks ready to ship.
        </p>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {DIGEST_DAYS.map((d) => {
          const active = day === d;
          return (
            <button
              key={d}
              type="button"
              onClick={() => setDay(d)}
              aria-pressed={active}
              className="rounded-md border px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[--ring]"
              style={{
                backgroundColor: active ? "rgba(124, 255, 107, 0.15)" : "var(--bg-secondary)",
                borderColor: active ? "#7CFF6B" : "var(--border)",
                color: active ? "#7CFF6B" : "var(--text-secondary)",
              }}
            >
              {DAY_LABELS[d]}
            </button>
          );
        })}
      </div>

      <div className="rounded-lg border border-[--border] bg-[--bg-panel] p-4">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-[--text-muted]">
          Example digest preview
        </p>
        <ul className="space-y-2 text-sm text-[--text-secondary]">
          <li>3 new high-novelty signals from your niche this week</li>
          <li>1 new patent filed adjacent to your idea</li>
          <li>2 open grants closing within 60 days — worth applying</li>
          <li>5 hooks ready to ship, voice-matched to your profile</li>
        </ul>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => handleContinue("MON")}
          disabled={submitting}
          className="text-sm text-[--text-muted] hover:text-white disabled:opacity-50"
        >
          Skip for now
        </button>
        <button
          type="button"
          onClick={() => handleContinue(day)}
          disabled={submitting}
          className="rounded-md bg-[--primary] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Continue to niche setup →"}
        </button>
      </div>
    </div>
  );
}
