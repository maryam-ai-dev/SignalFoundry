"use client";

export interface MovedDeltas {
  signals?: number | null;
  hooksShipped?: number | null;
  voiceVersion?: string | null;
  opportunities?: number | null;
  ideasMatched?: number | null;
}

type Pill = { label: string; value: string; positive: boolean };

function buildPills(d: MovedDeltas): Pill[] {
  const pills: Pill[] = [];
  if (typeof d.signals === "number" && d.signals > 0)
    pills.push({ label: "signals", value: `+${d.signals} signals`, positive: true });
  else if (d.signals === 0) pills.push({ label: "signals", value: "~ signals", positive: false });

  if (typeof d.hooksShipped === "number" && d.hooksShipped > 0)
    pills.push({ label: "hooks", value: `+${d.hooksShipped} hooks shipped`, positive: true });
  else if (d.hooksShipped === 0) pills.push({ label: "hooks", value: "~ hooks", positive: false });

  if (d.voiceVersion) pills.push({ label: "voice", value: `~ voice ${d.voiceVersion}`, positive: false });

  if (typeof d.opportunities === "number" && d.opportunities > 0)
    pills.push({ label: "opps", value: `+${d.opportunities} opportunities`, positive: true });
  else if (d.opportunities === 0) pills.push({ label: "opps", value: "~ opportunities", positive: false });

  if (typeof d.ideasMatched === "number" && d.ideasMatched > 0)
    pills.push({ label: "ideas", value: `${d.ideasMatched} idea${d.ideasMatched > 1 ? "s" : ""} matched`, positive: true });

  return pills;
}

export default function WhatMovedStrip({ deltas }: { deltas: MovedDeltas | null }) {
  if (!deltas) return null;
  const pills = buildPills(deltas);
  if (pills.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-mono text-[9px] uppercase tracking-wider text-[--text-muted]">
        What moved
      </span>
      {pills.map((p) => (
        <span
          key={p.label}
          className="rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider"
          style={{
            borderColor: p.positive ? "rgba(124,255,107,0.25)" : "rgba(255,170,64,0.25)",
            backgroundColor: p.positive ? "rgba(124,255,107,0.08)" : "rgba(255,170,64,0.06)",
            color: p.positive ? "#7CFF6B" : "#FFAA40",
          }}
        >
          {p.value}
        </span>
      ))}
    </div>
  );
}
