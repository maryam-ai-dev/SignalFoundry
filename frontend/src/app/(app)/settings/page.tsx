"use client";

import { useRequireAuth } from "@/hooks/useRequireAuth";

export default function SettingsPage() {
  const { authenticated } = useRequireAuth();
  if (!authenticated) return null;

  return <h1 className="text-white text-2xl font-semibold">Settings</h1>;
}
