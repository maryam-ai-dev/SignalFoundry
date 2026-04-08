"use client";

interface Props {
  score: number | null;
}

export default function VoiceMatchBadge({ score }: Props) {
  if (score == null) return null;

  const pct = Math.round(score * 100);

  let colorClass: string;
  if (score >= 0.7) {
    colorClass = "bg-green-500/20 text-green-400";
  } else if (score >= 0.5) {
    colorClass = "bg-amber-500/20 text-amber-400";
  } else {
    colorClass = "bg-red-500/20 text-red-400";
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${colorClass}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          score >= 0.7
            ? "bg-green-400"
            : score >= 0.5
            ? "bg-amber-400"
            : "bg-red-400"
        }`}
      />
      {pct}% voice
    </span>
  );
}
