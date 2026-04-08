"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { apiFetch } from "@/lib/api";

export default function SetupPage() {
  const { authenticated } = useRequireAuth();
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [themes, setThemes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const setWorkspace = useWorkspaceStore((s) => s.setWorkspace);
  const router = useRouter();

  async function handleSetup() {
    setError("");
    setLoading(true);
    try {
      const keyThemes = themes
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await apiFetch("/api/workspaces", {
        method: "POST",
        body: JSON.stringify({
          name: productName,
          productName,
          productDescription,
          keyThemes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Setup failed");
        return;
      }
      setWorkspace(data.id, data);
      router.push("/dashboard");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (!authenticated) return null;

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-white">Set up your workspace</h1>
        <p className="text-sm text-[--text-muted]">Tell us about your product</p>
      </div>

      {error && (
        <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
      )}

      <div className="space-y-4">
        <input
          type="text"
          placeholder="Product name"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          className="w-full rounded-md border border-[--border] bg-[--bg-secondary] px-3 py-2 text-sm text-white placeholder:text-[--text-muted] focus:outline-none focus:ring-1 focus:ring-[--ring]"
        />
        <textarea
          placeholder="Product description"
          value={productDescription}
          onChange={(e) => setProductDescription(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-[--border] bg-[--bg-secondary] px-3 py-2 text-sm text-white placeholder:text-[--text-muted] focus:outline-none focus:ring-1 focus:ring-[--ring]"
        />
        <input
          type="text"
          placeholder="Key themes (comma separated)"
          value={themes}
          onChange={(e) => setThemes(e.target.value)}
          className="w-full rounded-md border border-[--border] bg-[--bg-secondary] px-3 py-2 text-sm text-white placeholder:text-[--text-muted] focus:outline-none focus:ring-1 focus:ring-[--ring]"
        />
        <button
          onClick={handleSetup}
          disabled={loading || !productName}
          className="w-full rounded-md bg-[--primary] px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Creating workspace..." : "Continue"}
        </button>
      </div>
    </div>
  );
}
