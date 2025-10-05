export interface UserProgress {
  id: string;
  user_id: string;
  date: string;
  lessons_completed: number;
  minutes_studied: number;
  words_learned: number;
  streak: number;
  points_earned: number;
  created_at: string;
  updated_at: string;
}

export interface DailyLesson {
  id: string;
  title: string;
  description: string;
  type: 'chat' | 'words' | 'quiz' | 'grammar';
  duration: number; // minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  points: number;
  completed: boolean;
  date: string;
}

export interface WeeklyStats {
  total_minutes: number;
  lessons_completed: number;
  words_learned: number;
  accuracy_percentage: number;
  streak: number;
  points_earned: number;
}

export interface DashboardData {
  user_progress: UserProgress;
  daily_lessons: DailyLesson[];
  weekly_stats: WeeklyStats;
  current_streak: number;
  best_streak: number;
}
