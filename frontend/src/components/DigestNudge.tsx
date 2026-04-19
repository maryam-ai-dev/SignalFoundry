"use client";

import { useRouter } from "next/navigation";
import { useWorkspaceStore, type DigestDay } from "@/stores/useWorkspaceStore";

const DAY_FULL: Record<DigestDay, string> = {
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday",
  SUN: "Sunday",
};

export default function DigestNudge() {
  const digestDay = useWorkspaceStore((s) => s.digestDay);
  const router = useRouter();
  const label = DAY_FULL[digestDay];

  return (
    <div className="flex items-center justify-between rounded-md border border-[--border] bg-[--bg-panel] px-4 py-2 text-xs">
      <div className="flex items-center gap-3">
        <span
          className="inline-flex h-2 w-2 flex-shrink-0 rounded-full"
          style={{ backgroundColor: "#7CFF6B" }}
        />
        <span className="text-[--text-secondary]">
          Your weekly intelligence brief arrives <strong className="text-white">{label}</strong> morning — signals, hooks, and what moved in your niche.
        </span>
      </div>
      <button
        onClick={() => router.push("/settings#digest")}
        className="text-[11px] text-[--text-muted] hover:text-white"
      >
        Change day →
      </button>
    </div>
  );
}
