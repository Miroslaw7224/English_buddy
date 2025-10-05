-- Tabela dla SRS (Spaced Repetition System) - tylko jeśli nie istnieje
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  word_id UUID REFERENCES words(id) ON DELETE CASCADE,
  next_review_at TIMESTAMPTZ NOT NULL,
  interval_days INTEGER DEFAULT 1,
  ease_factor DECIMAL(3,2) DEFAULT 2.5,
  repetitions INTEGER DEFAULT 0,
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, word_id)
);

-- RLS dla reviews (tylko jeśli nie istnieje)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Users can view own reviews') THEN
        ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view own reviews" ON reviews
          FOR SELECT USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert own reviews" ON reviews
          FOR INSERT WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update own reviews" ON reviews
          FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- CHECK constraints dla reviews (tylko jeśli nie istnieją)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'positive_interval') THEN
        ALTER TABLE reviews ADD CONSTRAINT positive_interval CHECK (interval_days > 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'positive_ease_factor') THEN
        ALTER TABLE reviews ADD CONSTRAINT positive_ease_factor CHECK (ease_factor > 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'positive_repetitions') THEN
        ALTER TABLE reviews ADD CONSTRAINT positive_repetitions CHECK (repetitions >= 0);
    END IF;
END $$;

-- Trigger dla updated_at w reviews (tylko jeśli nie istnieje)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_reviews_updated_at') THEN
        CREATE TRIGGER update_reviews_updated_at
          BEFORE UPDATE ON reviews
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Index dla performance (tylko jeśli nie istnieje)
CREATE INDEX IF NOT EXISTS idx_reviews_user_next_review ON reviews(user_id, next_review_at);

-- Widok today_todos - łączy dzisiejsze lekcje i due SRS
CREATE OR REPLACE VIEW today_todos AS
-- Dzisiejsze lekcje (nieukończone)
SELECT 
  'lesson' as kind,
  dl.id::text as item_id,
  dl.title as title,
  dl.description as description,
  dl.type as type,
  dl.duration as duration,
  dl.difficulty as difficulty,
  dl.points as points,
  dl.date as due_date,
  CASE 
    WHEN udl.completed = true THEN 'completed'
    WHEN udl.id IS NOT NULL THEN 'started'
    ELSE 'pending'
  END as status,
  udl.completed_at,
  udl.time_spent,
  udl.points_earned,
  dl.created_at
FROM daily_lessons dl
LEFT JOIN user_daily_lessons udl ON dl.id = udl.lesson_id AND udl.user_id = auth.uid()
WHERE dl.date = CURRENT_DATE
  AND (udl.completed IS NULL OR udl.completed = false)

UNION ALL

-- Due SRS reviews
SELECT 
  'srs' as kind,
  r.id::text as item_id,
  w.term as title,
  w.translation as description,
  'words' as type,
  5 as duration, -- 5 minut na powtórkę
  'intermediate' as difficulty,
  10 as points, -- 10 punktów za powtórkę
  r.next_review_at::date as due_date,
  CASE 
    WHEN r.last_reviewed_at::date = CURRENT_DATE THEN 'completed'
    ELSE 'pending'
  END as status,
  r.last_reviewed_at as completed_at,
  0 as time_spent,
  0 as points_earned,
  r.created_at
FROM reviews r
JOIN words w ON r.word_id = w.id
WHERE r.user_id = auth.uid()
  AND r.next_review_at::date <= CURRENT_DATE
  AND (r.last_reviewed_at IS NULL OR r.last_reviewed_at::date < CURRENT_DATE);

-- RLS dla widoku (dziedziczy z bazowych tabel)
-- Widok automatycznie używa RLS z daily_lessons, user_daily_lessons, reviews, words

-- Funkcja do aktualizacji SRS po review
CREATE OR REPLACE FUNCTION update_srs_review(
  review_id UUID,
  quality INTEGER -- 0-5 (0=again, 1=hard, 2=good, 3=easy, 4=very_easy, 5=perfect)
) RETURNS VOID AS $$
DECLARE
  current_review reviews%ROWTYPE;
  new_interval INTEGER;
  new_ease_factor DECIMAL(3,2);
  new_repetitions INTEGER;
BEGIN
  -- Pobierz aktualny review
  SELECT * INTO current_review FROM reviews WHERE id = review_id AND user_id = auth.uid();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Review not found or access denied';
  END IF;
  
  -- Algorytm SM-2 (uproszczony)
  IF quality < 3 THEN
    -- Zła odpowiedź - reset
    new_interval := 1;
    new_repetitions := 0;
    new_ease_factor := GREATEST(1.3, current_review.ease_factor - 0.2);
  ELSE
    -- Dobra odpowiedź
    new_repetitions := current_review.repetitions + 1;
    
    IF new_repetitions = 1 THEN
      new_interval := 1;
    ELSIF new_repetitions = 2 THEN
      new_interval := 6;
    ELSE
      new_interval := ROUND(current_review.interval_days * current_review.ease_factor);
    END IF;
    
    new_ease_factor := current_review.ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    new_ease_factor := GREATEST(1.3, new_ease_factor);
  END IF;
  
  -- Aktualizuj review
  UPDATE reviews SET
    next_review_at = NOW() + (new_interval || ' days')::INTERVAL,
    interval_days = new_interval,
    ease_factor = new_ease_factor,
    repetitions = new_repetitions,
    last_reviewed_at = NOW(),
    updated_at = NOW()
  WHERE id = review_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funkcja do pobierania dzisiejszych zadań (dla API)
CREATE OR REPLACE FUNCTION get_today_todos()
RETURNS TABLE (
  kind TEXT,
  item_id TEXT,
  title TEXT,
  description TEXT,
  type TEXT,
  duration INTEGER,
  difficulty TEXT,
  points INTEGER,
  due_date DATE,
  status TEXT,
  completed_at TIMESTAMPTZ,
  time_spent INTEGER,
  points_earned INTEGER,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    today_todos.kind,
    today_todos.item_id,
    today_todos.title,
    today_todos.description,
    today_todos.type::text,
    today_todos.duration,
    today_todos.difficulty::text,
    today_todos.points,
    today_todos.due_date,
    today_todos.status,
    today_todos.completed_at,
    today_todos.time_spent,
    today_todos.points_earned,
    today_todos.created_at
  FROM today_todos
  ORDER BY 
    CASE today_todos.kind 
      WHEN 'lesson' THEN 1 
      WHEN 'srs' THEN 2 
    END,
    today_todos.due_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funkcja do oznaczania lekcji jako ukończonej
CREATE OR REPLACE FUNCTION complete_today_lesson(
  lesson_id UUID,
  time_spent_minutes INTEGER DEFAULT 0
) RETURNS VOID AS $$
DECLARE
  lesson_data daily_lessons%ROWTYPE;
BEGIN
  -- Pobierz dane lekcji
  SELECT * INTO lesson_data FROM daily_lessons WHERE id = lesson_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lesson not found';
  END IF;
  
  -- Oznacz jako ukończoną
  INSERT INTO user_daily_lessons (
    user_id, lesson_id, completed, completed_at, time_spent, points_earned
  ) VALUES (
    auth.uid(), lesson_id, true, NOW(), 
    COALESCE(time_spent_minutes, lesson_data.duration), 
    lesson_data.points
  )
  ON CONFLICT (user_id, lesson_id) 
  DO UPDATE SET
    completed = true,
    completed_at = NOW(),
    time_spent = COALESCE(time_spent_minutes, lesson_data.duration),
    points_earned = lesson_data.points,
    updated_at = NOW();
    
  -- Aktualizuj postęp użytkownika
  INSERT INTO user_progress (
    user_id, date, lessons_completed, minutes_studied, points_earned
  ) VALUES (
    auth.uid(), CURRENT_DATE, 1, 
    COALESCE(time_spent_minutes, lesson_data.duration), 
    lesson_data.points
  )
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    lessons_completed = user_progress.lessons_completed + 1,
    minutes_studied = user_progress.minutes_studied + COALESCE(time_spent_minutes, lesson_data.duration),
    points_earned = user_progress.points_earned + lesson_data.points,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
