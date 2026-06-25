import { create } from 'zustand';
import { SecurityContext } from './aiRules';

interface LayoutState {
  isAiOpen: boolean;
  isSidebarOpen: boolean;
  activeContext: SecurityContext;
  toggleAi: () => void;
  setAiOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setContext: (ctx: Partial<SecurityContext>) => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
  isAiOpen: false,
  isSidebarOpen: false,
  activeContext: { tool: 'dashboard' },
  toggleAi: () => set((state) => ({ isAiOpen: !state.isAiOpen })),
  setAiOpen: (open) => set({ isAiOpen: open }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  setContext: (ctx) => set((state) => ({ 
    activeContext: { ...state.activeContext, ...ctx } as SecurityContext 
  })),
}));
