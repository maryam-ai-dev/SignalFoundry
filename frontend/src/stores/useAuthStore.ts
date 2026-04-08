import { create } from "zustand";

interface AuthState {
  jwt: string | null;
  userId: string | null;
  setAuth: (jwt: string, userId: string) => void;
  clearAuth: () => void;
}

function parseJwtPayload(token: string): { sub?: string } {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return {};
  }
}

export const useAuthStore = create<AuthState>((set) => {
  const stored =
    typeof window !== "undefined" ? localStorage.getItem("jwt") : null;
  const userId = stored ? parseJwtPayload(stored).sub ?? null : null;

  return {
    jwt: stored,
    userId,
    setAuth: (jwt: string, userId: string) => {
      localStorage.setItem("jwt", jwt);
      set({ jwt, userId });
    },
    clearAuth: () => {
      localStorage.removeItem("jwt");
      localStorage.removeItem("workspaceId");
      set({ jwt: null, userId: null });
    },
  };
});
