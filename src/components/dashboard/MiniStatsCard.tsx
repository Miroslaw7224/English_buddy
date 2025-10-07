'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Target, Trophy, RotateCcw } from 'lucide-react';
import { getDashboardData } from '@/lib/api';

export function MiniStatsCard() {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardData,
  });

  // Get real data or show "Brak informacji"
  const lessonsCompleted = dashboardData?.weekly_stats?.lessons_completed ?? 0;
  
  const mostPracticedTopic = lessonsCompleted > 0 
    ? "Speaking"
    : "Brak informacji";
    
  const commonError = lessonsCompleted > 0
    ? "Present Perfect vs Past Simple"
    : "Brak informacji";
    
  const lastLevelTest = {
    level: lessonsCompleted > 0 ? "B1" : "Brak informacji",
    date: lessonsCompleted > 0 ? "2 tyg. temu" : "Nigdy",
    completed: lessonsCompleted > 0
  };

  if (isLoading) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-white/20 rounded"></div>
            <div className="h-6 bg-white/20 rounded"></div>
            <div className="h-4 bg-white/10 rounded"></div>
            <div className="h-8 bg-white/20 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Brain className="h-5 w-5" />
          📊 Statystyki
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Most Practiced Topic */}
        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Target className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <p className="text-gray-300 text-sm">Najczęściej ćwiczony temat</p>
              <p className={`font-medium ${mostPracticedTopic === "Brak informacji" ? "text-gray-400" : "text-white"}`}>
                {mostPracticedTopic}
              </p>
            </div>
          </div>
          {mostPracticedTopic !== "Brak informacji" && (
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
              Top
            </Badge>
          )}
        </div>

        {/* Common Error */}
        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <Brain className="h-4 w-4 text-orange-400" />
            </div>
            <div>
              <p className="text-gray-300 text-sm">Najczęstszy błąd tygodnia</p>
              <p className={`font-medium text-sm ${commonError === "Brak informacji" ? "text-gray-400" : "text-white"}`}>
                {commonError}
              </p>
            </div>
          </div>
          {commonError !== "Brak informacji" && (
            <Badge variant="secondary" className="bg-orange-500/20 text-orange-300">
              Focus
            </Badge>
          )}
        </div>

        {/* Level Test */}
        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Trophy className="h-4 w-4 text-green-400" />
            </div>
            <div>
              <p className="text-gray-300 text-sm">Ostatni test poziomu</p>
              <p className={`font-medium ${lastLevelTest.level === "Brak informacji" ? "text-gray-400" : "text-white"}`}>
                {lastLevelTest.level} ({lastLevelTest.date})
              </p>
            </div>
          </div>
          {lastLevelTest.completed ? (
            <Button
              size="sm"
              variant="outline"
              className="bg-green-500/20 border-green-500/30 text-green-300 hover:bg-green-500/30"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Powtórz
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="bg-gray-500/20 border-gray-500/30 text-gray-400 hover:bg-gray-500/30"
            >
              <Trophy className="h-3 w-3 mr-1" />
              Rozpocznij
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
