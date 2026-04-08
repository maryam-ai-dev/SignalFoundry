"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { apiFetch } from "@/lib/api";

interface VoiceProfile {
  id: string;
  maturityScore: number;
  confidenceState: string;
}

interface Sample {
  id: string;
  accepted: boolean;
  qualityScore: number;
  wordCount: number;
}

const STATE_COLORS: Record<string, string> = {
  EMPTY: "bg-gray-500/20 text-gray-400",
  COLLECTING: "bg-amber-500/20 text-amber-400",
  PROVISIONAL: "bg-blue-500/20 text-blue-400",
  USABLE: "bg-green-500/20 text-green-400",
  MATURE: "bg-emerald-500/20 text-emerald-400",
};

export default function VoicePage() {
  const { authenticated } = useRequireAuth();
  const workspaceId = useWorkspaceStore((s) => s.workspaceId);
  const [profile, setProfile] = useState<VoiceProfile | null>(null);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Load profile
  useEffect(() => {
    if (!workspaceId) return;
    apiFetch(`/api/voice-profiles/me?workspaceId=${workspaceId}`)
      .then((r) => r.json())
      .then((data) => setProfile(data))
      .catch(() => {});
  }, [workspaceId]);

  async function handleUpload(text: string) {
    if (!profile) return;
    setError("");
    setUploading(true);
    try {
      const res = await apiFetch(`/api/voice-profiles/${profile.id}/upload-sample`, {
        method: "POST",
        body: JSON.stringify({ content: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Upload failed");
      } else {
        setSamples((prev) => [data, ...prev]);
        // Refresh profile
        const pRes = await apiFetch(`/api/voice-profiles/me?workspaceId=${workspaceId}`);
        if (pRes.ok) setProfile(await pRes.json());
      }
    } catch {
      setError("Network error");
    }
    setUploading(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".txt")) {
      setError("Only .txt files are supported");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      handleUpload(text);
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (!file.name.endsWith(".txt")) {
      setError("Only .txt files are supported");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => handleUpload(reader.result as string);
    reader.readAsText(file);
  }

  if (!authenticated) return null;

  const maturityPct = profile ? Math.round(profile.maturityScore * 100) : 0;
  const stateClass = STATE_COLORS[profile?.confidenceState || "EMPTY"] || STATE_COLORS.EMPTY;

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-semibold text-white">Voice Profile</h1>

      {/* Profile Status Card */}
      <div className="rounded-lg border border-[--border] bg-[--bg-panel] p-5 space-y-4">
        <div className="flex items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${stateClass}`}>
            {profile?.confidenceState || "EMPTY"}
          </span>
          <span className="text-sm text-[--text-secondary]">
            {samples.filter((s) => s.accepted).length} accepted samples
          </span>
          <span className="text-sm text-[--text-muted]">
            {samples.reduce((sum, s) => sum + (s.accepted ? s.wordCount : 0), 0)} words
          </span>
        </div>

        {/* Maturity Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-[--text-muted]">
            <span>Maturity</span>
            <span>{maturityPct}%</span>
          </div>
          <div className="h-2 rounded-full bg-[--bg-secondary]">
            <div
              className="h-2 rounded-full transition-all"
              style={{
                width: `${maturityPct}%`,
                background: "var(--rainbow)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Upload Panel */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        className="cursor-pointer rounded-lg border-2 border-dashed border-[--border] bg-[--bg-panel] p-8 text-center transition-colors hover:border-[--primary]"
      >
        <input
          ref={fileRef}
          type="file"
          accept=".txt"
          onChange={handleFileChange}
          className="hidden"
        />
        {uploading ? (
          <p className="text-sm text-[--text-secondary]">Uploading...</p>
        ) : (
          <>
            <p className="text-sm text-[--text-secondary]">
              Drop a .txt file here or click to upload
            </p>
            <p className="mt-1 text-xs text-[--text-muted]">
              200+ words recommended for best results
            </p>
          </>
        )}
      </div>

      {error && (
        <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
      )}

      {/* Sample List */}
      {samples.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-white">Samples</h2>
          {samples.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-3 rounded-md border border-[--border] bg-[--bg-secondary] px-4 py-2"
            >
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  s.accepted
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {s.accepted ? "Accepted" : "Rejected"}
              </span>
              <span className="rounded bg-[--bg-panel] px-2 py-0.5 text-[10px] text-[--text-muted]">
                {s.wordCount} words
              </span>
              <span className="text-xs text-[--text-muted]">
                Quality: {Math.round(s.qualityScore * 100)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
