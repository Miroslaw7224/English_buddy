'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';

export function LevelRedirect() {
  const router = useRouter();
  const { user, loading } = useAuthStore();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // Only redirect if user is authenticated, not loading, and we haven't already redirected
    if (!loading && user && !user.cefr_level && !hasRedirected) {
      setHasRedirected(true);
      router.push('/level-selection');
    }
  }, [user, loading, router, hasRedirected]);

  return null;
}
