export interface Word {
  word_id: string;
  user_id: string;
  term: string;
  term_lang: string;
  translation: string;
  translation_lang: string;
  definition?: string;
  part_of_speech?: string;
  ipa?: string;
  lemma?: string;
  inflections: any[];
  examples: WordExample[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  cefr?: string;
  category?: string;
  deck_id?: string;
  tags: string[];
  audio_url?: string;
  image_url?: string;
  license: string;
  media_attribution?: string;
  srs: SRSData;
  visibility: 'private' | 'public' | 'shared';
  status: 'active' | 'archived' | 'deleted';
  source: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface WordExample {
  text: string;
  translation: string;
}

export interface SRSData {
  interval: number;
  ease: number;
  due_at: string | null;
  last_review_at: string | null;
  streak: number;
  lapses: number;
}

export interface WordForm {
  term: string;
  term_lang?: string;
  translation: string;
  translation_lang?: string;
  definition?: string;
  part_of_speech?: string;
  ipa?: string;
  examples?: WordExample[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  cefr?: string;
  category?: string;
  tags?: string[];
}

export interface WordsState {
  words: Word[];
  loading: boolean;
  error: string | null;
}

export interface WordsActions {
  addWord: (word: WordForm) => Promise<void>;
  updateWord: (word_id: string, word: Partial<WordForm>) => Promise<void>;
  deleteWord: (word_id: string) => Promise<void>;
  refreshWords: () => Promise<void>;
}

export type WordsStore = WordsState & WordsActions;
