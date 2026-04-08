"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";

export function useRequireAuth() {
  const jwt = useAuthStore((s) => s.jwt);
  const router = useRouter();

  useEffect(() => {
    if (!jwt) {
      router.replace("/login");
    }
  }, [jwt, router]);

  return { authenticated: !!jwt };
}
