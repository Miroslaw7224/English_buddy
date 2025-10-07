-- 1) ENUM z poziomami CEFR (tworzy tylko jeśli nie istnieje)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cefr_level_t') THEN
    CREATE TYPE public.cefr_level_t AS ENUM ('A1','A2','B1','B2','C1','C2');
  END IF;
END
$$;

-- 2) Tabela user_profil (jeden profil na użytkownika)
CREATE TABLE IF NOT EXISTS public.user_profil (
  user_id            uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  cefr_level         public.cefr_level_t,                    -- A1–C2 (opcjonalnie na start)
  placement_score    integer CHECK (placement_score BETWEEN 0 AND 100),
  placement_mode     text CHECK (placement_mode IN ('adaptive','linear')),  -- opcjonalne meta
  placement_source   text CHECK (placement_source IN ('ai','static')),      -- opcjonalne meta
  placement_taken_at timestamptz,
  answers            jsonb,                                 -- zapis pytań/odpowiedzi po teście
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- 3) Trigger do aktualizacji updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_user_profil_updated_at ON public.user_profil;
CREATE TRIGGER set_user_profil_updated_at
BEFORE UPDATE ON public.user_profil
FOR EACH ROW
EXECUTE PROCEDURE public.set_updated_at();

-- 4) Włączenie i polityki RLS (użytkownik widzi/zmienia tylko swój profil)
ALTER TABLE public.user_profil ENABLE ROW LEVEL SECURITY;

-- SELECT własnego profilu
DROP POLICY IF EXISTS "select_own_profile" ON public.user_profil;
CREATE POLICY "select_own_profile"
ON public.user_profil
FOR SELECT
USING (auth.uid() = user_id);

-- INSERT własnego profilu
DROP POLICY IF EXISTS "insert_own_profile" ON public.user_profil;
CREATE POLICY "insert_own_profile"
ON public.user_profil
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE własnego profilu
DROP POLICY IF EXISTS "update_own_profile" ON public.user_profil;
CREATE POLICY "update_own_profile"
ON public.user_profil
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
