import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';

interface AuthContextType {
  user: any;
  loading: boolean;
  error: string | null;
  handleLogin: (username: string, password: string) => Promise<void>;
  handleLogout: () => Promise<void>;
  getUsername: (user: any) => string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const authHook = useAuth();

  const value: AuthContextType = {
    user: authHook.user,
    loading: authHook.loading,
    error: authHook.error,
    handleLogin: authHook.handleLogin,
    handleLogout: authHook.handleLogout,
    getUsername: authHook.getUsername
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};
