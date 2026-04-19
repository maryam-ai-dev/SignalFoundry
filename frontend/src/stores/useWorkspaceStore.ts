import { create } from "zustand";

export type AccountMode = "FOUNDER" | "INVESTOR";

interface WorkspaceState {
  workspaceId: string | null;
  workspace: Record<string, unknown> | null;
  accountMode: AccountMode;
  setWorkspace: (id: string, workspace: Record<string, unknown>) => void;
  setAccountMode: (mode: AccountMode) => void;
}

function readStoredAccountMode(): AccountMode {
  if (typeof window === "undefined") return "FOUNDER";
  const raw = localStorage.getItem("sf_account_mode");
  return raw === "INVESTOR" ? "INVESTOR" : "FOUNDER";
}

export const useWorkspaceStore = create<WorkspaceState>((set) => {
  const stored =
    typeof window !== "undefined" ? localStorage.getItem("workspaceId") : null;

  return {
    workspaceId: stored,
    workspace: null,
    accountMode: readStoredAccountMode(),
    setWorkspace: (id: string, workspace: Record<string, unknown>) => {
      localStorage.setItem("workspaceId", id);
      set({ workspaceId: id, workspace });
    },
    setAccountMode: (mode: AccountMode) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("sf_account_mode", mode);
      }
      set({ accountMode: mode });
    },
  };
});
