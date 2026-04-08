import { create } from "zustand";

interface WorkspaceState {
  workspaceId: string | null;
  workspace: Record<string, unknown> | null;
  setWorkspace: (id: string, workspace: Record<string, unknown>) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => {
  const stored =
    typeof window !== "undefined" ? localStorage.getItem("workspaceId") : null;

  return {
    workspaceId: stored,
    workspace: null,
    setWorkspace: (id: string, workspace: Record<string, unknown>) => {
      localStorage.setItem("workspaceId", id);
      set({ workspaceId: id, workspace });
    },
  };
});
