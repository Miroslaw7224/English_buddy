'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, Home } from 'lucide-react';

export function TopBar() {
  const router = useRouter();
  const { user, loading, logout, getUsername } = useAuthStore();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="flex-shrink-0 px-4 pt-4 pb-0">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        {/* Logo + Home Button */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/')}
            className="bg-white/20 border-white/30 text-white hover:bg-white/30"
          >
            <Home className="h-4 w-4 mr-2" />
            Strona główna
          </Button>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              <span className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent inline-block">
                English
              </span>
              <span className="bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent inline-block ml-2">
                Buddy
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-4">
          {/* Auth Section */}
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-white text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {getUsername()}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={loading}
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Wyloguj
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/auth')}
              className="bg-white/20 border-white/30 text-white hover:bg-white/30"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Zaloguj
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
