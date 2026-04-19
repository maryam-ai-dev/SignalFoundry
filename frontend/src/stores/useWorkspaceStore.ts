import { create } from "zustand";

export type AccountMode = "FOUNDER" | "INVESTOR";
export type DigestDay = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
export const DIGEST_DAYS: DigestDay[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

interface WorkspaceState {
  workspaceId: string | null;
  workspace: Record<string, unknown> | null;
  accountMode: AccountMode;
  digestDay: DigestDay;
  setWorkspace: (id: string, workspace: Record<string, unknown>) => void;
  setAccountMode: (mode: AccountMode) => void;
  setDigestDay: (day: DigestDay) => void;
}

function readStoredAccountMode(): AccountMode {
  if (typeof window === "undefined") return "FOUNDER";
  const raw = localStorage.getItem("sf_account_mode");
  return raw === "INVESTOR" ? "INVESTOR" : "FOUNDER";
}

function readStoredDigestDay(): DigestDay {
  if (typeof window === "undefined") return "MON";
  const raw = localStorage.getItem("sf_digest_day");
  return DIGEST_DAYS.includes(raw as DigestDay) ? (raw as DigestDay) : "MON";
}

export const useWorkspaceStore = create<WorkspaceState>((set) => {
  const stored =
    typeof window !== "undefined" ? localStorage.getItem("workspaceId") : null;

  return {
    workspaceId: stored,
    workspace: null,
    accountMode: readStoredAccountMode(),
    digestDay: readStoredDigestDay(),
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
    setDigestDay: (day: DigestDay) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("sf_digest_day", day);
      }
      set({ digestDay: day });
    },
  };
});
