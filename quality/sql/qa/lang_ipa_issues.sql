SELECT word_id, term, ipa
FROM cards
WHERE term_lang = 'en' AND (ipa IS NULL OR ipa = '');
