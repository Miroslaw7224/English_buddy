'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WordsModal } from '@/components/words/WordsModal';
import { useUIStore } from '@/stores/ui';
import { getWords } from '@/lib/api';
import { TopBar } from '@/components/layout/TopBar';
import { useAuthStore } from '@/stores/auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ErrorBanner } from '@/components/ui/error-banner';
import { EmptyState } from '@/components/EmptyState';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function WordsPage() {
  const { modals, setModal } = useUIStore();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingWord, setEditingWord] = useState(null);
  const queryClient = useQueryClient();

  const { data: words = [], isLoading, error } = useQuery({
    queryKey: ['words', user?.id],
    queryFn: getWords,
  });

  const filteredWords = words.filter(word =>
    word.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
    word.translation?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Delete word mutation using Supabase
  const deleteWordMutation = useMutation({
    mutationFn: async (id: string) => {
      const { deleteWord } = await import('@/lib/api');
      return deleteWord(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['words', user?.id] });
      toast({
        title: "🗑️ Usunięto słówko",
        duration: 3000,
      });
    },
  });

  const handleEdit = (word: any) => {
    setEditingWord(word);
    setModal('words', true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Czy na pewno chcesz usunąć to słówko?')) {
      deleteWordMutation.mutate(id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <TopBar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
      {error && <ErrorBanner message={(error as any)?.message || 'Nie udało się załadować słówek'} />}
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Moje słówka</h1>
          <p className="text-gray-300 mt-2">
            Zarządzaj swoim słownictwem angielskim
          </p>
        </div>
        <Button
          onClick={() => setModal('words', true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Dodaj nowe słówko
        </Button>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Szukaj słówek..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {isLoading ? (
        <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-600/30 rounded-lg overflow-hidden">
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-20" />
              </div>
            ))}
          </div>
        </div>
      ) : filteredWords.length === 0 ? (
        <EmptyState
          icon={searchTerm ? "🔍" : "📚"}
          title={searchTerm ? "Nie znaleziono słówek" : "Nie dodano jeszcze żadnych słówek"}
          description={searchTerm ? "Spróbuj innej frazy wyszukiwania" : "Zacznij budować swoje słownictwo dodając pierwsze słówko"}
          actionLabel={!searchTerm ? "Dodaj pierwsze słówko" : undefined}
          onAction={!searchTerm ? () => setModal('words', true) : undefined}
        />
      ) : (
        <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-600/30 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-700/50 border-b border-gray-600/30">
              <tr>
                <th className="text-left p-4 text-white font-semibold">Słowo</th>
                <th className="text-left p-4 text-white font-semibold">Tłumaczenie</th>
                <th className="text-left p-4 text-white font-semibold">Przykład</th>
                <th className="text-left p-4 text-white font-semibold">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {filteredWords.map((word) => (
                <tr key={word.word_id} className="border-b border-gray-600/20 hover:bg-gray-700/30 transition-colors">
                  <td className="p-4 text-white font-medium">{word.term}</td>
                  <td className="p-4 text-gray-300">{word.translation || '-'}</td>
                  <td className="p-4 text-gray-400 italic text-sm">
                    {word.examples?.[0]?.text ? `"${word.examples[0].text}"` : '-'}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                        onClick={() => handleEdit(word)}
                      >
                        Edytuj
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-red-500/20 border-red-500/30 text-red-300 hover:bg-red-500/30"
                        onClick={() => handleDelete(word.word_id)}
                        disabled={deleteWordMutation.isPending}
                      >
                        {deleteWordMutation.isPending ? 'Usuwanie...' : 'Usuń'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <WordsModal
        isOpen={modals.words}
        onClose={() => setModal('words', false)}
      />
      </div>
    </div>
  );
}
