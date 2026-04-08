"use client";

import { useState } from "react";

export default function TopBar() {
  const [mode, setMode] = useState<"General" | "Campaign">("General");

  return (
    <header className="fixed top-0 left-56 right-0 z-20 flex h-14 items-center justify-between border-b border-[--border] bg-[--bg-panel] px-6">
      <div className="flex items-center gap-6">
        <span className="text-sm font-medium text-white">My Workspace</span>

        <div className="flex items-center rounded-md border border-[--border] bg-[--bg-secondary] p-0.5">
          <button
            onClick={() => setMode("General")}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              mode === "General"
                ? "bg-[--bg-panel] text-white"
                : "text-[--text-muted] hover:text-[--text-secondary]"
            }`}
          >
            General
          </button>
          <button
            onClick={() => setMode("Campaign")}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              mode === "Campaign"
                ? "bg-[--bg-panel] text-white"
                : "text-[--text-muted] hover:text-[--text-secondary]"
            }`}
          >
            Campaign
          </button>
        </div>
      </div>

      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[--bg-secondary] text-xs font-medium text-[--text-secondary]">
        M
      </div>
    </header>
  );
}
