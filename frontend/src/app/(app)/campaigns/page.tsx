"use client";

import { useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { apiFetch } from "@/lib/api";

const GOAL_TYPES = [
  "BETA_USER_ACQUISITION", "WAITLIST_GROWTH", "AWARENESS",
  "CREATOR_RECRUITMENT", "OBJECTION_TESTING", "FEATURE_VALIDATION",
];

interface Campaign {
  id: string;
  name: string;
  goalType: string;
  status: string;
  targetAudience: string;
  timeWindowDays: number;
}

export default function CampaignsPage() {
  const { authenticated } = useRequireAuth();
  const workspaceId = useWorkspaceStore((s) => s.workspaceId);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [goalType, setGoalType] = useState(GOAL_TYPES[0]);
  const [targetAudience, setTargetAudience] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!workspaceId) return;
    apiFetch(`/api/campaigns?workspaceId=${workspaceId}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setCampaigns(data); })
      .catch(() => {});
  }, [workspaceId]);

  async function handleCreate() {
    if (!workspaceId || !name.trim()) return;
    setCreating(true);
    const res = await apiFetch(`/api/campaigns?workspaceId=${workspaceId}`, {
      method: "POST",
      body: JSON.stringify({ name, goalType, targetAudience }),
    });
    if (res.ok) {
      const c = await res.json();
      setCampaigns((prev) => [...prev, c]);
      setShowCreate(false);
      setName("");
      setTargetAudience("");
    }
    setCreating(false);
  }

  async function handleActivate(id: string) {
    if (!workspaceId) return;
    const res = await apiFetch(`/api/campaigns/${id}/activate?workspaceId=${workspaceId}`, { method: "POST" });
    if (res.ok) {
      setCampaigns((prev) =>
        prev.map((c) => ({
          ...c,
          status: c.id === id ? "ACTIVE" : c.status === "ACTIVE" ? "PAUSED" : c.status,
        }))
      );
    }
  }

  async function handlePause(id: string) {
    const res = await apiFetch(`/api/campaigns/${id}/pause`, { method: "POST" });
    if (res.ok) {
      setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, status: "PAUSED" } : c)));
    }
  }

  if (!authenticated) return null;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Campaigns</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-md bg-[--primary] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          New Campaign
        </button>
      </div>

      {/* Campaign List */}
      <div className="space-y-2">
        {campaigns.length === 0 ? (
          <p className="text-sm text-[--text-muted]">No campaigns yet</p>
        ) : (
          campaigns.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-lg border border-[--border] bg-[--bg-panel] px-4 py-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{c.name}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      c.status === "ACTIVE"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
                <p className="text-xs text-[--text-muted]">
                  {c.goalType.replace(/_/g, " ")}
                  {c.targetAudience ? ` · ${c.targetAudience}` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                {c.status !== "ACTIVE" ? (
                  <button
                    onClick={() => handleActivate(c.id)}
                    className="rounded px-3 py-1 text-xs font-medium text-green-400 hover:bg-green-500/10"
                  >
                    Activate
                  </button>
                ) : (
                  <button
                    onClick={() => handlePause(c.id)}
                    className="rounded px-3 py-1 text-xs font-medium text-[--text-muted] hover:bg-[--bg-secondary]"
                  >
                    Pause
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Slide-over */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={() => setShowCreate(false)}>
          <div
            className="w-96 bg-[--bg-panel] border-l border-[--border] p-6 space-y-4 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-white">New Campaign</h2>
            <input
              type="text"
              placeholder="Campaign name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-[--border] bg-[--bg-secondary] px-3 py-2 text-sm text-white placeholder:text-[--text-muted] focus:outline-none focus:ring-1 focus:ring-[--ring]"
            />
            <select
              value={goalType}
              onChange={(e) => setGoalType(e.target.value)}
              className="w-full rounded-md border border-[--border] bg-[--bg-secondary] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[--ring]"
            >
              {GOAL_TYPES.map((g) => (
                <option key={g} value={g}>{g.replace(/_/g, " ")}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Target audience"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="w-full rounded-md border border-[--border] bg-[--bg-secondary] px-3 py-2 text-sm text-white placeholder:text-[--text-muted] focus:outline-none focus:ring-1 focus:ring-[--ring]"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 rounded-md border border-[--border] px-3 py-2 text-sm text-[--text-secondary]"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !name.trim()}
                className="flex-1 rounded-md bg-[--primary] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
