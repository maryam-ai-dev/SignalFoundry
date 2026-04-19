"use client";

export default function CampaignPill({ name, goalType }: { name: string; goalType?: string }) {
  return (
    <span
      className="rounded-full px-3 py-1 text-[10px] font-medium text-white"
      style={{
        border: "1px solid transparent",
        backgroundImage:
          "linear-gradient(var(--bg-panel), var(--bg-panel)), var(--rainbow)",
        backgroundOrigin: "border-box",
        backgroundClip: "padding-box, border-box",
      }}
    >
      Campaign active · {name}
      {goalType && (
        <span className="ml-2 font-mono text-[9px] uppercase text-[--text-muted]">
          {goalType.replace(/_/g, " ")}
        </span>
      )}
    </span>
  );
}
