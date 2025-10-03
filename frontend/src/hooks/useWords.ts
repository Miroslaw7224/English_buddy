// @ts-nocheck
// eslint-disable

import { useState, useEffect } from 'react';
import { listWords, addWord, updateWord, deleteWord } from '../services/words';
import { useToast } from '../contexts/ToastContext';

export const useWords = () => {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ term: "", translation: "", example: "" });
  const [error, setError] = useState("");
  const { addToast } = useToast();

  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await listWords();
      setWords(rows);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const onAdd = async (e) => {
    e.preventDefault();
    try {
      const row = await addWord(form);
      setWords((prev) => [row, ...prev]);
      setForm({ term: "", translation: "", example: "" });
      addToast({
        type: 'success',
        title: 'Słówko dodane',
        message: `"${form.term}" zostało dodane do listy`
      });
    } catch (e) { 
      setError(e.message);
      addToast({
        type: 'error',
        title: 'Błąd dodawania',
        message: e.message || 'Nie udało się dodać słówka'
      });
    }
  };

  const onUpdate = async (id, patch) => {
    try {
      const row = await updateWord(id, patch);
      setWords((prev) => prev.map((x) => (x.id === id ? row : x)));
      addToast({
        type: 'success',
        title: 'Słówko zaktualizowane',
        message: 'Zmiany zostały zapisane'
      });
    } catch (e) { 
      setError(e.message);
      addToast({
        type: 'error',
        title: 'Błąd aktualizacji',
        message: e.message || 'Nie udało się zaktualizować słówka'
      });
    }
  };

  const onDelete = async (id) => {
    if (!confirm("Usunąć to słówko?")) return;
    try {
      await deleteWord(id);
      setWords((prev) => prev.filter((x) => x.id !== id));
      addToast({
        type: 'info',
        title: 'Słówko usunięte',
        message: 'Słówko zostało usunięte z listy'
      });
    } catch (e) { 
      setError(e.message);
      addToast({
        type: 'error',
        title: 'Błąd usuwania',
        message: e.message || 'Nie udało się usunąć słówka'
      });
    }
  };

  return { 
    words, 
    loading, 
    form, 
    setForm, 
    error, 
    onAdd, 
    onUpdate, 
    onDelete 
  };
};