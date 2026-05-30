import { create } from 'zustand';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

interface UIState {
  sidebarOpen: boolean;
  toasts: Toast[];
  activeModal: string | null;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  setActiveModal: (modal: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toasts: [],
  activeModal: null,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  addToast: (toast) =>
    set((s) => ({
      toasts: [...s.toasts, { ...toast, id: Math.random().toString(36).slice(2) }],
    })),
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  setActiveModal: (activeModal) => set({ activeModal }),
}));
