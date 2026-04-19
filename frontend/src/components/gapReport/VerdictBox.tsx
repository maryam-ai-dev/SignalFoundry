"use client";

import type { AxisBand, GapAxis, GapReport, VerdictBand } from "./types";

const BAND_STYLES: Record<VerdictBand, { label: string; border: string; bg: string; color: string }> = {
  strong: {
    label: "STRONG OPPORTUNITY",
    border: "rgba(124, 255, 107, 0.5)",
    bg: "rgba(124, 255, 107, 0.08)",
    color: "#7CFF6B",
  },
  worth: {
    label: "WORTH EXPLORING",
    border: "rgba(255, 170, 64, 0.45)",
    bg: "rgba(255, 170, 64, 0.06)",
    color: "#FFAA40",
  },
  crowded: {
    label: "CROWDED SPACE",
    border: "rgba(255, 68, 68, 0.45)",
    bg: "rgba(255, 68, 68, 0.06)",
    color: "#FF4444",
  },
};

const AXIS_BAND_COLORS: Record<AxisBand, string> = {
  dark_green: "#47C85B",
  light_green: "#7CFF6B",
  amber: "#FFAA40",
  red: "#FF4444",
};

const AXIS_LABEL: Record<string, string> = {
  originality: "Originality",
  research_backing: "Research backing",
  market_signal: "Market signal",
  funding_whitespace: "Funding whitespace",
};

const EXPECTED_AXES = ["originality", "research_backing", "market_signal", "funding_whitespace"];

function axisLabel(name: string): string {
  return AXIS_LABEL[name] || name.replace(/_/g, " ");
}

function axisColor(band: AxisBand | undefined): string {
  return (band && AXIS_BAND_COLORS[band]) || "rgba(255,255,255,0.3)";
}

export default function VerdictBox({ report }: { report: GapReport }) {
  const band = report.verdict_band;
  const style = BAND_STYLES[band] || BAND_STYLES.crowded;

  const axesByName = new Map(report.axes?.map((a) => [a.name, a]) || []);
  const orderedAxes = EXPECTED_AXES.map((name) => axesByName.get(name)).filter(
    (a): a is GapAxis => Boolean(a)
  );
  const remaining = (report.axes || []).filter(
    (a) => !EXPECTED_AXES.includes(a.name)
  );
  const displayAxes = [...orderedAxes, ...remaining];

  return (
    <div
      className="space-y-4 rounded-lg border p-5"
      style={{ borderColor: style.border, backgroundColor: style.bg }}
    >
      <div className="space-y-1">
        <p
          className="font-mono text-[9px] uppercase tracking-[0.15em]"
          style={{ color: style.color }}
        >
          {style.label}
        </p>
        <p className="text-[14px] leading-relaxed text-white">
          {report.single_verdict || report.verdict || "Insufficient data"}
        </p>
        {report.low_signal_flag && (
          <p className="font-mono text-[10px] text-amber-300">
            Low signal — treat as a positive gap, not a red flag.
          </p>
        )}
      </div>

      <div className="space-y-2">
        {displayAxes.length === 0 ? (
          <p className="text-xs text-[--text-muted]">Insufficient data</p>
        ) : (
          displayAxes.map((axis) => (
            <AxisRow key={axis.name} axis={axis} />
          ))
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[--border] pt-3">
        <span className="font-mono text-[9px] uppercase tracking-wider text-[--text-muted]">
          Domain: {report.domain} · {report.domain_confidence}
        </span>
        {typeof report.revision_number === "number" && (
          <span className="font-mono text-[9px] uppercase tracking-wider text-[--text-muted]">
            Revision {report.revision_number}
          </span>
        )}
      </div>
    </div>
  );
}

function AxisRow({ axis }: { axis: GapAxis }) {
  const barColor = axisColor(axis.band);
  const width = Math.max(0, Math.min(100, axis.score));

  return (
    <div className="flex items-center gap-3">
      <div className="w-28 shrink-0">
        <p className="truncate font-mono text-[10px] uppercase tracking-wider text-[--text-secondary]">
          {axisLabel(axis.name)}
        </p>
        <p className="font-mono text-[9px] text-[--text-muted]">
          weight: {axis.weight.toFixed(2)}
        </p>
      </div>
      <div className="flex-1">
        <div className="h-[7px] overflow-hidden rounded-full bg-[--bg-base]">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${width}%`, backgroundColor: barColor }}
          />
        </div>
      </div>
      <div className="w-24 shrink-0 text-right">
        <p className="font-mono text-[10px] text-white">{axis.score}</p>
        <p className="font-mono text-[9px] text-[--text-muted]">
          n={axis.raw_count} · {axis.confidence}
        </p>
      </div>
    </div>
  );
}
