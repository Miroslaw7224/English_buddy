'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { supabase } from '@/lib/supabase';

export function LevelRedirect() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user?.id) return;

    (async () => {
      const { data, error } = await supabase
        .from("user_profil")
        .select("cefr_level, placement_score, placement_mode, placement_source")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("profile fetch error", error);
        // fallback: przenieś do wyboru poziomu lub pokaż komunikat
        router.replace("/level-selection");
        return;
      }

      const level = data?.cefr_level; // np. "B1"
      if (!level) {
        router.replace("/level-selection");
      }
    })();
  }, [user?.id, router]);

  return null;
}
