SELECT word_id, srs->>'interval' AS interval, srs->>'ease' AS ease, srs->>'due_at' AS due_at
FROM cards
WHERE (srs->>'ease')::int NOT BETWEEN 130 AND 350
   OR (srs->>'interval')::int < 0
   OR (srs->>'last_review_at')::timestamptz > (srs->>'due_at')::timestamptz;
