'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, TrendingUp } from 'lucide-react';
import { getDashboardData } from '@/lib/api';

export function WeeklyMinutesCard() {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardData,
  });

  const dailyGoal = 30; // minutes per day
  const weeklyMinutes = dashboardData?.weekly_stats.total_minutes || 0;
  const todayMinutes = dashboardData?.user_progress.minutes_studied || 0;

  const weeklyGoal = dailyGoal * 7;
  const progressPercentage = Math.min((weeklyMinutes / weeklyGoal) * 100, 100);
  const todayProgressPercentage = Math.min((todayMinutes / dailyGoal) * 100, 100);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

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
          <Clock className="h-5 w-5" />
          ⏱️ Czas nauki w tym tygodniu
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-400">
            {formatTime(weeklyMinutes)}
          </div>
          <p className="text-gray-300 text-sm">w tym tygodniu</p>
        </div>

        {/* Weekly Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-300">Cel tygodniowy</span>
            <span className="text-gray-300">{formatTime(weeklyGoal)}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Today's Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-300">Dzisiaj</span>
            <span className="text-gray-300">{formatTime(todayMinutes)}/{formatTime(dailyGoal)}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${todayProgressPercentage}%` }}
            />
          </div>
        </div>

        <div className="flex justify-center">
          <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
            <TrendingUp className="h-3 w-3 mr-1" />
            {Math.round(progressPercentage)}% celu tygodniowego
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
