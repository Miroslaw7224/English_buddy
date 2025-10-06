SELECT c1.word_id AS a, c2.word_id AS b, similarity(c1.term, c2.term) AS sim
FROM cards c1
JOIN cards c2 ON c1.user_id = c2.user_id AND c1.word_id < c2.word_id
WHERE c1.term_lang = c2.term_lang
  AND similarity(c1.term, c2.term) > 0.8;
