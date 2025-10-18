'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, Volume2, VolumeX } from 'lucide-react';

interface QuizTask {
  type: 'multiple_choice';
  prompt: string;
  options: string[];
  answer_index: number;
  feedback_correct: string;
  feedback_incorrect: string;
}

interface Quiz {
  tasks: QuizTask[];
}

interface Flashcard {
  word_id: string;
  term: string;
  translation: string;
  definition: string;
  part_of_speech: string;
  cefr: string;
  category?: string;
  examples: Array<{
    text: string;
    translation: string | null;
  }>;
  audio_url: string | null;
  ipa: string | null;
  quiz?: Quiz;
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
  const [guessMode, setGuessMode] = useState(true);
  const [userGuess, setUserGuess] = useState('');
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [quizMode, setQuizMode] = useState(false);
  const [userProgress, setUserProgress] = useState<Record<string, any>>({});
  const [isSavingProgress, setIsSavingProgress] = useState(false);
  const [showOnlyNew, setShowOnlyNew] = useState(false);

  const getFilteredCards = () => {
    if (!showOnlyNew) return flashcards;
    return flashcards.filter(card => {
      const progress = userProgress[card.word_id];
      return !progress || (progress.streak || 0) < 3;
    });
  };

  const currentCards = getFilteredCards();
  const currentCard = currentCards[currentIndex];
  const hasQuiz = currentCard?.quiz && currentCard.quiz.tasks.length > 0;

  // Load user progress on mount (fetch all progress for level, not individual word_ids)
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const response = await fetch(`/api/flashcard-progress?level=${level}`, {
          credentials: 'include'
        });
        const data = await response.json();
        
        if (response.ok) {
          const progress = data.progress || {};
          setUserProgress(progress);

          // Find first card without progress or with streak < 3 (still learning)
          const firstUnlearnedIndex = flashcards.findIndex((card) => {
            const cardProgress = progress[card.word_id];
            return !cardProgress || (cardProgress.streak || 0) < 3;
          });

          if (firstUnlearnedIndex > 0) {
            setCurrentIndex(firstUnlearnedIndex);
          }
        }
      } catch (error) {
        console.error('Error loading progress:', error);
      }
    };

    if (level && flashcards.length > 0) {
      loadProgress();
    }
  }, [level, flashcards]);

  // Save progress after answering
  const saveProgress = async (wordId: string, quality: number) => {
    try {
      setIsSavingProgress(true);
      const response = await fetch('/api/flashcard-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          word_id: wordId,
          level,
          category: currentCard?.category,
          quality
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setUserProgress(prev => ({
          ...prev,
          [wordId]: data.progress
        }));
      }
    } catch (error) {
      console.error('Error saving progress:', error);
    } finally {
      setIsSavingProgress(false);
    }
  };

  const handleNext = async () => {
    // Wait for any pending saves
    if (isSavingProgress) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    if (currentIndex < currentCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
      setUserGuess('');
      setShowResult(false);
      setShowHint(false);
      setSelectedAnswer(null);
      setCurrentTaskIndex(0);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
      setUserGuess('');
      setShowResult(false);
      setShowHint(false);
      setSelectedAnswer(null);
      setCurrentTaskIndex(0);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleGuess = async () => {
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

    // Save progress (quality: 5 = perfect, 3 = correct but hesitant, 0 = wrong)
    const quality = isAnswerCorrect ? 5 : 0;
    await saveProgress(currentCard.word_id, quality);

    // Auto-advance to next card after correct answer
    if (isAnswerCorrect) {
      setTimeout(() => {
        handleNext();
      }, 1500);
    }
  };

  const handleQuizAnswer = async (optionIndex: number) => {
    if (!currentCard?.quiz) return;
    
    const currentTask = currentCard.quiz.tasks[currentTaskIndex];
    const isAnswerCorrect = optionIndex === currentTask.answer_index;
    
    setSelectedAnswer(optionIndex);
    setIsCorrect(isAnswerCorrect);
    setShowResult(true);
    
    // Update session stats
    setSessionStats(prev => ({
      correct: prev.correct + (isAnswerCorrect ? 1 : 0),
      total: prev.total + 1
    }));

    // Save progress
    const quality = isAnswerCorrect ? 5 : 0;
    await saveProgress(currentCard.word_id, quality);

    // Auto-advance after correct answer
    if (isAnswerCorrect) {
      setTimeout(() => {
        if (currentTaskIndex < currentCard.quiz!.tasks.length - 1) {
          handleNextTask();
        } else {
          handleNext();
        }
      }, 1500);
    }
  };

  const handleNextTask = () => {
    if (currentCard?.quiz && currentTaskIndex < currentCard.quiz.tasks.length - 1) {
      setCurrentTaskIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
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
    setSelectedAnswer(null);
    setCurrentTaskIndex(0);
    setShowOnlyNew(false);
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
        <p>Brak fiszek dla tego poziomu.</p>
        <p className="text-sm text-gray-400 mt-2">
          Debug: {flashcards.length} fiszek załadowanych, currentIndex: {currentIndex}
        </p>
        <Button onClick={onBack} className="mt-4">
          Powrót do Wyboru Poziomu
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
          ← Powrót do Poziomów
        </Button>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => {
                if (quizMode) {
                  setQuizMode(false);
                  setGuessMode(true);
                } else {
                  setGuessMode(!guessMode);
                }
                setShowResult(false);
                setSelectedAnswer(null);
                setCurrentTaskIndex(0);
              }}
              className={guessMode && !quizMode ? "bg-blue-600 hover:bg-blue-700" : "bg-purple-600 hover:bg-purple-700"}
            >
              {guessMode && !quizMode ? '🎯 Tryb Zgadywania' : '📖 Tryb Nauki'}
            </Button>
            {hasQuiz && (
              <Button
                variant={quizMode ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setQuizMode(!quizMode);
                  setGuessMode(false);
                  setShowResult(false);
                  setSelectedAnswer(null);
                  setCurrentTaskIndex(0);
                }}
                className={quizMode ? "bg-green-600 hover:bg-green-700" : "bg-white/20 border-white/30 text-white hover:bg-white/30"}
              >
                {quizMode ? '✅ Tryb Quiz' : '🎲 Tryb Quiz'}
              </Button>
            )}
          </div>
          <div className="text-white flex items-center gap-4">
            <Badge className="bg-blue-600">{level}</Badge>
            <span>
              {currentIndex + 1} / {currentCards.length}
            </span>
            {currentCard && userProgress[currentCard.word_id] ? (
              <div className="flex items-center gap-2 text-sm">
                <Badge className="bg-green-600">
                  🔥 {userProgress[currentCard.word_id].streak || 0}
                </Badge>
                <Badge className="bg-purple-600">
                  📊 {userProgress[currentCard.word_id].total_reviews || 0}
                </Badge>
                {(userProgress[currentCard.word_id].streak || 0) >= 3 && (
                  <Badge className="bg-yellow-600">
                    ✅ Nauczone
                  </Badge>
                )}
              </div>
            ) : (
              <Badge className="bg-gray-600">
                🆕 Nowa fiszka
              </Badge>
            )}
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

      {/* Stats Panel */}
      <div className="fixed left-4 top-1/2 transform -translate-y-1/2 z-10">
        <div className="bg-purple-900/90 backdrop-blur-sm rounded-lg p-4 border border-purple-700 shadow-lg">
          <div className="text-center">
            <div className="text-lg font-bold text-white mb-3">
              🎯 Statystyki {level}
            </div>
              <div className="space-y-2 text-sm">
                <div className="text-green-400">
                  Nauczone: {Object.values(userProgress).filter((p: any) => (p.streak || 0) >= 3).length} / {flashcards.length}
                </div>
                <div className="text-yellow-400">
                  W nauce: {Object.values(userProgress).filter((p: any) => (p.streak || 0) > 0 && (p.streak || 0) < 3).length}
                </div>
                <div className="text-blue-400">
                  Nowe: {flashcards.length - Object.keys(userProgress).length}
                </div>
                {sessionStats.total > 0 && (
                  <div className="text-purple-400 pt-2 border-t border-purple-600">
                    Sesja: {sessionStats.correct}/{sessionStats.total}
                  </div>
                )}
                {isSavingProgress && (
                  <div className="text-yellow-400 text-xs">
                    💾 Zapisywanie...
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Flashcard */}
      <div className="max-w-2xl mx-auto">
        <Card
          className={`transition-transform duration-500 transform-gpu ${
            isFlipped ? 'rotate-y-180' : ''
          } bg-white/10 backdrop-blur-sm border-white/20 ${
            !guessMode && !quizMode ? 'cursor-pointer' : ''
          }`}
          onClick={!guessMode && !quizMode ? handleFlip : undefined}
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
                
                {quizMode && hasQuiz ? (
                  <div className="space-y-4">
                    <p className="text-gray-300 text-lg">{currentCard.quiz!.tasks[currentTaskIndex].prompt}</p>
                    
                    <div className="grid grid-cols-1 gap-3">
                      {currentCard.quiz!.tasks[currentTaskIndex].options.map((option, index) => (
                        <Button
                          key={index}
                          onClick={() => !showResult && handleQuizAnswer(index)}
                          disabled={showResult}
                          className={`
                            py-6 text-lg
                            ${showResult && index === currentCard.quiz!.tasks[currentTaskIndex].answer_index
                              ? 'bg-green-600 hover:bg-green-700 border-2 border-green-400'
                              : showResult && selectedAnswer === index
                              ? 'bg-red-600 hover:bg-red-700 border-2 border-red-400'
                              : selectedAnswer === index
                              ? 'bg-blue-600 hover:bg-blue-700 border-2 border-blue-400'
                              : 'bg-white/20 hover:bg-white/30 border border-white/30'
                            }
                          `}
                        >
                          {option}
                        </Button>
                      ))}
                    </div>
                    
                    {showResult && (
                      <div className="space-y-4">
                        <div className={`text-lg font-semibold ${
                          isCorrect ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {isCorrect ? '✅ Correct!' : '❌ Incorrect'}
                        </div>
                        <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
                          <p className="text-blue-200">
                            {isCorrect 
                              ? currentCard.quiz!.tasks[currentTaskIndex].feedback_correct
                              : currentCard.quiz!.tasks[currentTaskIndex].feedback_incorrect
                            }
                          </p>
                        </div>
                        
                        {currentTaskIndex < currentCard.quiz!.tasks.length - 1 ? (
                          <Button
                            onClick={handleNextTask}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Następne Pytanie →
                          </Button>
                        ) : null}
                      </div>
                    )}
                  </div>
                ) : guessMode ? (
                  <div className="space-y-4">
                    <p className="text-gray-300 text-lg">Co oznacza to słowo?</p>
                    
                    {/* Hint */}
                    {!showHint && !showResult && (
                      <Button
                        onClick={handleShowHint}
                        variant="outline"
                        size="sm"
                        className="bg-yellow-500/20 border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/30"
                      >
                        💡 Pokaż Wskazówkę
                      </Button>
                    )}
                    
                    {showHint && !showResult && (
                      <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
                        <p className="text-yellow-300 text-sm">
                          <strong>Wskazówka:</strong> {currentCard.definition}
                        </p>
                        {currentCard.examples && currentCard.examples.length > 0 && currentCard.examples[0] && (
                          <p className="text-yellow-200 text-sm mt-1">
                            <strong>Przykład:</strong> "{currentCard.examples[0].text}"
                          </p>
                        )}
                      </div>
                    )}
                    
                    {/* Tags - commented out until added to Flashcard type */}
                    {/* {currentCard.tags && currentCard.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 justify-center">
                        {currentCard.tags.map((tag, index) => (
                          <Badge key={index} className="bg-gray-600 text-white text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )} */}
                    
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
                        placeholder="Wpisz swoją odpowiedź..."
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
                      Pokaż Odpowiedź
                    </Button>
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">
                    Kliknij aby odkryć tłumaczenie
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
                    <p className="text-gray-400 text-sm font-semibold">Przykłady:</p>
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
          Poprzednia
        </Button>
        
        <Button
          onClick={handleFlip}
          variant="outline"
          className="bg-white/20 border-white/30 text-white hover:bg-white/30"
        >
          {isFlipped ? 'Pokaż Termin' : 'Pokaż Tłumaczenie'}
        </Button>
        
        <Button
          onClick={handleNext}
          disabled={currentIndex === currentCards.length - 1}
          variant="outline"
          className="bg-white/20 border-white/30 text-white hover:bg-white/30"
        >
          Następna
        </Button>
      </div>

      {/* Session Controls */}
      <div className="flex items-center justify-center gap-4">
        {Object.keys(userProgress).length > 0 && (
          <Button
            onClick={() => {
              setShowOnlyNew(!showOnlyNew);
              setCurrentIndex(0);
            }}
            variant="outline"
            className={showOnlyNew ? "bg-blue-600 hover:bg-blue-700" : "bg-white/20 border-white/30 text-white hover:bg-white/30"}
          >
            {showOnlyNew ? '✓ Tylko Nierozwiązane' : 'Tylko Nierozwiązane'}
          </Button>
        )}
        
        <Button
          onClick={handleReset}
          variant="outline"
          className="bg-white/20 border-white/30 text-white hover:bg-white/30"
        >
          Resetuj Sesję
        </Button>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="text-center text-gray-400 text-xs">
        <p>Skróty klawiszowe: Enter = Sprawdź odpowiedź, Spacja = Wskazówka/Odwróć, ← → = Nawigacja</p>
      </div>

    </div>
  );
}
