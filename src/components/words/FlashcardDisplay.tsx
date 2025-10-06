'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, Volume2, VolumeX } from 'lucide-react';

interface Flashcard {
  word_id: string;
  term: string;
  translation: string;
  definition: string;
  part_of_speech: string;
  cefr: string;
  examples: Array<{
    text: string;
    translation: string | null;
  }>;
  audio_url: string | null;
  ipa: string | null;
}

interface FlashcardDisplayProps {
  flashcards: Flashcard[];
  level: string;
  onBack: () => void;
}

export function FlashcardDisplay({ flashcards, level, onBack }: FlashcardDisplayProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [guessMode, setGuessMode] = useState(level === 'A1');
  const [userGuess, setUserGuess] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });
  const [shuffledCards, setShuffledCards] = useState<Flashcard[]>([]);
  const [isShuffled, setIsShuffled] = useState(false);

  const currentCards = isShuffled && shuffledCards.length > 0 ? shuffledCards : flashcards;
  const currentCard = currentCards[currentIndex];


  const handleNext = () => {
    if (currentIndex < currentCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
      setUserGuess('');
      setShowResult(false);
      setShowHint(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
      setUserGuess('');
      setShowResult(false);
      setShowHint(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleGuess = () => {
    if (!userGuess.trim()) return;
    if (!currentCard) return;
    
    const correctAnswer = currentCard.translation.toLowerCase().trim();
    const userAnswer = userGuess.toLowerCase().trim();
    
    const isAnswerCorrect = correctAnswer === userAnswer || 
      correctAnswer.includes(userAnswer) || 
      userAnswer.includes(correctAnswer);
    
    setIsCorrect(isAnswerCorrect);
    setShowResult(true);
    
    // Update session stats
    setSessionStats(prev => ({
      correct: prev.correct + (isAnswerCorrect ? 1 : 0),
      total: prev.total + 1
    }));
  };

  const handleReveal = () => {
    setIsFlipped(true);
    setShowResult(true);
  };

  const handleAudio = () => {
    if (currentCard.audio_url && !isAudioPlaying) {
      const audio = new Audio(currentCard.audio_url);
      audio.play();
      setIsAudioPlaying(true);
      audio.onended = () => setIsAudioPlaying(false);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setUserGuess('');
    setShowResult(false);
    setShowHint(false);
    setSessionStats({ correct: 0, total: 0 });
  };

  const handleShuffle = () => {
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    setShuffledCards(shuffled);
    setIsShuffled(true);
    setCurrentIndex(0);
    setShowHint(false);
    setShowResult(false);
    setUserGuess('');
  };

  const handleUnshuffle = () => {
    setIsShuffled(false);
    setCurrentIndex(0);
    setShowHint(false);
    setShowResult(false);
    setUserGuess('');
  };

  const handleShowHint = () => {
    setShowHint(true);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Handle Enter in input field for guess mode
      if (e.key === 'Enter' && guessMode && userGuess.trim()) {
        e.preventDefault();
        handleGuess();
        return;
      }

      // Don't trigger other shortcuts if user is typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === ' ') {
        e.preventDefault();
        if (guessMode) {
          handleShowHint();
        } else {
          handleFlip();
        }
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [guessMode, userGuess]);

  if (!currentCard || !currentCards.length) {
    return (
      <div className="text-center text-white">
        <p>No flashcards available for this level.</p>
        <p className="text-sm text-gray-400 mt-2">
          Debug: {flashcards.length} flashcards loaded, currentIndex: {currentIndex}
        </p>
        <Button onClick={onBack} className="mt-4">
          Back to Level Selection
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          className="bg-white/20 border-white/30 text-white hover:bg-white/30"
        >
          ← Back to Levels
        </Button>
        <div className="flex items-center gap-4">
          {level === 'A1' && (
            <div className="flex items-center gap-2">
              <span className="text-white text-sm">Mode:</span>
              <Button
                variant={guessMode ? "default" : "outline"}
                size="sm"
                onClick={() => setGuessMode(!guessMode)}
                className={guessMode ? "bg-blue-600" : "bg-white/20 border-white/30 text-white hover:bg-white/30"}
              >
                {guessMode ? 'Guess Mode' : 'Study Mode'}
              </Button>
            </div>
          )}
          <div className="text-white">
            <Badge className="bg-blue-600">{level}</Badge>
            <span className="ml-2">
              {currentIndex + 1} / {currentCards.length}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / currentCards.length) * 100}%` }}
        />
      </div>

      {/* Session Stats */}
      {level === 'A1' && sessionStats.total > 0 && (
        <div className="text-center text-white">
          <div className="text-sm">
            Session: {sessionStats.correct}/{sessionStats.total} correct 
            ({Math.round((sessionStats.correct / sessionStats.total) * 100)}%)
          </div>
        </div>
      )}

      {/* Flashcard */}
      <div className="max-w-2xl mx-auto">
        <Card
          className={`transition-transform duration-500 transform-gpu ${
            isFlipped ? 'rotate-y-180' : ''
          } bg-white/10 backdrop-blur-sm border-white/20 ${
            !guessMode ? 'cursor-pointer' : ''
          }`}
          onClick={!guessMode ? handleFlip : undefined}
        >
          <CardContent className="p-8 min-h-[300px] flex flex-col justify-center">
            {!isFlipped ? (
              // Front side
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <h2 className="text-3xl font-bold text-white">{currentCard.term}</h2>
                  {currentCard.audio_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAudio();
                      }}
                      className="text-white hover:bg-white/20"
                    >
                      {isAudioPlaying ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
                
                {currentCard.ipa && (
                  <p className="text-gray-300 text-lg">/{currentCard.ipa}/</p>
                )}
                
                <Badge className="bg-gray-600 text-white">
                  {currentCard.part_of_speech}
                </Badge>
                
                {guessMode ? (
                  <div className="space-y-4">
                    <p className="text-gray-300 text-lg">What does this word mean?</p>
                    
                    {/* Hint */}
                    {!showHint && !showResult && (
                      <Button
                        onClick={handleShowHint}
                        variant="outline"
                        size="sm"
                        className="bg-yellow-500/20 border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/30"
                      >
                        💡 Show Hint
                      </Button>
                    )}
                    
                    {showHint && !showResult && (
                      <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
                        <p className="text-yellow-300 text-sm">
                          <strong>Hint:</strong> {currentCard.definition}
                        </p>
                        {currentCard.examples && currentCard.examples.length > 0 && currentCard.examples[0] && (
                          <p className="text-yellow-200 text-sm mt-1">
                            <strong>Example:</strong> "{currentCard.examples[0].text}"
                          </p>
                        )}
                      </div>
                    )}
                    
                    {/* Tags */}
                    {currentCard.tags && currentCard.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 justify-center">
                        {currentCard.tags.map((tag, index) => (
                          <Badge key={index} className="bg-gray-600 text-white text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {showResult && (
                      <div className={`text-lg font-semibold ${
                        isCorrect ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {isCorrect ? '✅ Correct!' : '❌ Incorrect'}
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={userGuess}
                        onChange={(e) => setUserGuess(e.target.value)}
                        placeholder="Type your answer..."
                        className="flex-1 px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <Button
                        onClick={handleGuess}
                        disabled={!userGuess.trim()}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Sprawdź
                      </Button>
                    </div>
                    <Button
                      onClick={handleReveal}
                      variant="outline"
                      className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                    >
                      Reveal Answer
                    </Button>
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">
                    Click to reveal translation
                  </p>
                )}
              </div>
            ) : (
              // Back side
              <div className="text-center space-y-4">
                <h3 className="text-2xl font-bold text-white">{currentCard.translation}</h3>
                
                <p className="text-gray-300 text-lg">{currentCard.definition}</p>
                
                {currentCard.examples && currentCard.examples.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-gray-400 text-sm font-semibold">Examples:</p>
                    {currentCard.examples.map((example, index) => (
                      <div key={index} className="text-gray-300">
                        <p className="italic">"{example.text}"</p>
                        {example.translation && (
                          <p className="text-sm text-gray-400">"{example.translation}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <Button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          variant="outline"
          className="bg-white/20 border-white/30 text-white hover:bg-white/30"
        >
          Previous
        </Button>
        
        <Button
          onClick={handleFlip}
          variant="outline"
          className="bg-white/20 border-white/30 text-white hover:bg-white/30"
        >
          {isFlipped ? 'Show Term' : 'Show Translation'}
        </Button>
        
        <Button
          onClick={handleNext}
          disabled={currentIndex === currentCards.length - 1}
          variant="outline"
          className="bg-white/20 border-white/30 text-white hover:bg-white/30"
        >
          Next
        </Button>
      </div>

      {/* Session Controls */}
      {level === 'A1' && (
        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={isShuffled ? handleUnshuffle : handleShuffle}
            variant="outline"
            className="bg-white/20 border-white/30 text-white hover:bg-white/30"
          >
            {isShuffled ? 'Unshuffle' : 'Shuffle'}
          </Button>
          
          <Button
            onClick={handleReset}
            variant="outline"
            className="bg-white/20 border-white/30 text-white hover:bg-white/30"
          >
            Reset Session
          </Button>
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      {level === 'A1' && (
        <div className="text-center text-gray-400 text-xs">
          <p>Keyboard shortcuts: Enter = Check answer, Space = Hint/Flip, ← → = Navigate</p>
        </div>
      )}

    </div>
  );
}
