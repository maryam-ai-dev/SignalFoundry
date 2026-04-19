"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";

const MIGRATION_CUTOFF = new Date("2025-11-01").getTime();
const WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

function readJwtIat(jwt: string | null): number | null {
  if (!jwt) return null;
  try {
    const payload = JSON.parse(atob(jwt.split(".")[1]));
    return typeof payload.iat === "number" ? payload.iat * 1000 : null;
  } catch {
    return null;
  }
}

export default function MigrationBanner() {
  const jwt = useAuthStore((s) => s.jwt);
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accountCreatedAt = readJwtIat(jwt);
    if (accountCreatedAt === null) return;
    if (accountCreatedAt < MIGRATION_CUTOFF) return;
    if (Date.now() - accountCreatedAt > WINDOW_MS) return;
    try {
      if (localStorage.getItem("sf_migration_dismissed") === "true") return;
    } catch {
      // localStorage unavailable — banner shows on every load, acceptable.
    }
    setVisible(true);
  }, [jwt]);

  if (!visible) return null;

  return (
    <div
      className="flex items-center justify-between rounded-lg border border-amber-500/30 px-4 py-3 text-sm text-amber-50"
      style={{
        background:
          "linear-gradient(90deg, rgba(255, 170, 64, 0.08) 0%, rgba(255, 89, 0, 0.04) 100%)",
      }}
    >
      <div className="flex items-center gap-3">
        <span
          className="inline-flex h-2 w-2 flex-shrink-0 rounded-full"
          style={{
            backgroundColor: "#FFAA40",
            animation: "sf-migration-pulse 1.6s ease-in-out infinite",
          }}
        />
        <span className="text-amber-100">
          Coming from GummySearch? Your Reddit signals are ready in 5 minutes — we handle the migration.
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.push("/settings#connectors")}
          className="rounded-md bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-100 hover:bg-amber-500/25"
        >
          Import signals →
        </button>
        <button
          onClick={() => {
            try {
              localStorage.setItem("sf_migration_dismissed", "true");
            } catch {}
            setVisible(false);
          }}
          aria-label="Dismiss"
          className="flex h-6 w-6 items-center justify-center rounded-md text-amber-200/70 hover:bg-amber-500/15 hover:text-amber-100"
        >
          ×
        </button>
      </div>
      <style>{`@keyframes sf-migration-pulse { 0%, 100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.3); } }`}</style>
    </div>
  );
}
