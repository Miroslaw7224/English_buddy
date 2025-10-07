'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

const CEFR_LEVELS = [
  { level: 'A1', name: 'Pierwsze kroki', description: 'Proste słowa i zdania' },
  { level: 'A2', name: 'Małe rozmowy', description: 'Krótkie dialogi i codzienność' },
  { level: 'B1', name: 'Swobodna mowa', description: 'Mówisz i rozumiesz\n główne tematy' },
  { level: 'B2', name: 'Płynna komunikacja', description: 'Złożone rozmowy i teksty' },
  { level: 'C1', name: 'Profesjonalny', description: 'Naturalny, bogaty język' },
  { level: 'C2', name: 'Mistrzowski', description: 'Jak rodzimy użytkownik' },
] as const;

export default function LevelSelectionPage() {
  const router = useRouter();
  const { updateCefrLevel } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  const handleLevelSelect = async (level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2') => {
    setIsLoading(true);
    try {
      await updateCefrLevel(level);
      router.push('/dashboard');
    } catch (error) {
      console.error('Error updating CEFR level:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTakeTest = () => {
    router.push('/placement-test');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              Wybierz Swój Poziom Angielskiego
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Wybierz swój obecny poziom lub zrób szybki test
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Level Selection */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-2xl">Znam Swój Poziom</CardTitle>
                <CardDescription className="text-gray-300">
                  Wybierz swój obecny poziom CEFR bezpośrednio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {CEFR_LEVELS.map(({ level, name, description }) => (
                    <Button
                      key={level}
                      variant={selectedLevel === level ? "default" : "outline"}
                      className={`h-auto p-3 flex flex-col items-start ${
                        selectedLevel === level 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                      }`}
                      onClick={() => setSelectedLevel(level)}
                    >
                      <Badge variant="secondary" className="mb-2">
                        {level}
                      </Badge>
                      <span className="font-semibold text-sm leading-tight">{name}</span>
                      <span className="text-xs opacity-80 mt-1 leading-tight">{description}</span>
                    </Button>
                  ))}
                </div>
                
                <Button
                  className="w-full mt-6"
                  onClick={() => selectedLevel && handleLevelSelect(selectedLevel as any)}
                  disabled={!selectedLevel || isLoading}
                >
                  {isLoading ? 'Zapisywanie...' : 'Kontynuuj z Wybranym Poziomem'}
                </Button>
              </CardContent>
            </Card>

            {/* Placement Test */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-2xl">Zrób Szybki Test</CardTitle>
                <CardDescription className="text-gray-300">
                  Odpowiedz na 3-5 pytań aby automatycznie znaleźć swój poziom
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      1
                    </div>
                    <span className="text-white">Rozumienie ze słuchu</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      2
                    </div>
                    <span className="text-white">Znajomość gramatyki</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      3
                    </div>
                    <span className="text-white">Rozumienie tekstu</span>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-blue-500/20 rounded-lg">
                  <p className="text-blue-200 text-sm">
                    <strong>Test Adaptacyjny:</strong> Zaczyna od poziomu B1 i dostosowuje się do Twoich odpowiedzi. 
                    Trwa około 3-5 minut.
                  </p>
                </div>
                
                <Button
                  className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  onClick={handleTakeTest}
                >
                  Rozpocznij Test Poziomujący
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
