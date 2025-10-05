'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, CheckCircle, Circle } from 'lucide-react';
import { getDashboardData } from '@/lib/api';

export function TodayProgressCard() {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardData,
  });

  const dailyLessons = dashboardData?.daily_lessons || [];
  const completedTasks = dailyLessons.filter(lesson => lesson.completed).length;
  const totalTasks = Math.max(dailyLessons.length, 4); // Minimum 4 tasks
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const totalPoints = dashboardData?.user_progress.points_earned || 0;

  if (isLoading) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-white/20 rounded mb-4"></div>
            <div className="h-8 bg-white/20 rounded mb-2"></div>
            <div className="h-3 bg-white/10 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Target className="h-5 w-5" />
          🎯 Today's Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Overview */}
        <div className="text-center">
          <div className="text-3xl font-bold text-green-400">
            {completedTasks}/{totalTasks}
          </div>
          <p className="text-gray-300 text-sm">tasks completed</p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-300">Progress</span>
            <span className="text-gray-300">{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Tasks List */}
        <div className="space-y-2">
          {dailyLessons.length > 0 ? (
            dailyLessons.map((lesson) => (
              <div
                key={lesson.id}
                className={`flex items-center justify-between p-2 rounded-lg ${
                  lesson.completed ? 'bg-green-500/20' : 'bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2">
                  {lesson.completed ? (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  ) : (
                    <Circle className="h-4 w-4 text-gray-400" />
                  )}
                  <span className={`text-sm ${lesson.completed ? 'text-white' : 'text-gray-300'}`}>
                    {lesson.title}
                  </span>
                </div>
                <Badge
                  variant="secondary"
                  className={`text-xs ${
                    lesson.completed
                      ? 'bg-green-500/20 text-green-300'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}
                >
                  +{lesson.points}
                </Badge>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-400 text-sm py-4">
              No lessons scheduled for today
            </div>
          )}
        </div>

        {/* Points Summary */}
        <div className="flex justify-center">
          <Badge variant="secondary" className="bg-green-500/20 text-green-300">
            {totalPoints} points earned today
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
