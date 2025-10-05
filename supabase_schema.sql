-- English Buddy Database Schema
-- Run this in Supabase SQL Editor

-- ==============================================
-- 1. ENUMS
-- ==============================================

-- Lesson types
CREATE TYPE lesson_type AS ENUM (
  'chat', 
  'words', 
  'quiz', 
  'grammar', 
  'listening', 
  'writing'
);

-- Difficulty levels
CREATE TYPE difficulty_level AS ENUM (
  'beginner', 
  'intermediate', 
  'advanced'
);

-- ==============================================
-- 2. CORE TABLES
-- ==============================================

-- Daily lessons (shared across all users)
CREATE TABLE daily_lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type lesson_type NOT NULL,
  duration INTEGER NOT NULL CHECK (duration > 0),
  difficulty difficulty_level NOT NULL,
  points INTEGER DEFAULT 0 CHECK (points >= 0),
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User progress tracking
CREATE TABLE user_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  lessons_completed INTEGER DEFAULT 0 CHECK (lessons_completed >= 0),
  minutes_studied INTEGER DEFAULT 0 CHECK (minutes_studied >= 0),
  words_learned INTEGER DEFAULT 0 CHECK (words_learned >= 0),
  streak INTEGER DEFAULT 0 CHECK (streak >= 0),
  points_earned INTEGER DEFAULT 0 CHECK (points_earned >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- User-specific lesson completion
CREATE TABLE user_daily_lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES daily_lessons(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  time_spent INTEGER DEFAULT 0 CHECK (time_spent >= 0), -- minutes
  points_earned INTEGER DEFAULT 0 CHECK (points_earned >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- ==============================================
-- 3. INDEXES
-- ==============================================

-- User progress indexes
CREATE INDEX idx_user_progress_user_date ON user_progress(user_id, date);
CREATE INDEX idx_user_progress_date ON user_progress(date);

-- Daily lessons indexes
CREATE INDEX idx_daily_lessons_date ON daily_lessons(date);
CREATE INDEX idx_daily_lessons_type ON daily_lessons(type);

-- User daily lessons indexes
CREATE INDEX idx_user_daily_lessons_user ON user_daily_lessons(user_id);
CREATE INDEX idx_user_daily_lessons_lesson ON user_daily_lessons(lesson_id);
CREATE INDEX idx_user_daily_lessons_completed ON user_daily_lessons(user_id, completed);

-- ==============================================
-- 4. TRIGGERS
-- ==============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_daily_lessons_updated_at 
  BEFORE UPDATE ON daily_lessons 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at 
  BEFORE UPDATE ON user_progress 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_daily_lessons_updated_at 
  BEFORE UPDATE ON user_daily_lessons 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ==============================================

-- Enable RLS on all tables
ALTER TABLE daily_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_lessons ENABLE ROW LEVEL SECURITY;

-- Daily lessons policies (read-only for authenticated users)
CREATE POLICY "Authenticated users can view daily lessons" ON daily_lessons
  FOR SELECT USING (auth.role() = 'authenticated');

-- User progress policies
CREATE POLICY "Users can view own progress" ON user_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON user_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- User daily lessons policies
CREATE POLICY "Users can view own daily lessons" ON user_daily_lessons
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily lessons" ON user_daily_lessons
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily lessons" ON user_daily_lessons
  FOR UPDATE USING (auth.uid() = user_id);

-- ==============================================
-- 6. SAMPLE DATA
-- ==============================================

-- Insert sample daily lessons for today
INSERT INTO daily_lessons (title, description, type, duration, difficulty, points, date) VALUES
('Daily Conversation Practice', 'Practice everyday English conversations', 'chat', 5, 'beginner', 10, CURRENT_DATE),
('Vocabulary Flashcards', 'Review and learn new vocabulary words', 'words', 10, 'beginner', 15, CURRENT_DATE),
('Listening Quiz', 'Test your listening comprehension', 'listening', 5, 'intermediate', 12, CURRENT_DATE),
('Writing Exercise', 'Practice writing short sentences', 'writing', 3, 'beginner', 8, CURRENT_DATE);

-- ==============================================
-- 7. HELPER FUNCTIONS
-- ==============================================

-- Function to get user's dashboard data
CREATE OR REPLACE FUNCTION get_user_dashboard_data(user_uuid UUID, target_date DATE DEFAULT CURRENT_DATE)
RETURNS JSON AS $$
DECLARE
  result JSON;
  week_start DATE := target_date - INTERVAL '7 days';
BEGIN
  SELECT json_build_object(
    'user_progress', (
      SELECT json_build_object(
        'id', id,
        'user_id', user_id,
        'date', date,
        'lessons_completed', lessons_completed,
        'minutes_studied', minutes_studied,
        'words_learned', words_learned,
        'streak', streak,
        'points_earned', points_earned,
        'created_at', created_at,
        'updated_at', updated_at
      )
      FROM user_progress 
      WHERE user_id = user_uuid AND date = target_date
    ),
    'daily_lessons', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', dl.id,
          'title', dl.title,
          'description', dl.description,
          'type', dl.type::text,
          'duration', dl.duration,
          'difficulty', dl.difficulty::text,
          'points', dl.points,
          'completed', COALESCE(udl.completed, false),
          'date', dl.date
        ) ORDER BY dl.created_at
      ), '[]'::json)
      FROM daily_lessons dl
      LEFT JOIN user_daily_lessons udl ON dl.id = udl.lesson_id AND udl.user_id = user_uuid
      WHERE dl.date = target_date
    ),
    'weekly_stats', (
      SELECT json_build_object(
        'total_minutes', COALESCE(SUM(minutes_studied), 0),
        'lessons_completed', COALESCE(SUM(lessons_completed), 0),
        'words_learned', COALESCE(SUM(words_learned), 0),
        'points_earned', COALESCE(SUM(points_earned), 0)
      )
      FROM user_progress 
      WHERE user_id = user_uuid AND date >= week_start
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_dashboard_data(UUID, DATE) TO authenticated;

-- ==============================================
-- 8. COMMENTS
-- ==============================================

COMMENT ON TABLE daily_lessons IS 'Shared daily lessons available to all users';
COMMENT ON TABLE user_progress IS 'Daily progress tracking for each user';
COMMENT ON TABLE user_daily_lessons IS 'User-specific completion status for daily lessons';

COMMENT ON FUNCTION get_user_dashboard_data IS 'Returns complete dashboard data for a user including progress, lessons, and weekly stats';
