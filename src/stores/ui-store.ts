import { create } from "zustand";

type UiState = {
  sidebarOpen: boolean;
  commandOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setCommandOpen: (open: boolean) => void;
  toggleCommand: () => void;
};

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: false,
  commandOpen: false,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  toggleCommand: () => set((state) => ({ commandOpen: !state.commandOpen })),
}));
