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
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  clearError: () => set({ error: null }),

  initialize: async () => {
    set({ isLoading: true });
    try {
      if (isSupabaseConfigured()) {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (session && session.user) {
          const { data: profile, error: profileErr } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          let activeProfile: UserProfile;
          if (!profileErr && profile) {
            activeProfile = profile;
          } else {
            const meta = session.user.user_metadata || {};
            activeProfile = {
              id: session.user.id,
              username: meta.username || session.user.email?.split('@')[0] || 'user',
              email: session.user.email || '',
              role: meta.role || 'STUDENT',
              isActive: true,
              createdAt: session.user.created_at || new Date().toISOString()
            };
            try {
              await supabase.from('profiles').insert([activeProfile]);
            } catch (e) {
              console.error('Failed to auto-insert profile:', e);
            }
          }
          if (typeof window !== 'undefined') {
            localStorage.setItem('demo_user', JSON.stringify(activeProfile));
          }
          set({ user: activeProfile, isAuthenticated: true, isLoading: false });
        } else {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('demo_user');
          }
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      } else {
        const storedUser = typeof window !== 'undefined' ? localStorage.getItem('demo_user') : null;
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            set({ user: parsed, isAuthenticated: true, isLoading: false });
          } catch {
            set({ user: null, isAuthenticated: false, isLoading: false });
          }
        } else {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      }
    } catch (err: any) {
      console.error('Session restoration failed:', err);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('demo_user');
      }
      set({ user: null, isAuthenticated: false, error: err.message || 'Session recovery failed.', isLoading: false });
    } finally {
      set({ isLoading: false });
    }
  },

  login: async ({ email, password }) => {
    set({ isLoading: true, error: null });
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (!data.user) throw new Error('No user returned after authentication.');

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        const activeProfile: UserProfile = profile || {
          id: data.user.id,
          username: data.user.user_metadata?.username || email.split('@')[0] || 'user',
          email: data.user.email || email,
          role: data.user.user_metadata?.role || 'STUDENT',
          isActive: true,
          createdAt: data.user.created_at || new Date().toISOString()
        };

        if (typeof window !== 'undefined') {
          localStorage.setItem('demo_user', JSON.stringify(activeProfile));
        }
        set({ user: activeProfile, isAuthenticated: true, isLoading: false });
        return activeProfile;
      } else {
        const localUsersStr = typeof window !== 'undefined' ? localStorage.getItem('cybershield_local_users') || '[]' : '[]';
        const localUsers = JSON.parse(localUsersStr);
        const found = localUsers.find((u: any) => u.email === email && u.password === password);

        if (!found) {
          throw new Error('Invalid email or password security credentials.');
        }

        const userProfile: UserProfile = {
          id: found.id,
          username: found.username,
          email: found.email,
          role: found.role,
          isActive: found.isActive,
          createdAt: found.createdAt
        };

        if (typeof window !== 'undefined') {
          localStorage.setItem('demo_user', JSON.stringify(userProfile));
        }
        set({ user: userProfile, isAuthenticated: true, isLoading: false });
        return userProfile;
      }
    } catch (err: any) {
      set({ error: err.message || 'Authentication failed.', isLoading: false });
      throw err;
    }
  },

  register: async ({ username, email, password, role }) => {
    set({ isLoading: true, error: null });
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username,
              role: role || 'STUDENT'
            }
          }
        });
        if (error) throw error;
        if (!data.user) throw new Error('No user returned after registration.');

        const profile = {
          id: data.user.id,
          username,
          email,
          role: role || 'STUDENT',
          isActive: true,
          createdAt: new Date().toISOString()
        };

        try {
          const { error: insertErr } = await supabase.from('profiles').insert([profile]);
          if (insertErr) console.error('Failed to create profile row:', insertErr);
        } catch (e) {
          console.error('Failed to insert profiles record:', e);
        }
        set({ isLoading: false });
      } else {
        const localUsersStr = typeof window !== 'undefined' ? localStorage.getItem('cybershield_local_users') || '[]' : '[]';
        const localUsers = JSON.parse(localUsersStr);

        if (localUsers.some((u: any) => u.email === email)) {
          throw new Error('Identity email is already enrolled in the console.');
        }

        const newUser = {
          id: 'local-' + Math.random().toString(36).substring(2, 11) + Math.random().toString(36).substring(2, 11),
          username,
          email,
          password,
          role: role || 'STUDENT',
          isActive: true,
          createdAt: new Date().toISOString()
        };

        localUsers.push(newUser);
        if (typeof window !== 'undefined') {
          localStorage.setItem('cybershield_local_users', JSON.stringify(localUsers));
        }
        set({ isLoading: false });
      }
    } catch (err: any) {
      set({ error: err.message || 'Enrollment failed.', isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.error('Signout error:', e);
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('demo_user');
    }
    set({ user: null, isAuthenticated: false, isLoading: false });
  },
}));
