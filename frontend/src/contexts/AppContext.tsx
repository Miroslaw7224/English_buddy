import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useWords } from '../hooks/useWords';

// Typy dla stanu aplikacji
interface AppState {
  auth: {
    user: any;
    loading: boolean;
    error: string | null;
  };
  words: {
    words: any[];
    loading: boolean;
    form: any;
    error: string;
  };
}

// Typy dla akcji
type AppAction = 
  | { type: 'AUTH_UPDATE'; payload: Partial<AppState['auth']> }
  | { type: 'WORDS_UPDATE'; payload: Partial<AppState['words']> };

// Reducer dla zarządzania stanem
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'AUTH_UPDATE':
      return {
        ...state,
        auth: { ...state.auth, ...action.payload }
      };
    case 'WORDS_UPDATE':
      return {
        ...state,
        words: { ...state.words, ...action.payload }
      };
    default:
      return state;
  }
};

// Kontekst
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

// Provider
export const AppProvider = ({ children }: { children: ReactNode }) => {
  const authHook = useAuth();
  const wordsHook = useWords();

  const [state, dispatch] = useReducer(appReducer, {
    auth: {
      user: authHook.user,
      loading: authHook.loading,
      error: authHook.error
    },
    words: {
      words: wordsHook.words,
      loading: wordsHook.loading,
      form: wordsHook.form,
      error: wordsHook.error
    }
  });

  // Synchronizuj hooki z kontekstem
  React.useEffect(() => {
    dispatch({ type: 'AUTH_UPDATE', payload: { user: authHook.user } });
  }, [authHook.user]);

  React.useEffect(() => {
    dispatch({ type: 'AUTH_UPDATE', payload: { loading: authHook.loading } });
  }, [authHook.loading]);

  React.useEffect(() => {
    dispatch({ type: 'AUTH_UPDATE', payload: { error: authHook.error } });
  }, [authHook.error]);

  React.useEffect(() => {
    dispatch({ type: 'WORDS_UPDATE', payload: { words: wordsHook.words } });
  }, [wordsHook.words]);

  React.useEffect(() => {
    dispatch({ type: 'WORDS_UPDATE', payload: { loading: wordsHook.loading } });
  }, [wordsHook.loading]);

  React.useEffect(() => {
    dispatch({ type: 'WORDS_UPDATE', payload: { form: wordsHook.form } });
  }, [wordsHook.form]);

  React.useEffect(() => {
    dispatch({ type: 'WORDS_UPDATE', payload: { error: wordsHook.error } });
  }, [wordsHook.error]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hooki z selektorami
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

// Selektory dla konkretnych części stanu
export const useAuthContext = () => {
  const { state } = useAppContext();
  return state.auth;
};

export const useWordsContext = () => {
  const { state } = useAppContext();
  return state.words;
};
