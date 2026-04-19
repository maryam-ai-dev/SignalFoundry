"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export interface QueuedHook {
  hookId?: string;
  id?: string;
  text: string;
  voiceMatch?: number;
  voiceState?: "CALIBRATED" | "DRAFT" | "OFF";
  voiceVersion?: string;
  status?: string;
}

function voiceTag(h: QueuedHook): { label: string; color: string } {
  const state = h.voiceState;
  const match = h.voiceMatch ?? 0;
  if (state === "CALIBRATED" || match >= 0.7) {
    return { label: `VOICE: Calibrated · ${h.voiceVersion || "v1"}`, color: "#7CFF6B" };
  }
  if (state === "DRAFT" || match >= 0.5) {
    return { label: "VOICE: Draft", color: "#FFAA40" };
  }
  return { label: "VOICE: Off", color: "rgba(255,255,255,0.5)" };
}

export default function HooksRow({ hooks }: { hooks: QueuedHook[] | null }) {
  const [extra, setExtra] = useState<QueuedHook[]>([]);
  const [appending, setAppending] = useState(false);

  if (!hooks || hooks.length === 0) {
    return <p className="text-xs text-[--text-muted]">No hooks queued.</p>;
  }

  const combined = [...hooks, ...extra];

  async function loadMore() {
    if (appending) return;
    setAppending(true);
    try {
      const res = await apiFetch(`/api/strategy/hooks?status=QUEUED&limit=3&offset=${combined.length}`);
      if (res.ok) {
        const data: QueuedHook[] = await res.json();
        setExtra((prev) => [...prev, ...(Array.isArray(data) ? data : [])]);
      }
    } catch {
      // best effort
    } finally {
      setAppending(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {combined.map((h, i) => (
          <HookCard key={h.hookId || h.id || i} hook={h} />
        ))}
      </div>
      <button
        onClick={loadMore}
        disabled={appending}
        className="text-[11px] text-[--text-muted] hover:text-white disabled:opacity-50"
      >
        {appending ? "Loading…" : "+3 more"}
      </button>
    </div>
  );
}

function HookCard({ hook }: { hook: QueuedHook }) {
  const [hovered, setHovered] = useState(false);
  const [toast, setToast] = useState<string>("");
  const [archived, setArchived] = useState(false);
  const tag = voiceTag(hook);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2000);
    return () => clearTimeout(t);
  }, [toast]);

  async function save() {
    try {
      await apiFetch("/api/swipe-file", {
        method: "POST",
        body: JSON.stringify({
          type: "HOOK",
          content: { text: hook.text, hookId: hook.hookId || hook.id },
        }),
      });
      setToast("Saved");
    } catch {
      setToast("Save failed");
    }
  }

  function toTypefully() {
    const url = `https://typefully.com/compose?text=${encodeURIComponent(hook.text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function toNotion() {
    const url = `https://www.notion.so/new?content=${encodeURIComponent(hook.text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function archive() {
    try {
      if (hook.hookId || hook.id) {
        await apiFetch(`/api/strategy/hooks/${hook.hookId || hook.id}/archive`, {
          method: "POST",
        });
      }
      setArchived(true);
    } catch {
      setToast("Archive failed");
    }
  }

  if (archived) return null;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex flex-col gap-2 rounded-lg border border-[--border] bg-[--bg-secondary] p-3"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "s" || e.key === "S") save();
        if (e.key === "t" || e.key === "T") toTypefully();
        if (e.key === "n" || e.key === "N") toNotion();
        if (e.key === "a" || e.key === "A") archive();
      }}
    >
      <p className="text-xs leading-relaxed text-[--text-secondary]">{hook.text}</p>
      <div className="flex items-center justify-between">
        <span
          className="font-mono text-[9px] uppercase tracking-wider"
          style={{ color: tag.color }}
        >
          {tag.label}
        </span>
        <div
          className={`flex gap-1 font-mono text-[8px] uppercase text-[--text-muted] transition-opacity ${
            hovered ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden={!hovered}
        >
          <button onClick={save} title="Save">S</button>
          <button onClick={toTypefully} title="Typefully">T</button>
          <button onClick={toNotion} title="Notion">N</button>
          <button onClick={archive} title="Archive">A</button>
        </div>
      </div>
      {toast && (
        <span className="absolute right-2 top-2 rounded bg-[--bg-panel] px-1.5 py-0.5 text-[9px] text-[--text-secondary]">
          {toast}
        </span>
      )}
    </div>
  );
}
