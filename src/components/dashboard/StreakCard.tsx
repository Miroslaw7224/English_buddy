'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, Calendar } from 'lucide-react';
import { getDashboardData } from '@/lib/api';

export function StreakCard() {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardData,
  });

  const streak = dashboardData?.current_streak || 0;
  const bestStreak = dashboardData?.best_streak || 0;

  const getStreakMessage = () => {
    if (streak === 0) return "Start your streak today!";
    if (streak < 3) return "Keep it up!";
    if (streak < 7) return "Great progress!";
    if (streak < 14) return "Amazing dedication!";
    return "You're on fire! 🔥";
  };

  const getStreakColor = () => {
    if (streak === 0) return "text-gray-400";
    if (streak < 3) return "text-yellow-400";
    if (streak < 7) return "text-orange-400";
    return "text-red-400";
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
          <Flame className="h-5 w-5" />
          🔥 Current Streak
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className={`text-4xl font-bold ${getStreakColor()}`}>
            {streak}
          </div>
          <p className="text-gray-300 text-sm">days in a row</p>
        </div>

        <div className="space-y-2">
          <p className="text-gray-300 text-sm text-center">
            {getStreakMessage()}
          </p>
          
          <div className="flex justify-center">
            <Badge variant="secondary" className="bg-orange-500/20 text-orange-300">
              <Calendar className="h-3 w-3 mr-1" />
              Best: {bestStreak} days
            </Badge>
          </div>
        </div>

        {/* Streak visualization */}
        <div className="flex justify-center gap-1 pt-2">
          {Array.from({ length: 7 }).map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full ${
                index < streak
                  ? 'bg-orange-400'
                  : 'bg-gray-600'
              }`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
