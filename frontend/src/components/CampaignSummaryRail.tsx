"use client";

import { useEffect, useState } from "react";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { apiFetch } from "@/lib/api";

interface Campaign {
  name: string;
  goalType: string;
  targetAudience: string;
  ctaStyle: string;
  toneGuidance: string;
}

export default function CampaignSummaryRail() {
  const workspaceId = useWorkspaceStore((s) => s.workspaceId);
  const [campaign, setCampaign] = useState<Campaign | null>(null);

  useEffect(() => {
    if (!workspaceId) return;
    apiFetch(`/api/campaigns?workspaceId=${workspaceId}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const active = data.find((c: any) => c.status === "ACTIVE");
          setCampaign(active || null);
        }
      })
      .catch(() => {});
  }, [workspaceId]);

  if (!campaign) return null;

  return (
    <div className="rounded-lg border border-[--border] bg-[--bg-panel] p-4 space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-[--text-muted]">
        Active Campaign
      </h3>
      <p className="text-sm font-medium text-white">{campaign.name}</p>
      <div className="space-y-2 text-xs text-[--text-secondary]">
        <div>
          <span className="text-[--text-muted]">Goal: </span>
          {campaign.goalType.replace(/_/g, " ")}
        </div>
        {campaign.targetAudience && (
          <div>
            <span className="text-[--text-muted]">Audience: </span>
            {campaign.targetAudience}
          </div>
        )}
        {campaign.ctaStyle && (
          <div>
            <span className="text-[--text-muted]">CTA: </span>
            {campaign.ctaStyle}
          </div>
        )}
        {campaign.toneGuidance && (
          <div>
            <span className="text-[--text-muted]">Tone: </span>
            {campaign.toneGuidance}
          </div>
        )}
      </div>
    </div>
  );
}
