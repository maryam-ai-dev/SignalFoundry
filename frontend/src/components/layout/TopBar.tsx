"use client";

import { useEffect, useState } from "react";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { apiFetch } from "@/lib/api";

interface ActiveCampaign {
  name: string;
  goalType: string;
}

export default function TopBar() {
  const [mode, setMode] = useState<"General" | "Campaign">("General");
  const [campaign, setCampaign] = useState<ActiveCampaign | null>(null);
  const [toast, setToast] = useState("");
  const workspaceId = useWorkspaceStore((s) => s.workspaceId);

  useEffect(() => {
    if (!workspaceId) return;
    apiFetch(`/api/campaigns?workspaceId=${workspaceId}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const active = data.find((c: any) => c.status === "ACTIVE");
          if (active) setCampaign({ name: active.name, goalType: active.goalType });
          else setCampaign(null);
        }
      })
      .catch(() => {});
  }, [workspaceId]);

  function handleModeToggle(newMode: "General" | "Campaign") {
    if (newMode === "Campaign" && !campaign) {
      setToast("Create a campaign first");
      setTimeout(() => setToast(""), 3000);
      return;
    }
    setMode(newMode);
  }

  return (
    <header className="fixed top-0 left-56 right-0 z-20 flex h-14 items-center justify-between border-b border-[--border] bg-[--bg-panel] px-6">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-white">My Workspace</span>

        <div className="flex items-center rounded-md border border-[--border] bg-[--bg-secondary] p-0.5">
          <button
            onClick={() => handleModeToggle("General")}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              mode === "General"
                ? "bg-[--bg-panel] text-white"
                : "text-[--text-muted] hover:text-[--text-secondary]"
            }`}
          >
            General
          </button>
          <button
            onClick={() => handleModeToggle("Campaign")}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              mode === "Campaign"
                ? "bg-[--bg-panel] text-white"
                : "text-[--text-muted] hover:text-[--text-secondary]"
            }`}
          >
            Campaign
          </button>
        </div>

        {mode === "Campaign" && campaign && (
          <span
            className="rounded-full px-3 py-1 text-[10px] font-medium text-white"
            style={{
              border: "1px solid transparent",
              backgroundImage: "linear-gradient(var(--bg-panel), var(--bg-panel)), var(--rainbow)",
              backgroundOrigin: "border-box",
              backgroundClip: "padding-box, border-box",
            }}
          >
            {campaign.name} · {campaign.goalType.replace(/_/g, " ")}
          </span>
        )}

        {toast && (
          <span className="rounded-md bg-red-500/10 px-3 py-1 text-xs text-red-400">{toast}</span>
        )}
      </div>

      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[--bg-secondary] text-xs font-medium text-[--text-secondary]">
        M
      </div>
    </header>
  );
}
