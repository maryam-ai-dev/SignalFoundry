"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type CommandGroup = "Actions" | "Navigate" | "Settings";

export interface CommandItem {
  id: string;
  label: string;
  group: CommandGroup;
  run: () => void | Promise<void>;
  hint?: string;
  visible?: boolean;
}

interface PaletteContextValue {
  open: () => void;
  close: () => void;
  register: (items: CommandItem[]) => () => void;
}

const PaletteContext = createContext<PaletteContextValue | null>(null);

export function useCommandPalette() {
  const ctx = useContext(PaletteContext);
  if (!ctx) throw new Error("CommandPalette provider missing");
  return ctx;
}

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [items, setItems] = useState<CommandItem[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const register = useCallback((toAdd: CommandItem[]) => {
    setItems((prev) => {
      const existingIds = new Set(toAdd.map((c) => c.id));
      return [...prev.filter((c) => !existingIds.has(c.id)), ...toAdd];
    });
    return () => {
      const ids = new Set(toAdd.map((c) => c.id));
      setItems((prev) => prev.filter((c) => !ids.has(c.id)));
    };
  }, []);

  const openPalette = useCallback(() => {
    setQuery("");
    setActiveIndex(0);
    setOpen(true);
  }, []);

  const closePalette = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        const target = e.target as HTMLElement | null;
        if (isEditable(target) && !open) return;
        e.preventDefault();
        if (open) closePalette();
        else openPalette();
      } else if (e.key === "Escape" && open) {
        closePalette();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, openPalette, closePalette]);

  useEffect(() => {
    if (open) {
      const id = setTimeout(() => inputRef.current?.focus(), 10);
      return () => clearTimeout(id);
    }
  }, [open]);

  const visibleItems = useMemo(
    () => items.filter((c) => c.visible !== false),
    [items]
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return visibleItems;
    const q = query.toLowerCase();
    return visibleItems.filter((c) => c.label.toLowerCase().includes(q));
  }, [visibleItems, query]);

  const grouped = useMemo(() => {
    const order: CommandGroup[] = ["Actions", "Navigate", "Settings"];
    return order
      .map((g) => ({ group: g, items: filtered.filter((c) => c.group === g) }))
      .filter((g) => g.items.length > 0);
  }, [filtered]);

  const flatIndexOf = useCallback(
    (item: CommandItem) => filtered.findIndex((c) => c.id === item.id),
    [filtered]
  );

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const cmd = filtered[activeIndex];
      if (cmd) {
        closePalette();
        void cmd.run();
      }
    }
  }

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const value = useMemo(
    () => ({ open: openPalette, close: closePalette, register }),
    [openPalette, closePalette, register]
  );

  return (
    <PaletteContext.Provider value={value}>
      {children}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-6 pt-32"
          onClick={closePalette}
        >
          <div
            className="w-full max-w-xl overflow-hidden rounded-lg border border-[--border] bg-[--bg-panel] shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder="Type a command or search…"
              className="w-full border-b border-[--border] bg-[--bg-panel] px-4 py-3 text-sm text-white placeholder:text-[--text-muted] focus:outline-none"
            />
            <div className="max-h-80 overflow-y-auto py-2">
              {grouped.length === 0 ? (
                <p className="px-4 py-6 text-center text-xs text-[--text-muted]">
                  No commands found
                </p>
              ) : (
                grouped.map((g) => (
                  <div key={g.group} className="py-1">
                    <p className="px-4 py-1 font-mono text-[9px] uppercase tracking-wider text-[--text-muted]">
                      {g.group}
                    </p>
                    {g.items.map((cmd) => {
                      const idx = flatIndexOf(cmd);
                      const isActive = idx === activeIndex;
                      return (
                        <button
                          key={cmd.id}
                          onMouseEnter={() => setActiveIndex(idx)}
                          onClick={() => {
                            closePalette();
                            void cmd.run();
                          }}
                          className="flex w-full items-center justify-between px-4 py-1.5 text-left text-sm"
                          style={{
                            backgroundColor: isActive ? "var(--bg-secondary)" : "transparent",
                            color: isActive ? "#fff" : "var(--text-secondary)",
                          }}
                        >
                          <span>{cmd.label}</span>
                          {cmd.hint && (
                            <span className="font-mono text-[10px] text-[--text-muted]">
                              {cmd.hint}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-[--border] px-4 py-1.5 font-mono text-[9px] uppercase tracking-wider text-[--text-muted]">
              ↑↓ Navigate · ↵ Select · Esc Close
            </div>
          </div>
        </div>
      )}
    </PaletteContext.Provider>
  );
}

function isEditable(el: HTMLElement | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return true;
  if (el.isContentEditable) return true;
  return false;
}
