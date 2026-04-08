"use client";

import { useCallback, useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { apiFetch } from "@/lib/api";
import ResearchRunStatus from "@/components/ResearchRunStatus";

const PLATFORMS = ["reddit", "youtube", "web", "producthunt"];

export default function ResearchPage() {
  const { authenticated } = useRequireAuth();
  const workspaceId = useWorkspaceStore((s) => s.workspaceId);
  const [query, setQuery] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([
    "reddit",
  ]);
  const [runId, setRunId] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");

  function togglePlatform(p: string) {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  async function handleRunScan() {
    if (!workspaceId || !query.trim()) return;
    setError("");
    setScanning(true);
    try {
      const res = await apiFetch("/api/research/runs", {
        method: "POST",
        body: JSON.stringify({
          workspaceId,
          queryText: query.trim(),
          platforms: selectedPlatforms,
          mode: "GENERAL",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to start scan");
        setScanning(false);
        return;
      }
      setRunId(data.runId);
    } catch {
      setError("Network error");
      setScanning(false);
    }
  }

  const onPartialReady = useCallback(() => {
    // Insights are available — could trigger data fetch here
  }, []);

  const onComplete = useCallback(() => {
    setScanning(false);
  }, []);

  if (!authenticated) return null;

  return (
    <div className="flex gap-4 h-[calc(100vh-5rem)]">
      {/* Left — Search Panel */}
      <div className="w-[22%] flex flex-col gap-4 rounded-lg border border-[--border] bg-[--bg-panel] p-4">
        <h2 className="text-sm font-semibold text-white">New Scan</h2>

        <input
          type="text"
          placeholder="What do you want to research?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleRunScan()}
          className="w-full rounded-md border border-[--border] bg-[--bg-secondary] px-3 py-2 text-sm text-white placeholder:text-[--text-muted] focus:outline-none focus:ring-1 focus:ring-[--ring]"
        />

        <div className="space-y-2">
          <p className="text-xs font-medium text-[--text-secondary]">
            Platforms
          </p>
          {PLATFORMS.map((p) => (
            <label
              key={p}
              className="flex items-center gap-2 text-sm text-[--text-secondary] cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedPlatforms.includes(p)}
                onChange={() => togglePlatform(p)}
                className="rounded border-[--border] bg-[--bg-secondary]"
              />
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </label>
          ))}
        </div>

        {error && (
          <p className="rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {error}
          </p>
        )}

        {runId && (
          <ResearchRunStatus
            runId={runId}
            onPartialReady={onPartialReady}
            onComplete={onComplete}
          />
        )}

        <button
          onClick={handleRunScan}
          disabled={
            !query.trim() || selectedPlatforms.length === 0 || scanning
          }
          className="mt-auto w-full rounded-md bg-[--primary] px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {scanning ? "Scanning..." : "Run Scan"}
        </button>
      </div>

      {/* Centre — Result Stream */}
      <div className="flex-1 rounded-lg border border-[--border] bg-[--bg-panel] p-4 overflow-y-auto">
        <div className="flex h-full items-center justify-center">
          <p className="text-sm text-[--text-muted]">
            Run a scan to see insights
          </p>
        </div>
      </div>

      {/* Right — Synthesis Panel */}
      <div className="w-[23%] rounded-lg border border-[--border] bg-[--bg-panel] p-4 overflow-y-auto">
        <div className="flex h-full items-center justify-center">
          <p className="text-sm text-[--text-muted]">
            Synthesis will appear here
          </p>
        </div>
      </div>
    </div>
  );
}
