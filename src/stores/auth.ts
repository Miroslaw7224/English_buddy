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

      // AuthProvider will handle profile fetching via onAuthStateChange
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

      // AuthProvider will handle profile fetching via onAuthStateChange
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

  updateCefrLevel: async (level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2') => {
    const { user } = get();
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('user_profil')
        .upsert({
          user_id: user.id,
          cefr_level: level,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      set({
        user: { ...user, cefr_level: level },
        error: null
      });
    } catch (error: unknown) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update CEFR level',
      });
      throw error;
    }
  },

  updatePlacementResults: async (score: number, answers: any[], mode: 'adaptive' | 'linear', source: 'ai' | 'static') => {
    const { user } = get();
    if (!user) throw new Error('User not authenticated');

    // Calculate CEFR level based on score
    const cefrLevel = score >= 80 ? 'C2' : 
                     score >= 60 ? 'C1' : 
                     score >= 40 ? 'B2' : 
                     score >= 20 ? 'B1' : 
                     score > 0 ? 'A2' : 'A1';

    try {
      const { error } = await supabase
        .from('user_profil')
        .upsert({
          user_id: user.id,
          cefr_level: cefrLevel,
          placement_score: score,
          placement_taken_at: new Date().toISOString(),
          placement_mode: mode,
          placement_source: source,
          answers: answers,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      set({
        user: { 
          ...user, 
          cefr_level: cefrLevel,
          placement_score: score,
          placement_taken_at: new Date().toISOString(),
          placement_mode: mode,
          placement_source: source
        },
        error: null
      });
    } catch (error: unknown) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update placement results',
      });
      throw error;
    }
  },
}));

// Helper functions moved to AuthProvider

// Auth state is now managed by AuthProvider
// No need for onAuthStateChange here anymore
