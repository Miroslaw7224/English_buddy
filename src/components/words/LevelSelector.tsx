'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const CEFR_LEVELS = [
  { level: 'A1', name: 'Beginner', color: 'bg-green-500', description: 'Basic words and phrases' },
  { level: 'A2', name: 'Elementary', color: 'bg-blue-500', description: 'Simple everyday expressions' },
  { level: 'B1', name: 'Intermediate', color: 'bg-yellow-500', description: 'Familiar topics and situations' },
  { level: 'B2', name: 'Upper Intermediate', color: 'bg-orange-500', description: 'Complex ideas and texts' },
  { level: 'C1', name: 'Advanced', color: 'bg-red-500', description: 'Fluent and spontaneous' },
  { level: 'C2', name: 'Proficiency', color: 'bg-purple-500', description: 'Near-native fluency' },
];

interface LevelSelectorProps {
  selectedLevel: string | null;
  onLevelSelect: (level: string) => void;
  onStartLearning: () => void;
}

export function LevelSelector({ selectedLevel, onLevelSelect, onStartLearning }: LevelSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Choose Your Level</h2>
        <p className="text-gray-300">Select your English proficiency level to start learning</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CEFR_LEVELS.map(({ level, name, color, description }) => (
          <Card
            key={level}
            className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
              selectedLevel === level
                ? 'ring-2 ring-blue-400 bg-white/20'
                : 'bg-white/10 hover:bg-white/15'
            }`}
            onClick={() => onLevelSelect(level)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-lg">{level}</CardTitle>
                <Badge className={`${color} text-white`}>{name}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-sm">{description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedLevel && (
        <div className="text-center">
          <Button
            onClick={onStartLearning}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
          >
            Start Learning {selectedLevel} Flashcards
          </Button>
        </div>
      )}
    </div>
  );
}
