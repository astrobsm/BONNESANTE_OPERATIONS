import { create } from "zustand";

export type SyncState = "idle" | "syncing" | "error" | "offline";

interface SyncStoreState {
  syncState: SyncState;
  lastSyncTime: number | null;
  pendingCount: number;
  conflictCount: number;
  isOnline: boolean;
  errors: string[];

  setSyncing: () => void;
  setSynced: () => void;
  setSyncError: (error: string) => void;
  setOnline: (online: boolean) => void;
  setPendingCount: (count: number) => void;
  setConflictCount: (count: number) => void;
  clearErrors: () => void;
}

export const useSyncStore = create<SyncStoreState>()((set) => ({
  syncState: "idle",
  lastSyncTime: null,
  pendingCount: 0,
  conflictCount: 0,
  isOnline: navigator.onLine,
  errors: [],

  setSyncing: () => set({ syncState: "syncing" }),

  setSynced: () =>
    set({
      syncState: "idle",
      lastSyncTime: Date.now(),
      errors: [],
    }),

  setSyncError: (error) =>
    set((state) => ({
      syncState: "error",
      errors: [...state.errors.slice(-9), error],
    })),

  setOnline: (online) =>
    set({ isOnline: online, syncState: online ? "idle" : "offline" }),

  setPendingCount: (count) => set({ pendingCount: count }),

  setConflictCount: (count) => set({ conflictCount: count }),

  clearErrors: () => set({ errors: [] }),
}));

/* ── Register online/offline listeners globally ─────── */
if (typeof window !== "undefined") {
  window.addEventListener("online", () =>
    useSyncStore.getState().setOnline(true)
  );
  window.addEventListener("offline", () =>
    useSyncStore.getState().setOnline(false)
  );
}
