export interface PlacementQuestion {
  id: string;
  type: 'listening' | 'grammar' | 'reading';
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  question: string;
  options: string[]; // for multiple choice (grammar/reading)
  correct_answer: number; // index of correct option
  audio_url?: string; // for listening questions
  explanation?: string;
  expected_text?: string; // for listening open response
  max_replays?: number; // for listening: default 3
}

export interface PlacementAnswer {
  question_id: string;
  selected_answer?: number; // for multiple choice
  user_text?: string; // for listening open response
  is_correct: boolean;
  time_spent: number; // in seconds
  score?: number; // 0, 0.5, 1 for listening
  ai_feedback?: string; // AI evaluation comment
}

export interface PlacementTestResult {
  score: number; // 0-100
  cefr_level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  answers: PlacementAnswer[];
  total_time: number; // in seconds
  questions_answered: number;
}

export interface PlacementTestState {
  questions: PlacementQuestion[];
  current_question_index: number;
  answers: PlacementAnswer[];
  current_level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  is_adaptive: boolean;
  is_completed: boolean;
  start_time: number;
}
