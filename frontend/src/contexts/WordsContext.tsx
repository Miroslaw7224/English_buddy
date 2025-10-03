import React, { createContext, useContext, ReactNode } from 'react';
import { useWords } from '../hooks/useWords';

interface WordsContextType {
  words: any[];
  loading: boolean;
  form: any;
  setForm: (form: any) => void;
  error: string;
  onAdd: (e: any) => Promise<void>;
  onUpdate: (id: string, patch: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const WordsContext = createContext<WordsContextType | null>(null);

export const WordsProvider = ({ children }: { children: ReactNode }) => {
  const wordsHook = useWords();

  const value: WordsContextType = {
    words: wordsHook.words,
    loading: wordsHook.loading,
    form: wordsHook.form,
    setForm: wordsHook.setForm,
    error: wordsHook.error,
    onAdd: wordsHook.onAdd,
    onUpdate: wordsHook.onUpdate,
    onDelete: wordsHook.onDelete
  };

  return (
    <WordsContext.Provider value={value}>
      {children}
    </WordsContext.Provider>
  );
};

export const useWordsContext = () => {
  const context = useContext(WordsContext);
  if (!context) {
    throw new Error('useWordsContext must be used within WordsProvider');
  }
  return context;
};
