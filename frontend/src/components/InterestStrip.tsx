"use client";

import { useEffect, useState } from "react";

interface InterestStripProps {
  workspaceId: string | null;
  onChange?: (interests: string[]) => void;
}

function readInterests(workspaceId: string | null): string[] {
  if (!workspaceId || typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`sf_interests_${workspaceId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function writeInterests(workspaceId: string, interests: string[]) {
  try {
    localStorage.setItem(`sf_interests_${workspaceId}`, JSON.stringify(interests));
  } catch {
    // ignore
  }
}

export default function InterestStrip({ workspaceId, onChange }: InterestStripProps) {
  const [interests, setInterests] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    const list = readInterests(workspaceId);
    setInterests(list);
    setHydrated(true);
  }, [workspaceId]);

  useEffect(() => {
    if (hydrated) onChange?.(interests);
  }, [interests, hydrated, onChange]);

  function save() {
    const parsed = draft
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (workspaceId) writeInterests(workspaceId, parsed);
    setInterests(parsed);
    setEditing(false);
  }

  function openEdit() {
    setDraft(interests.join(", "));
    setEditing(true);
  }

  if (!hydrated) return null;

  if (interests.length === 0) {
    return (
      <>
        <div className="flex items-center justify-between rounded-md border border-amber-500/30 bg-amber-500/5 px-4 py-2 text-xs text-amber-100">
          <span>Interests not configured — add them to filter signals</span>
          <button
            onClick={openEdit}
            className="rounded bg-amber-500/20 px-2 py-0.5 text-[11px] font-medium text-amber-100 hover:bg-amber-500/30"
          >
            Set up →
          </button>
        </div>
        {editing && <EditModal draft={draft} setDraft={setDraft} onSave={save} onClose={() => setEditing(false)} />}
      </>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 rounded-md border border-purple-500/20 bg-purple-500/5 px-4 py-2 text-xs">
        <span className="text-[--text-muted]">Filtered for:</span>
        {interests.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[11px] font-medium text-purple-300"
          >
            {tag}
          </span>
        ))}
        <button
          onClick={openEdit}
          className="ml-auto text-[11px] text-[--text-muted] hover:text-white"
        >
          Edit
        </button>
      </div>
      {editing && <EditModal draft={draft} setDraft={setDraft} onSave={save} onClose={() => setEditing(false)} />}
    </>
  );
}

function EditModal({
  draft,
  setDraft,
  onSave,
  onClose,
}: {
  draft: string;
  setDraft: (s: string) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md space-y-4 rounded-lg border border-[--border] bg-[--bg-panel] p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-white">Interest profile</h2>
        <p className="text-xs text-[--text-muted]">
          Comma-separated tags. Signals will be filtered and matched against these.
        </p>
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="e.g. distribution, pricing, onboarding"
          className="w-full rounded-md border border-[--border] bg-[--bg-secondary] px-3 py-2 text-sm text-white placeholder:text-[--text-muted] focus:outline-none focus:ring-1 focus:ring-[--ring]"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-[--border] bg-[--bg-secondary] px-3 py-1.5 text-xs text-[--text-secondary] hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="rounded-md bg-[--primary] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
