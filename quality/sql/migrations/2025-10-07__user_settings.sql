-- Migration: Add settings column to user_profil
-- Created: 2025-10-07

-- Add settings JSONB column for flexible user preferences
ALTER TABLE public.user_profil 
ADD COLUMN IF NOT EXISTS settings jsonb DEFAULT '{
  "dailyGoal": 30,
  "ttsEnabled": true,
  "ttsVoice": "alloy",
  "notifications": true
}'::jsonb;

-- Add comment
COMMENT ON COLUMN public.user_profil.settings IS 'User preferences and settings stored as JSON';

