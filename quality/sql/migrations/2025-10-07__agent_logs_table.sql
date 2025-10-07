-- Migration: Agent AI Placement Test Logs
-- Created: 2025-10-07

-- Table for storing placement test conversation logs
CREATE TABLE IF NOT EXISTS public.agent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  state text NOT NULL, -- INIT, WARMUP, ADAPT_R1, ADAPT_R2, WRAPUP, SCORE, DONE
  agent_msg text,
  user_msg text,
  dims_json jsonb, -- {"comp": 3, "task": 3, "gram": 3, "lex": 3, "flu": 3, "cefr_guess": "B1"}
  created_at timestamptz DEFAULT now()
);

-- Index for faster session queries
CREATE INDEX IF NOT EXISTS idx_agent_logs_session ON public.agent_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_user ON public.agent_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_created ON public.agent_logs(created_at DESC);

-- RLS policies
ALTER TABLE public.agent_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own logs
CREATE POLICY "Users can view own logs"
  ON public.agent_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own logs
CREATE POLICY "Users can insert own logs"
  ON public.agent_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Comment
COMMENT ON TABLE public.agent_logs IS 'Stores conversation logs for AI placement test sessions';

