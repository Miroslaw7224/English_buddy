'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui/button';
import { wordSchema, WordForm } from '@/shared/validation/schemas';
import { Word } from '@/types/words';
import { X, Plus, Edit, Trash2, Loader2 } from 'lucide-react';

import { getWords, addWord, updateWord, deleteWord } from '@/lib/api';

interface WordsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WordsModal({ isOpen, onClose }: WordsModalProps) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<WordForm>({ term: '', translation: '', example: '' });

  const form = useForm<WordForm>({
    resolver: zodResolver(wordSchema),
    defaultValues: { term: '', translation: '', example: '' },
  });

  // Query for words
  const { data: words = [], isLoading, error } = useQuery({
    queryKey: ['words', user?.id],
    queryFn: getWords,
    enabled: !!user?.id && isOpen,
  });

  // Add word mutation with optimistic updates
  const addWordMutation = useMutation({
    mutationFn: (word: Omit<Word, 'id'>) => addWord(word),
    onMutate: async (newWord) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['words', user?.id] });
      
      // Snapshot previous value
      const previousWords = queryClient.getQueryData(['words', user?.id]);
      
      // Optimistically update
      const optimisticWord: Word = {
        ...newWord,
        id: crypto.randomUUID(),
        user_id: user?.id,
        created_at: new Date().toISOString(),
      };
      
      queryClient.setQueryData(['words', user?.id], (old: Word[] = []) => [...old, optimisticWord]);
      
      return { previousWords };
    },
    onError: (err, newWord, context) => {
      // Rollback on error
      queryClient.setQueryData(['words', user?.id], context?.previousWords);
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: ['words', user?.id] });
    },
  });

  // Update word mutation
  const updateWordMutation = useMutation({
    mutationFn: ({ id, word }: { id: string; word: Partial<Word> }) => 
      updateWord(id, word),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['words', user?.id] });
      setEditingId(null);
      setEditForm({ term: '', translation: '', example: '' });
    },
  });

  // Delete word mutation
  const deleteWordMutation = useMutation({
    mutationFn: (id: string) => deleteWord(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['words', user?.id] });
    },
  });

  const onSubmit = (data: WordForm) => {
    addWordMutation.mutate(data);
    form.reset();
  };

  const handleEdit = (word: Word) => {
    setEditingId(word.id);
    setEditForm({
      term: word.term,
      translation: word.translation || '',
      example: word.example || '',
    });
  };

  const handleUpdate = () => {
    if (editingId) {
      updateWordMutation.mutate({ id: editingId, word: editForm });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Czy na pewno chcesz usunąć to słówko?')) {
      deleteWordMutation.mutate(id);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Słówka</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {/* Add Form */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-2 mb-6">
            <input
              {...form.register('term')}
              className="border rounded p-2"
              placeholder="Term (np. apple)"
              required
            />
            {form.formState.errors.term && (
              <p className="text-sm text-red-500">{form.formState.errors.term.message}</p>
            )}
            
            <input
              {...form.register('translation')}
              className="border rounded p-2"
              placeholder="Translation (np. jabłko)"
            />
            
            <input
              {...form.register('example')}
              className="border rounded p-2"
              placeholder="Example (np. I eat an apple.)"
            />
            
            <Button
              type="submit"
              disabled={addWordMutation.isPending}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {addWordMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Dodaj
            </Button>
          </form>

          {/* Error Display */}
          {error && (
            <div className="bg-red-100 text-red-700 p-2 rounded mb-4">
              Błąd: {error.message}
            </div>
          )}

          {/* Words List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Ładowanie słówek...</span>
            </div>
          ) : (
            <div className="grid gap-3">
              {words.map((word) => (
                <div key={word.id} className="border rounded p-3">
                  {editingId === word.id ? (
                    // Edit mode
                    <div className="space-y-2">
                      <input
                        value={editForm.term}
                        onChange={(e) => setEditForm(prev => ({ ...prev, term: e.target.value }))}
                        className="border rounded p-2 w-full"
                        placeholder="Term"
                      />
                      <input
                        value={editForm.translation}
                        onChange={(e) => setEditForm(prev => ({ ...prev, translation: e.target.value }))}
                        className="border rounded p-2 w-full"
                        placeholder="Translation"
                      />
                      <input
                        value={editForm.example}
                        onChange={(e) => setEditForm(prev => ({ ...prev, example: e.target.value }))}
                        className="border rounded p-2 w-full"
                        placeholder="Example"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={handleUpdate}
                          disabled={updateWordMutation.isPending}
                          size="sm"
                        >
                          {updateWordMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Zapisz'
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingId(null);
                            setEditForm({ term: '', translation: '', example: '' });
                          }}
                          size="sm"
                        >
                          Anuluj
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Display mode
                    <div>
                      <div className="font-semibold">{word.term}</div>
                      {word.translation && (
                        <div className="text-sm opacity-80">{word.translation}</div>
                      )}
                      {word.example && (
                        <div className="text-sm italic opacity-80">{word.example}</div>
                      )}
                      <div className="mt-2 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(word)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edytuj
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(word.id)}
                          disabled={deleteWordMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Usuń
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {words.length === 0 && !isLoading && (
                <div className="text-center py-8 text-gray-500">
                  Brak wpisów. Dodaj pierwsze słówko 👆
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
