'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth';
import { TopBar } from '@/components/layout/TopBar';
import { LessonOfTheDayCard } from '@/components/dashboard/LessonOfTheDayCard';
import { StreakCard } from '@/components/dashboard/StreakCard';
import { WeeklyMinutesCard } from '@/components/dashboard/WeeklyMinutesCard';
import { MiniStatsCard } from '@/components/dashboard/MiniStatsCard';
import TodaysPlan from '@/components/dashboard/TodaysPlan';
import { getTodayTodos, completeTodayLesson, updateSrsReview, TodayTodo } from '@/lib/api';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // Fetch today's todos
  const { data: todos, isLoading } = useQuery({
    queryKey: ['today-todos'],
    queryFn: getTodayTodos,
  });

  // Mutations for completing tasks
  const completeLessonMutation = useMutation({
    mutationFn: ({ lessonId, timeSpent }: { lessonId: string; timeSpent: number }) =>
      completeTodayLesson(lessonId, timeSpent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-todos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const updateSrsMutation = useMutation({
    mutationFn: ({ reviewId, quality }: { reviewId: string; quality: number }) =>
      updateSrsReview(reviewId, quality),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-todos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  // Transform API data to TodaysPlan format
  const todaysPlanItems = todos?.map((todo: TodayTodo) => ({
    id: todo.item_id,
    kind: todo.kind,
    title: todo.title,
    subtitle: todo.description,
    durationMin: todo.duration,
    points: todo.points,
    difficulty: todo.difficulty as 'beginner' | 'intermediate' | 'advanced',
    status: todo.status === 'completed' ? 'done' : 'todo',
    cta: todo.kind === 'srs' ? 'Review' : 'Start',
  })) || [];

  // Handle item click - navigate or complete task
  const handleItemClick = (item: any) => {
    if (item.status === 'done') return;

    if (item.kind === 'lesson') {
      // Navigate to appropriate page
      if (item.title.toLowerCase().includes('chat')) {
        window.location.href = '/chat';
      } else if (item.title.toLowerCase().includes('flash') || item.title.toLowerCase().includes('vocabulary')) {
        window.location.href = '/words';
      } else {
        window.location.href = '/chat'; // Fallback
      }
    } else if (item.kind === 'srs') {
      // Complete SRS review with quality 3 (good)
      updateSrsMutation.mutate({ reviewId: item.id, quality: 3 });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <TopBar />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {user?.email?.split('@')[0] || 'Student'}! 👋
          </h1>
          <p className="text-gray-300">
            Ready to continue your English learning journey?
          </p>
        </div>

        {/* Today's Plan Section - Top Priority */}
        <div className="mb-8">
          <TodaysPlan 
            items={todaysPlanItems} 
            onItemClick={handleItemClick}
          />
        </div>

        {/* Dashboard Grid 2x2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <LessonOfTheDayCard />
          <StreakCard />
          <WeeklyMinutesCard />
        </div>

        {/* Mini Stats Section */}
        <div className="mt-8">
          <MiniStatsCard />
        </div>
      </div>
    </div>
  );
}
