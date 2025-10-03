
// @ts-nocheck
// eslint-disable

import { useState, useMemo } from 'react';
import { createRepos } from '../lib/repos/index';
import { useToast } from '../contexts/ToastContext';

interface User {
  id: string;
  username?: string;
  email?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();
  
  const { auth } = useMemo(() => createRepos(user?.id || null), [user?.id]);

  const toEmail = (u: string) => u.includes('@') ? u : `${u}@eb.local`;
  
  const getUsername = (user: User | null) => {
    if (!user) return '';
    if (user.username) return user.username;
    if (user.email) return user.email.split('@')[0];
    return 'Użytkownik';
  };

  const handleLogin = async (username: string, password: string) => {
    if (!username || !password || loading) return;
    setLoading(true);
    setError(null);
    try { 
      console.log('Próba logowania:', { username, email: toEmail(username) });
      const u = await auth.signIn(toEmail(username), password); 
      console.log('Logowanie udane:', u);
      setUser(u as User);
      addToast({
        type: 'success',
        title: 'Zalogowano pomyślnie',
        message: `Witaj ${getUsername(u as User)}!`
      });
    } catch (e: any) { 
      console.error('Logowanie nieudane:', e); 
      if (e.message?.includes('Invalid login credentials')) {
        try {
          console.log('Próba rejestracji:', { username, email: toEmail(username) });
          const u = await auth.signUp(toEmail(username), password);
          console.log('Rejestracja udana:', u);
          setUser(u as User);
          addToast({
            type: 'success',
            title: 'Konto utworzone',
            message: 'Zostałeś automatycznie zarejestrowany i zalogowany!'
          });
        } catch (signUpError: any) {
          console.error('Rejestracja nieudana:', signUpError);
          const errorMsg = 'Nie udało się zalogować ani zarejestrować: ' + signUpError.message;
          setError(errorMsg);
          addToast({
            type: 'error',
            title: 'Błąd autoryzacji',
            message: errorMsg
          });
        }
      } else {
        const errorMsg = e.message || 'Błąd logowania';
        setError(errorMsg);
        addToast({
          type: 'error',
          title: 'Błąd logowania',
          message: errorMsg
        });
      }
    } finally { 
      setLoading(false); 
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut(); 
      setUser(null);
      addToast({
        type: 'info',
        title: 'Wylogowano',
        message: 'Zostałeś pomyślnie wylogowany'
      });
    } catch (e: any) {
      console.error('Błąd wylogowania:', e);
      addToast({
        type: 'error',
        title: 'Błąd wylogowania',
        message: e.message || 'Nie udało się wylogować'
      });
    }
  };

  return { 
    user, 
    loading, 
    error, 
    handleLogin, 
    handleLogout, 
    getUsername 
  };
};