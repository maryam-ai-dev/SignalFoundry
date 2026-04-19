"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export type SlotName = "angle" | "opener" | "proof";

const SLOT_ORDER: SlotName[] = ["angle", "opener", "proof"];

export interface HookCardData {
  id: string;
  slots: Record<SlotName, string>;
  voiceMatch: number | null;
  voiceRef: string | null;
  draft: boolean;
}

export function newBlankCard(id: string): HookCardData {
  return {
    id,
    slots: { angle: "", opener: "", proof: "" },
    voiceMatch: null,
    voiceRef: null,
    draft: true,
  };
}

interface HookSlotCardProps {
  card: HookCardData;
  onChange: (card: HookCardData) => void;
  onRemove: (id: string) => void;
  regenerate: (locked: Record<SlotName, boolean>, card: HookCardData) => Promise<HookCardData | null>;
  onToast: (msg: string) => void;
  onSaved?: (card: HookCardData) => void;
  onShipped?: (card: HookCardData) => void;
  onArchived?: (card: HookCardData) => void;
  onDirtyChange?: (id: string, dirty: boolean) => void;
}

function voiceLine(card: HookCardData): { text: string; color: string } {
  if (card.draft || card.voiceMatch === null) {
    return { text: "VOICE: Draft — calibrating", color: "#FFAA40" };
  }
  const pct = Math.round(card.voiceMatch * 100);
  if (card.voiceMatch >= 0.7) {
    const ref = card.voiceRef ? ` · similar to ${card.voiceRef}` : "";
    return { text: `VOICE: ${pct}% match${ref}`, color: "#7CFF6B" };
  }
  if (card.voiceMatch >= 0.5) {
    return { text: `VOICE: ${pct}% match — check tone`, color: "#FFAA40" };
  }
  return { text: `VOICE: ${pct}% match — off voice`, color: "#FF4444" };
}

export default function HookSlotCard({
  card,
  onChange,
  onRemove,
  regenerate,
  onToast,
  onSaved,
  onShipped,
  onArchived,
  onDirtyChange,
}: HookSlotCardProps) {
  const [locks, setLocks] = useState<Record<SlotName, boolean>>({
    angle: false,
    opener: false,
    proof: false,
  });
  const [regenerating, setRegenerating] = useState(false);
  const [saved, setSaved] = useState(false);
  const [archived, setArchived] = useState(false);
  const [hovered, setHovered] = useState(false);

  const markDirty = (v: boolean) => {
    onDirtyChange?.(card.id, v);
  };

  useEffect(() => {
    return () => {
      onDirtyChange?.(card.id, false);
    };
  }, [card.id, onDirtyChange]);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(t);
  }, [saved]);

  if (archived) return null;

  const voice = voiceLine(card);

  function toggleLock(slot: SlotName) {
    setLocks((prev) => ({ ...prev, [slot]: !prev[slot] }));
  }

  async function regen() {
    if (regenerating) return;
    const allLocked = SLOT_ORDER.every((s) => locks[s]);
    if (allLocked) {
      onToast("Unlock at least one slot.");
      return;
    }
    setRegenerating(true);
    try {
      const next = await regenerate(locks, card);
      if (next) {
        const merged = { ...card, ...next, slots: { ...card.slots } };
        for (const slot of SLOT_ORDER) {
          merged.slots[slot] = locks[slot] ? card.slots[slot] : next.slots[slot];
        }
        onChange(merged);
        markDirty(true);
      } else {
        onToast("Regenerate failed — card preserved.");
      }
    } finally {
      setRegenerating(false);
    }
  }

  async function save() {
    try {
      const text = SLOT_ORDER.map((s) => card.slots[s]).filter(Boolean).join("\n\n");
      const res = await apiFetch("/api/swipe-file", {
        method: "POST",
        body: JSON.stringify({
          type: "HOOK",
          content: { text, hookId: card.id, slots: card.slots },
        }),
      });
      if (!res.ok) throw new Error("save failed");
      setSaved(true);
      markDirty(false);
      onSaved?.(card);
    } catch {
      onToast("Save failed");
    }
  }

  async function ship() {
    const text = SLOT_ORDER.map((s) => card.slots[s]).filter(Boolean).join("\n\n");
    const url = `https://typefully.com/compose?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    try {
      await apiFetch("/api/swipe-file", {
        method: "POST",
        body: JSON.stringify({
          type: "HOOK",
          status: "SHIPPED",
          content: { text, hookId: card.id, slots: card.slots },
        }),
      });
    } catch {
      // best-effort — local shipped record still kept by caller
    }
    markDirty(false);
    onShipped?.(card);
  }

  function toNotion() {
    const text = SLOT_ORDER.map((s) => card.slots[s]).filter(Boolean).join("\n\n");
    const url = `https://www.notion.so/new?content=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function archive() {
    setArchived(true);
    markDirty(false);
    onArchived?.(card);
    onRemove(card.id);
  }

  return (
    <article
      tabIndex={0}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onKeyDown={(e) => {
        if ((e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "TEXTAREA") return;
        if (e.key === "s" || e.key === "S") { e.preventDefault(); save(); }
        if (e.key === "t" || e.key === "T") { e.preventDefault(); ship(); }
        if (e.key === "n" || e.key === "N") { e.preventDefault(); toNotion(); }
        if (e.key === "a" || e.key === "A") { e.preventDefault(); archive(); }
        if (e.key === "r" || e.key === "R") { e.preventDefault(); regen(); }
      }}
      className="relative space-y-3 rounded-lg border border-[--border] bg-[--bg-panel] p-4"
    >
      <div className="space-y-2">
        {SLOT_ORDER.map((slot) => (
          <SlotRow
            key={slot}
            name={slot}
            locked={locks[slot]}
            value={card.slots[slot]}
            onToggleLock={() => toggleLock(slot)}
            onChangeValue={(v) => {
              onChange({ ...card, slots: { ...card.slots, [slot]: v } });
              markDirty(true);
            }}
          />
        ))}
      </div>

      <div className="flex items-center justify-between">
        <span
          className="font-mono text-[8px] uppercase tracking-wider"
          style={{ color: voice.color }}
        >
          {voice.text}
        </span>
        <div
          className={`flex items-center gap-1 text-[9px] font-mono uppercase text-[--text-muted] transition-opacity ${
            hovered ? "opacity-100" : "opacity-0"
          }`}
        >
          <ActionKey onClick={save} label="S" title="Save" />
          <ActionKey onClick={ship} label="T" title="Typefully" />
          <ActionKey onClick={toNotion} label="N" title="Notion" />
          <ActionKey onClick={archive} label="A" title="Archive" />
          <ActionKey onClick={regen} label="R" title="Regenerate" disabled={regenerating} />
        </div>
      </div>

      {regenerating && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-[--bg-panel]/80 text-xs text-[--text-muted]">
          Regenerating…
        </div>
      )}

      {saved && (
        <span className="absolute right-2 top-2 rounded bg-green-500/20 px-1.5 py-0.5 text-[9px] text-green-300">
          Saved
        </span>
      )}
    </article>
  );
}

function SlotRow({
  name,
  locked,
  value,
  onToggleLock,
  onChangeValue,
}: {
  name: SlotName;
  locked: boolean;
  value: string;
  onToggleLock: () => void;
  onChangeValue: (v: string) => void;
}) {
  return (
    <div
      className="flex gap-2 rounded-md border p-2 transition-colors"
      style={{
        borderColor: locked ? "#9B5CFF" : "var(--border)",
        backgroundColor: locked ? "rgba(155,92,255,0.08)" : "var(--bg-secondary)",
      }}
    >
      <button
        type="button"
        onClick={onToggleLock}
        aria-label={locked ? `Unlock ${name}` : `Lock ${name}`}
        className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-[10px]"
        style={{
          color: locked ? "#9B5CFF" : "var(--text-muted)",
        }}
      >
        {locked ? "🔒" : "🔓"}
      </button>
      <div className="flex-1 space-y-1">
        <label className="font-mono text-[8px] uppercase tracking-wide text-[--text-muted]">
          {name}
        </label>
        <textarea
          value={value}
          onChange={(e) => onChangeValue(e.target.value)}
          rows={2}
          className="w-full resize-none bg-transparent text-[12px] leading-snug text-white placeholder:text-[--text-muted] focus:outline-none"
          placeholder={`Type the ${name}…`}
        />
      </div>
    </div>
  );
}

function ActionKey({
  label,
  title,
  onClick,
  disabled,
}: {
  label: string;
  title: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="rounded border border-[--border] px-1.5 py-0.5 hover:bg-[--bg-secondary] disabled:opacity-40"
    >
      {label}
    </button>
  );
}
