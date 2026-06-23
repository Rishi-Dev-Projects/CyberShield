import { create } from 'zustand';
import { SecurityContext } from './aiRules';

interface LayoutState {
  isAiOpen: boolean;
  activeContext: SecurityContext;
  toggleAi: () => void;
  setAiOpen: (open: boolean) => void;
  setContext: (ctx: Partial<SecurityContext>) => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
  isAiOpen: false,
  activeContext: { tool: 'dashboard' },
  toggleAi: () => set((state) => ({ isAiOpen: !state.isAiOpen })),
  setAiOpen: (open) => set({ isAiOpen: open }),
  setContext: (ctx) => set((state) => ({ 
    activeContext: { ...state.activeContext, ...ctx } as SecurityContext 
  })),
}));
