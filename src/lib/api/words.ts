import { Word, WordForm } from '@/types/words';
import { supabase } from '../supabase';
import { ApiError } from './http';

export const getWords = async (): Promise<Word[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('words')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new ApiError(`Failed to fetch words: ${error.message}`, 500, error);
  }

  return data || [];
};

export const addWord = async (wordForm: WordForm): Promise<Word> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new ApiError('User not authenticated', 401);
  }

  // Create word with default values
  const wordData = {
    user_id: user.id,
    term: wordForm.term,
    term_lang: wordForm.term_lang || 'en',
    translation: wordForm.translation,
    translation_lang: wordForm.translation_lang || 'pl',
    definition: wordForm.definition,
    part_of_speech: wordForm.part_of_speech,
    ipa: wordForm.ipa,
    inflections: [],
    examples: wordForm.examples || [],
    difficulty: wordForm.difficulty || 'beginner',
    cefr: wordForm.cefr,
    category: wordForm.category,
    tags: wordForm.tags || [],
    license: 'CC-BY-4.0',
    srs: {
      interval: 1,
      ease: 250,
      due_at: null,
      last_review_at: null,
      streak: 0,
      lapses: 0
    },
    visibility: 'private',
    status: 'active',
    source: 'in-house'
  };

  const { data, error } = await supabase
    .from('words')
    .insert([wordData])
    .select()
    .single();

  if (error) {
    throw new ApiError(`Failed to add word: ${error.message}`, 500, error);
  }

  return data;
};

export const updateWord = async (word_id: string, wordForm: Partial<WordForm>): Promise<Word> => {
  const { data, error } = await supabase
    .from('words')
    .update(wordForm)
    .eq('word_id', word_id)
    .select()
    .single();

  if (error) {
    throw new ApiError(`Failed to update word: ${error.message}`, 500, error);
  }

  return data;
};

export const deleteWord = async (word_id: string): Promise<void> => {
  const { error } = await supabase
    .from('words')
    .delete()
    .eq('word_id', word_id);

  if (error) {
    throw new ApiError(`Failed to delete word: ${error.message}`, 500, error);
  }
};

