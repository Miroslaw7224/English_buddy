'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { User } from '@/types/auth';

// Helper function to ensure user profile exists
const ensureUserProfile = async (userId: string) => {
  try {
    // Try to get existing profile
    const { data: existingProfile, error: fetchError } = await supabase
      .from('user_profil')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (fetchError) {
      return null;
    }
    
    // If profile exists, return it
    if (existingProfile) {
      return existingProfile;
    }
    
    // If no profile exists, create one
    const { data: newProfile, error: insertError } = await supabase
      .from('user_profil')
      .insert({ user_id: userId })
      .select()
      .single();
    
    if (insertError) {
      return null;
    }
    
    return newProfile;
  } catch (error) {
    return null;
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const { setUser } = useAuthStore();

  useEffect(() => {
    // Cleanup previous subscription if exists
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        try {
          // Ensure profile exists (create if not)
          const profile = await ensureUserProfile(session.user.id);
          
          const userWithProfile: User = {
            ...session.user,
            email: session.user.email || '',
            cefr_level: profile?.cefr_level || null,
            placement_score: profile?.placement_score || null,
            placement_taken_at: profile?.placement_taken_at || null,
            placement_mode: profile?.placement_mode || null,
            placement_source: profile?.placement_source || null,
          };
          
          setUser(userWithProfile);
        } catch (error) {
          // Set user without profile data if there's an error
          setUser(session.user as User);
        }
      } else {
        setUser(null);
      }
    });

    // Store unsubscribe function
    unsubscribeRef.current = () => {
      subscription.unsubscribe();
    };

    // Cleanup on unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [setUser]);

  return <>{children}</>;
}
