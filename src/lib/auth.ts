import { create } from 'zustand';
import { supabase } from './supabase';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'SECURITY_ANALYST' | 'STUDENT';
  isActive: boolean;
  createdAt: string;
}

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: { email: string; password: string }) => Promise<UserProfile>;
  register: (data: { username: string; email: string; password: string; role?: string }) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  initialize: () => Promise<void>;
}

const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return url && !url.includes('placeholder-project');
};

const defaultAdmin: UserProfile = {
  id: 'admin-id',
  username: 'administrator',
  email: 'admin@cybershield.local',
  role: 'ADMIN',
  isActive: true,
  createdAt: '2026-06-25T11:36:00Z'
};

export const useAuthStore = create<AuthState>((set) => ({
  user: defaultAdmin,
  isAuthenticated: true,
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  initialize: async () => {
    set({ isLoading: true });
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('demo_user', JSON.stringify(defaultAdmin));
      }
      set({
        user: defaultAdmin,
        isAuthenticated: true,
        isLoading: false
      });
    } catch (err) {
      console.error('Session restoration failed:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  login: async () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('demo_user', JSON.stringify(defaultAdmin));
    }
    set({ user: defaultAdmin, isAuthenticated: true, isLoading: false });
    return defaultAdmin;
  },

  register: async () => {
    set({ isLoading: false });
  },

  logout: async () => {
    // No-op for direct admin access
    set({ isLoading: false });
  },
}));
