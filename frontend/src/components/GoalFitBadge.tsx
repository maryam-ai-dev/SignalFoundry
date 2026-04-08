"use client";

interface Props {
  score: number | null | undefined;
}

export default function GoalFitBadge({ score }: Props) {
  if (score == null) return null;

  const pct = Math.round(score * 100);
  let label: string;
  let barColor: string;

  if (score >= 0.7) {
    label = "High";
    barColor = "bg-green-400";
  } else if (score >= 0.4) {
    label = "Medium";
    barColor = "bg-amber-400";
  } else {
    label = "Low";
    barColor = "bg-red-400";
  }

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full bg-[--bg-base]">
        <div
          className={`h-1.5 rounded-full ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] text-[--text-muted]">{label} fit</span>
    </div>
  );
}
