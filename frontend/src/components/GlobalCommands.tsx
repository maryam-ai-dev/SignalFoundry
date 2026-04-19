"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCommandPalette, type CommandItem } from "@/components/CommandPalette";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { apiFetch } from "@/lib/api";

interface Workspace {
  id?: string;
  workspaceId?: string;
  name?: string;
}

export default function GlobalCommands() {
  const router = useRouter();
  const { register } = useCommandPalette();
  const accountMode = useWorkspaceStore((s) => s.accountMode);
  const workspaceId = useWorkspaceStore((s) => s.workspaceId);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [lastRunId, setLastRunId] = useState<string | null>(null);

  useEffect(() => {
    apiFetch(`/api/workspaces`)
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data)) setWorkspaces(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!workspaceId) return;
    apiFetch(`/api/research/runs?workspaceId=${workspaceId}&limit=1`)
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setLastRunId(data[0].runId || null);
        }
      })
      .catch(() => {});
  }, [workspaceId]);

  const isInvestor = accountMode === "INVESTOR";

  const items = useMemo<CommandItem[]>(() => {
    const list: CommandItem[] = [
      {
        id: "action.start-scan",
        group: "Actions",
        label: "Start research scan",
        run: () => router.push("/research?mode=SCAN"),
      },
      {
        id: "action.validate-idea",
        group: "Actions",
        label: "Validate an idea",
        run: () => router.push("/research?mode=VALIDATE"),
      },
      {
        id: "action.new-hook-session",
        group: "Actions",
        label: "New hook session",
        run: () => router.push("/studio"),
      },
      {
        id: "action.add-writing-sample",
        group: "Actions",
        label: "Add writing sample",
        visible: !isInvestor,
        run: () => router.push("/settings#voice"),
      },
      {
        id: "action.activate-campaign",
        group: "Actions",
        label: "Activate campaign",
        run: async () => {
          try {
            const res = await apiFetch(`/api/campaigns?workspaceId=${workspaceId}`);
            if (!res.ok) {
              router.push("/settings#campaigns");
              return;
            }
            const data = await res.json();
            if (!Array.isArray(data) || data.length === 0) {
              router.push("/settings#campaigns");
              return;
            }
            router.push("/settings#campaigns");
          } catch {
            router.push("/settings#campaigns");
          }
        },
      },

      {
        id: "nav.today",
        group: "Navigate",
        label: "Today",
        hint: "↵",
        run: () => router.push("/today"),
      },
      {
        id: "nav.research",
        group: "Navigate",
        label: "Research",
        run: () => router.push("/research"),
      },
      {
        id: "nav.studio",
        group: "Navigate",
        label: "Studio",
        run: () => router.push("/studio"),
      },
      {
        id: "nav.vault",
        group: "Navigate",
        label: "Vault",
        run: () => router.push("/vault"),
      },
      {
        id: "nav.settings",
        group: "Navigate",
        label: "Settings",
        run: () => router.push("/settings"),
      },
      {
        id: "nav.last-run",
        group: "Navigate",
        label: "Last research run",
        visible: Boolean(lastRunId),
        run: () => {
          if (lastRunId) router.push(`/research/runs/${lastRunId}`);
        },
      },

      {
        id: "settings.workspace",
        group: "Settings",
        label: "Workspace settings",
        run: () => router.push("/settings#workspace"),
      },
      {
        id: "settings.connectors",
        group: "Settings",
        label: "Connectors",
        run: () => router.push("/settings#connectors"),
      },
      {
        id: "settings.voice",
        group: "Settings",
        label: "Voice profile",
        visible: !isInvestor,
        run: () => router.push("/settings#voice"),
      },
      {
        id: "settings.campaigns",
        group: "Settings",
        label: "Campaigns",
        run: () => router.push("/settings#campaigns"),
      },
      {
        id: "settings.refresh",
        group: "Settings",
        label: "Scheduled refresh",
        run: () => router.push("/settings#refresh"),
      },
      {
        id: "settings.digest",
        group: "Settings",
        label: "Digest settings",
        run: () => router.push("/settings#digest"),
      },
    ];

    for (const w of workspaces.slice(0, 20)) {
      const wid = w.id || w.workspaceId;
      if (!wid) continue;
      list.push({
        id: `action.switch-workspace.${wid}`,
        group: "Actions",
        label: `Switch workspace: ${w.name || wid.slice(0, 8)}`,
        run: async () => {
          try {
            const res = await apiFetch(`/api/workspaces/${wid}`);
            if (res.ok) {
              const data = await res.json();
              useWorkspaceStore.getState().setWorkspace(wid, data);
              router.push("/today");
            }
          } catch {}
        },
      });
    }

    return list;
  }, [router, isInvestor, lastRunId, workspaces, workspaceId]);

  useEffect(() => {
    const unregister = register(items);
    return unregister;
  }, [items, register]);

  return null;
}
