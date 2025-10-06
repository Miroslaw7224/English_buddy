'use client';

import { useState, useEffect } from 'react';
import { LevelSelector } from '@/components/words/LevelSelector';
import { FlashcardDisplay } from '@/components/words/FlashcardDisplay';
import { loadFlashcards, Flashcard } from '@/lib/flashcards';
import { TopBar } from '@/components/layout/TopBar';

export default function FlashcardsPage() {
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleLevelSelect = async (level: string) => {
    setSelectedLevel(level);
    setIsLoading(true);
    try {
      const loadedFlashcards = await loadFlashcards(level);
      setFlashcards(loadedFlashcards);
    } catch (error) {
      console.error('Error loading flashcards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartLearning = () => {
    // This will be handled by the parent component
  };

  const handleBackToLevels = () => {
    setSelectedLevel(null);
    setFlashcards([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <TopBar />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">English Flashcards</h1>
          <p className="text-gray-300 text-lg">
            Learn English vocabulary with interactive flashcards
          </p>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-white text-xl">Loading flashcards...</div>
          </div>
        ) : selectedLevel && flashcards.length > 0 ? (
          <FlashcardDisplay
            flashcards={flashcards}
            level={selectedLevel}
            onBack={handleBackToLevels}
          />
        ) : (
          <LevelSelector
            selectedLevel={selectedLevel}
            onLevelSelect={handleLevelSelect}
            onStartLearning={handleStartLearning}
          />
        )}
      </div>
    </div>
  );
}
