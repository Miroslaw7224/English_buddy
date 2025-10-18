export interface QuizTask {
  type: 'multiple_choice';
  prompt: string;
  options: string[];
  answer_index: number;
  feedback_correct: string;
  feedback_incorrect: string;
}

export interface Quiz {
  tasks: QuizTask[];
}

export interface Flashcard {
  word_id: string;
  user_id: string;
  term: string;
  term_lang: string;
  translation: string;
  translation_lang: string;
  definition: string;
  part_of_speech: string;
  ipa: string | null;
  lemma: string | null;
  inflections: string[];
  examples: Array<{
    text: string;
    translation: string | null;
  }>;
  difficulty: string;
  cefr: string;
  category: string | null;
  deck_id: string | null;
  tags: string[];
  audio_url: string | null;
  image_url: string | null;
  license: string | null;
  media_attribution: string | null;
  srs: {
    interval: number;
    ease: number;
    due_at: string;
    last_review_at: string;
    streak: number;
    lapses: number;
  };
  visibility: string;
  status: string;
  source: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  quiz?: Quiz;
}

export async function loadFlashcards(level: string): Promise<Flashcard[]> {
  try {
    const response = await fetch(`/api/flashcards?level=${level}`);
    
    if (!response.ok) {
      throw new Error('Failed to load flashcards');
    }
    
    const data = await response.json();
    return data.flashcards || [];
  } catch (error) {
    console.error('Error loading flashcards:', error);
    return [];
  }
}

export async function getAvailableLevels(): Promise<string[]> {
  // For now, return hardcoded levels
  // In the future, we can create an API endpoint for this
  return ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
}
