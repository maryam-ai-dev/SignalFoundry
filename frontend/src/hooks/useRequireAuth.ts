"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  useWorkspaceStore,
  DIGEST_DAYS,
  type AccountMode,
  type DigestDay,
} from "@/stores/useWorkspaceStore";
import { apiFetch } from "@/lib/api";

export function useRequireAuth() {
  const jwt = useAuthStore((s) => s.jwt);
  const setAccountMode = useWorkspaceStore((s) => s.setAccountMode);
  const setDigestDay = useWorkspaceStore((s) => s.setDigestDay);
  const router = useRouter();

  useEffect(() => {
    if (!jwt) {
      router.replace("/login");
      return;
    }

    let cancelled = false;
    apiFetch("/api/auth/me")
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (data?.accountMode === "FOUNDER" || data?.accountMode === "INVESTOR") {
          setAccountMode(data.accountMode as AccountMode);
        } else if (data && !data.accountMode) {
          console.warn("auth/me: accountMode missing, defaulting to FOUNDER");
        }
        if (DIGEST_DAYS.includes(data?.digestDay)) {
          setDigestDay(data.digestDay as DigestDay);
        }
      })
      .catch(() => {
        // Network failure — accountMode already hydrated from localStorage fallback.
      });

    return () => {
      cancelled = true;
    };
  }, [jwt, router, setAccountMode, setDigestDay]);

  return { authenticated: !!jwt };
}
