SELECT word_id, term, translation
FROM cards
WHERE length(term) > 120 OR length(definition) < 5
   OR term ~ '[<>]';  -- potencjalny HTML
