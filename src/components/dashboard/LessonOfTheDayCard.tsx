'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Play, CheckCircle } from 'lucide-react';
import { getDashboardData } from '@/lib/api';

export function LessonOfTheDayCard() {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardData,
  });

  // Get the first incomplete lesson or default lesson
  const lesson = dashboardData?.daily_lessons?.find(l => !l.completed) || {
    id: 1,
    title: "Codzienna praktyka konwersacji",
    description: "Ćwicz codzienne rozmowy po angielsku",
    type: "chat" as const,
    duration: 15,
    difficulty: "beginner" as const,
    completed: false,
    points: 25
  };

  const handleStartLesson = () => {
    if (lesson.type === 'chat') {
      window.location.href = '/chat';
    } else if (lesson.type === 'words') {
      window.location.href = '/words';
    } else {
      window.location.href = '/chat'; // Default fallback
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-white/20 rounded mb-4"></div>
            <div className="h-6 bg-white/20 rounded mb-2"></div>
            <div className="h-3 bg-white/10 rounded mb-4"></div>
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
          <BookOpen className="h-5 w-5" />
          🧭 Lekcja dnia
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-white">{lesson.title}</h3>
          <p className="text-gray-300 text-sm">{lesson.description}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
            {lesson.duration} min
          </Badge>
          <Badge variant="secondary" className="bg-green-500/20 text-green-300">
            {lesson.difficulty === 'beginner' ? 'początkujący' : lesson.difficulty === 'intermediate' ? 'średniozaawansowany' : 'zaawansowany'}
          </Badge>
          <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
            +{lesson.points} pkt
          </Badge>
        </div>

        <div className="pt-2">
          {lesson.completed ? (
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm">Ukończono!</span>
            </div>
          ) : (
            <Button
              onClick={handleStartLesson}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Play className="h-4 w-4 mr-2" />
              Rozpocznij lekcję
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
