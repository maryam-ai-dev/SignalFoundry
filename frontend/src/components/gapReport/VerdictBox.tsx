"use client";

import type { GapReport } from "./types";

// Sprint 17 placeholder — real scorecard UI arrives in Sprint 18.
export default function VerdictBox({ report }: { report: GapReport }) {
  return (
    <div className="rounded-lg border border-[--border] bg-[--bg-panel] p-5">
      <p className="font-mono text-[9px] uppercase tracking-wider text-[--text-muted]">
        Verdict
      </p>
      <p className="mt-1 text-sm text-white">{report.single_verdict || report.verdict}</p>
      <p className="mt-3 font-mono text-[10px] text-[--text-muted]">
        Domain: {report.domain} · Band: {report.verdict_band}
      </p>
    </div>
  );
}
