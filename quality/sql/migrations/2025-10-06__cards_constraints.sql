-- Enumy
CREATE TYPE cefr AS ENUM ('A1','A2','B1','B2','C1','C2');
CREATE TYPE difficulty AS ENUM ('beginner','intermediate','advanced');
CREATE TYPE part_of_speech AS ENUM (
  'noun','verb','adjective','adverb','pronoun','preposition','conjunction','interjection','determiner','phrase'
);
CREATE TYPE visibility AS ENUM ('private','shared');
CREATE TYPE status AS ENUM ('active','archived');

-- Tabela (fragment)
ALTER TABLE cards
  ADD CONSTRAINT chk_lang_codes
    CHECK (term_lang ~ '^[a-z]{2}$' AND translation_lang ~ '^[a-z]{2}$'),
  ADD CONSTRAINT chk_term_translation_diff
    CHECK (lower(term) <> lower(translation)),
  ADD CONSTRAINT chk_https_urls
    CHECK (
      (audio_url IS NULL OR left(audio_url,8) = 'https://') AND
      (image_url IS NULL OR left(image_url,8) = 'https://')
    ),
  ADD CONSTRAINT chk_srs_bounds
    CHECK (
      (srs->>'interval')::int >= 0 AND (srs->>'interval')::int <= 36500 AND
      (srs->>'ease')::int BETWEEN 130 AND 350 AND
      (srs->>'streak')::int >= 0 AND (srs->>'lapses')::int >= 0
    ),
  ADD CONSTRAINT chk_srs_times
    CHECK ( (srs->>'last_review_at')::timestamptz <= (srs->>'due_at')::timestamptz );

-- Unikalność w obrębie użytkownika+języka+lematu
CREATE UNIQUE INDEX IF NOT EXISTS ux_cards_user_term_lang
ON cards (user_id, lower(term), term_lang);

-- Szybkie wykrywanie duplikatów „prawie identycznych”
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_cards_term_trgm ON cards USING gin (term gin_trgm_ops);
