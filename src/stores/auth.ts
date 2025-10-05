import { create } from 'zustand';
import { supabase, getCurrentUser, signOut } from '@/lib/supabase';
import { AuthStore, User } from '@/types/auth';

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  user: null,
  loading: false,
  error: null,

  // Actions
  login: async (email: string, password: string) => {
    set({ loading: true, error: null });
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      set({
        user: data.user as User,
        loading: false,
        error: null,
      });
    } catch (error: unknown) {
      set({
        user: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Login failed',
      });
      throw error;
    }
  },

  logout: async () => {
    set({ loading: true, error: null });
    
    try {
      await signOut();
      set({
        user: null,
        loading: false,
        error: null,
      });
    } catch (error: unknown) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Logout failed',
      });
      throw error;
    }
  },

  signup: async (email: string, password: string) => {
    set({ loading: true, error: null });
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      set({
        user: data.user as User,
        loading: false,
        error: null,
      });
    } catch (error: unknown) {
      set({
        user: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Signup failed',
      });
      throw error;
    }
  },

  getUsername: () => {
    const { user } = get();
    return user?.email?.split('@')[0] || null;
  },

  setUser: (user: User | null) => {
    set({ user });
  },
}));

// Initialize auth state on app start
if (typeof window !== 'undefined') {
  getCurrentUser().then((user) => {
  if (user) {
    useAuthStore.setState({ user: user as User });
  }
  });

  // Listen for auth changes
  supabase.auth.onAuthStateChange((event, session) => {
    useAuthStore.setState({
        user: session?.user as User || null,
    });
  });
}
