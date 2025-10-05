export interface Word {
  id: string;
  term: string;
  translation?: string;
  example?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

export interface WordForm {
  term: string;
  translation: string;
  example: string;
}

export interface WordsState {
  words: Word[];
  loading: boolean;
  error: string | null;
}

export interface WordsActions {
  addWord: (word: Omit<Word, 'id'>) => Promise<void>;
  updateWord: (id: string, word: Partial<Word>) => Promise<void>;
  deleteWord: (id: string) => Promise<void>;
  refreshWords: () => Promise<void>;
}

export type WordsStore = WordsState & WordsActions;
