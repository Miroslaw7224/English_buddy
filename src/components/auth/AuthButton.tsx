'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth';
import { supabase } from '@/lib/supabase';

export function AuthButton() {
  const [loading, setLoading] = useState(false);
  const { user, setUser } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email) {
        setUser({
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          updated_at: user.updated_at,
        });
      }
    };
    getUser();
  }, [setUser]);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <Button
        onClick={handleSignOut}
        disabled={loading}
        variant="outline"
        className="border-white/20 text-white hover:bg-white/10"
      >
        {loading ? 'Signing out...' : 'Sign Out'}
      </Button>
    );
  }

  return (
    <Button
      onClick={() => router.push('/auth')}
      className="bg-blue-600 hover:bg-blue-700"
    >
      Sign In
    </Button>
  );
}
