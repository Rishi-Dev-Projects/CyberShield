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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  initialize: async () => {
    set({ isLoading: true });
    try {
      if (isSupabaseConfigured()) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            const activeUser: UserProfile = {
              id: profile.id,
              username: profile.username,
              email: profile.email,
              role: profile.role,
              isActive: profile.is_active,
              createdAt: profile.created_at
            };
            set({
              user: activeUser,
              isAuthenticated: true,
            });
            localStorage.setItem('demo_user', JSON.stringify(activeUser));
            set({ isLoading: false });
            return;
          }
        }
      } else {
        // Mock offline session check from localStorage
        const storedUser = localStorage.getItem('demo_user');
        if (storedUser) {
          set({
            user: JSON.parse(storedUser),
            isAuthenticated: true,
          });
        }
      }
    } catch (err) {
      console.error('Session restoration failed:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password
        });

        if (error) throw error;
        if (!data.user) throw new Error('No user returned from Supabase.');

        let { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        const activeUser: UserProfile = {
          id: data.user.id,
          username: profile?.username || data.user.email?.split('@')[0] || 'analyst',
          email: data.user.email || '',
          role: profile?.role || (credentials.email.includes('admin') ? 'ADMIN' : credentials.email.includes('analyst') ? 'SECURITY_ANALYST' : 'STUDENT'),
          isActive: true,
          createdAt: profile?.created_at || new Date().toISOString()
        };

        localStorage.setItem('demo_user', JSON.stringify(activeUser));
        set({ user: activeUser, isAuthenticated: true, isLoading: false });
        return activeUser;
      } else {
        // Standalone offline mock login
        const email = credentials.email.toLowerCase();
        let role: 'ADMIN' | 'SECURITY_ANALYST' | 'STUDENT' = 'STUDENT';
        let username = email.split('@')[0];

        if (email.includes('admin')) {
          role = 'ADMIN';
        } else if (email.includes('analyst')) {
          role = 'SECURITY_ANALYST';
        }

        const mockUser: UserProfile = {
          id: Math.random().toString(),
          username,
          email,
          role,
          isActive: true,
          createdAt: new Date().toISOString()
        };

        localStorage.setItem('demo_user', JSON.stringify(mockUser));
        set({ user: mockUser, isAuthenticated: true, isLoading: false });
        return mockUser;
      }
    } catch (err: any) {
      const errMsg = err.message || 'Login failed.';
      set({ error: errMsg, isLoading: false });
      throw new Error(errMsg);
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      if (isSupabaseConfigured()) {
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email: data.email,
          password: data.password
        });

        if (signUpErr) throw signUpErr;
        if (!signUpData.user) throw new Error('Failed to sign up.');

        await supabase
          .from('profiles')
          .insert([
            {
              id: signUpData.user.id,
              username: data.username,
              email: data.email,
              role: data.role || 'STUDENT',
              is_active: true
            }
          ]);
      } else {
        // Standalone mock registration
        const mockUser: UserProfile = {
          id: Math.random().toString(),
          username: data.username,
          email: data.email,
          role: (data.role || 'STUDENT') as any,
          isActive: true,
          createdAt: new Date().toISOString()
        };
        localStorage.setItem('demo_user', JSON.stringify(mockUser));
      }
      set({ isLoading: false });
    } catch (err: any) {
      const errMsg = err.message || 'Registration failed.';
      set({ error: errMsg, isLoading: false });
      throw new Error(errMsg);
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('Signout error:', err);
    } finally {
      localStorage.removeItem('demo_user');
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });

      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  },
}));
