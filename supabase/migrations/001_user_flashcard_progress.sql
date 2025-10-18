-- User flashcard progress tracking
-- Stores SRS (Spaced Repetition System) data for each user's flashcard

CREATE TABLE user_flashcard_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  word_id TEXT NOT NULL, -- ID from JSON files (e.g., "e4b1e662-cc1a-4007-a3ab-302b0067dfc6")
  level TEXT NOT NULL CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  category TEXT, -- e.g., "greetings", "time-days"
  
  -- SRS algorithm fields
  interval INTEGER DEFAULT 0, -- days until next review
  ease INTEGER DEFAULT 250, -- ease factor (250 = 2.5)
  due_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_review_at TIMESTAMP WITH TIME ZONE,
  streak INTEGER DEFAULT 0, -- consecutive correct answers
  lapses INTEGER DEFAULT 0, -- times marked as "forgot"
  
  -- Statistics
  total_reviews INTEGER DEFAULT 0,
  correct_reviews INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, word_id, level)
);

-- Indexes
CREATE INDEX idx_user_flashcard_progress_user ON user_flashcard_progress(user_id);
CREATE INDEX idx_user_flashcard_progress_due ON user_flashcard_progress(user_id, due_at);
CREATE INDEX idx_user_flashcard_progress_level ON user_flashcard_progress(user_id, level);
CREATE INDEX idx_user_flashcard_progress_word ON user_flashcard_progress(word_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_flashcard_progress_updated_at 
  BEFORE UPDATE ON user_flashcard_progress 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE user_flashcard_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own flashcard progress" ON user_flashcard_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own flashcard progress" ON user_flashcard_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flashcard progress" ON user_flashcard_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own flashcard progress" ON user_flashcard_progress
  FOR DELETE USING (auth.uid() = user_id);

-- Comment
COMMENT ON TABLE user_flashcard_progress IS 'Tracks individual user progress for flashcards from JSON files using SRS algorithm';

