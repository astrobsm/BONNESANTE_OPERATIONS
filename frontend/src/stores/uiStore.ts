import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  currentPageTitle: string;
  notifications: Notification[];
  modal: { open: boolean; component: string | null; props?: Record<string, unknown> };

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapse: () => void;
  setPageTitle: (title: string) => void;
  addNotification: (notification: Omit<Notification, "id" | "timestamp">) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  openModal: (component: string, props?: Record<string, unknown>) => void;
  closeModal: () => void;
}

interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  timestamp: number;
  duration?: number;
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: true,
  sidebarCollapsed: false,
  currentPageTitle: "Dashboard",
  notifications: [],
  modal: { open: false, component: null },

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebarCollapse: () =>
    set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  setPageTitle: (title) => set({ currentPageTitle: title }),

  addNotification: (notification) =>
    set((s) => ({
      notifications: [
        ...s.notifications,
        {
          ...notification,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
        },
      ],
    })),

  removeNotification: (id) =>
    set((s) => ({
      notifications: s.notifications.filter((n) => n.id !== id),
    })),

  clearNotifications: () => set({ notifications: [] }),

  openModal: (component, props) =>
    set({ modal: { open: true, component, props } }),

  closeModal: () => set({ modal: { open: false, component: null } }),
}));
