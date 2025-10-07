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
import { ErrorBanner } from '@/components/ui/error-banner';
import { EmptyState } from '@/components/EmptyState';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch today's todos
  const { data: todos, isLoading, error } = useQuery({
    queryKey: ['today-todos'],
    queryFn: getTodayTodos,
  });

  // Mutations for completing tasks
  const completeLessonMutation = useMutation({
    mutationFn: ({ lessonId, timeSpent }: { lessonId: string; timeSpent: number }) =>
      completeTodayLesson(lessonId, timeSpent),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['today-todos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      const todo = todos?.find(t => t.item_id === variables.lessonId);
      toast({
        title: `🎉 ${todo?.title || 'Lekcja'} ukończona!`,
        description: `+${todo?.points || 0} pkt`,
        duration: 3000,
      });
    },
  });

  const updateSrsMutation = useMutation({
    mutationFn: ({ reviewId, quality }: { reviewId: string; quality: number }) =>
      updateSrsReview(reviewId, quality),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-todos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: "✅ Słówko powtórzone",
        duration: 3000,
      });
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
    status: (todo.status === 'completed' ? 'done' : 'todo') as 'done' | 'todo',
    cta: (todo.kind === 'srs' ? 'Review' : 'Start') as 'Review' | 'Start',
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

        {/* Error handling */}
        {error && <ErrorBanner message={(error as any)?.message || 'Failed to load dashboard data'} />}

        {/* Today's Plan Section - Top Priority */}
        <div className="mb-8">
          {isLoading ? (
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-6 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-16 w-16 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : todaysPlanItems.length === 0 ? (
            <EmptyState
              icon="📅"
              title="No tasks for today"
              description="All done! Check back tomorrow for new lessons"
            />
          ) : (
            <TodaysPlan 
              items={todaysPlanItems} 
              onItemClick={handleItemClick}
            />
          )}
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
