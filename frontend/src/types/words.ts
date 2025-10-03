// @ts-nocheck
// eslint-disable

export interface Word {
  id: string;
  english: string;
  polish: string;
  difficulty: 'easy' | 'medium' | 'hard';
  createdAt: string;
}

export interface WordsState {
  words: Word[];
  loading: boolean;
}
