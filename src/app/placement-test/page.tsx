'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Loader2, Send, ChevronDown, ChevronRight } from 'lucide-react';

interface Message {
  role: 'agent' | 'user';
  content: string;
  timestamp: number;
}

interface TestState {
  session_id: string | null;
  state: string;
  turn: number;
  total_turns: number;
  estimate: number;
  messages: Message[];
  isCompleted: boolean;
  final_cefr?: string;
  scores?: any[];
  used_topics?: string[];
}

export default function PlacementTestPage() {
  const router = useRouter();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const [testState, setTestState] = useState<TestState>({
    session_id: null,
    state: 'INIT',
    turn: 0,
    total_turns: 8,
    estimate: 3.0,
    messages: [],
    isCompleted: false
  });
  
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<string[]>([]);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  // Start test on mount
  useEffect(() => {
    startTest();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [testState.messages]);

  // Auto-focus input after agent response
  useEffect(() => {
    if (!isLoading && testState.messages.length > 0) {
      const lastMessage = testState.messages[testState.messages.length - 1];
      if (lastMessage.role === 'agent') {
        // Small delay to ensure UI is updated
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }
    }
  }, [isLoading, testState.messages]);

  const startTest = async () => {
    setIsLoading(true);
    try {
      // Get auth token from supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/placement-agent/start', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      
      const data = await response.json();
      
      setTestState(prev => ({
        ...prev,
        session_id: data.session_id,
        state: data.state,
        turn: data.turn,
        total_turns: data.total_turns,
        used_topics: [],
        messages: [
          {
            role: 'agent',
            content: data.agent_message,
            timestamp: Date.now()
          }
        ]
      }));
    } catch (error) {
      console.error('Error starting test:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userInput.trim() || isLoading) return;

    const message = userInput.trim();
    setUserInput('');

    // Add user message
    setTestState(prev => ({
      ...prev,
      messages: [...prev.messages, {
        role: 'user',
        content: message,
        timestamp: Date.now()
      }]
    }));

    setIsLoading(true);

    try {
      // Get auth token from supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/placement-agent/next', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          session_id: testState.session_id,
          user_message: message,
          state: testState.state,
          history: testState.messages.filter(m => m.role === 'agent').map(m => m.content),
          estimate: testState.estimate,
          used_topics: testState.used_topics || []
        })
      });

      const data = await response.json();

      if (data.state === 'DONE') {
        // Calculate final CEFR
        const finalCefr = calculateFinalCefr(testState.estimate);
        
        // Finalize test
        await finalizeTest(testState.session_id!, finalCefr);
        
        setTestState(prev => ({
          ...prev,
          isCompleted: true,
          final_cefr: finalCefr
        }));
      } else {
        setTestState(prev => ({
          ...prev,
          state: data.state,
          turn: data.turn,
          estimate: data.estimate || prev.estimate,
          used_topics: data.used_topics || prev.used_topics,
          messages: [...prev.messages, {
            role: 'agent',
            content: data.agent_message,
            timestamp: Date.now()
          }]
        }));
      }
    } catch (error) {
      console.error('Error processing response:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const finalizeTest = async (sessionId: string, finalCefr: string) => {
    try {
      // Get auth token from supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/placement-agent/finalize', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          session_id: sessionId,
          final_cefr: finalCefr,
          confidence: 0.8
        })
      });
      
      const data = await response.json();
      if (data.feedback) {
        setFeedback(data.feedback);
      }
    } catch (error) {
      console.error('Error finalizing test:', error);
    }
  };

  const calculateFinalCefr = (estimate: number): string => {
    const level = Math.max(1, Math.min(6, Math.round(estimate)));
    return ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'][level - 1];
  };

  if (testState.isCompleted && testState.final_cefr) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader className="text-center">
                <CardTitle className="text-white text-3xl mb-4">Test zakończony!</CardTitle>
                <CardDescription className="text-gray-300 text-lg">
                  Twój poziom języka angielskiego został oceniony
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <Badge className="text-3xl px-8 py-4 bg-green-600">
                    {testState.final_cefr}
                  </Badge>
                  <p className="text-white text-xl mt-4">Twój poziom języka angielskiego</p>
                </div>
                
                <div className="p-4 bg-white/10 rounded-lg space-y-2">
                  <p className="text-gray-300 text-center">
                    {testState.final_cefr === 'A1' && "Rozumiesz podstawowe zwroty i potrafisz się przedstawić."}
                    {testState.final_cefr === 'A2' && "Potrafisz komunikować się w prostych zadaniach i opisać swoje pochodzenie."}
                    {testState.final_cefr === 'B1' && "Potrafisz wyrażać opinie na znane tematy i radzić sobie w większości sytuacji."}
                    {testState.final_cefr === 'B2' && "Potrafisz wyrażać się jasno i prowadzić abstrakcyjne dyskusje."}
                    {testState.final_cefr === 'C1' && "Potrafisz elastycznie używać języka w celach społecznych, akademickich i zawodowych."}
                    {testState.final_cefr === 'C2' && "Potrafisz wyrażać się spontanicznie i precyzyjnie w złożonych sytuacjach."}
                  </p>
                  <p className="text-gray-400 text-sm text-center">
                    {testState.final_cefr <= 'B1' && "Następny krok: ćwicz gramatykę i rozszerzaj słownictwo."}
                    {testState.final_cefr === 'B2' && "Następny krok: ćwicz złożoną gramatykę i idiomy, aby osiągnąć C1."}
                    {testState.final_cefr >= 'C1' && "Kontynuuj ćwiczenia, aby utrzymać i poprawić płynność."}
                  </p>
                </div>

                {/* Feedback Section - Always show for debugging */}
                <div className="mt-6">
                  <Collapsible open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen}>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full bg-white/10 border-white/30 text-white hover:bg-white/20"
                      >
                        <span className="flex items-center gap-2">
                          {isFeedbackOpen ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          Sprawdź swoje błędy ({feedback.length})
                        </span>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-4">
                      <div className="bg-white/5 rounded-lg p-4 space-y-3">
                        {feedback.length > 0 ? (
                          feedback.map((item, index) => (
                            <div key={index} className="text-gray-300 text-sm">
                              • {item}
                            </div>
                          ))
                        ) : (
                          <div className="text-gray-400 text-sm">
                            Brak feedback do wyświetlenia
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>

                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 mt-4"
                  onClick={() => router.push('/dashboard')}
                >
                  Przejdź do Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h1 className="text-2xl font-bold text-white">English Level Assessment</h1>
              <Badge variant="outline" className="text-white border-white/20">
                Question {testState.turn} / {testState.total_turns}
              </Badge>
            </div>
            <p className="text-gray-300">
              Answer naturally (40-80 words per answer). The test adapts to your level. Time: 7-8 minutes.
            </p>
          </div>

          {/* Chat Area */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-4">
            <CardContent className="p-6">
              <ScrollArea className="h-[400px] pr-4" ref={scrollAreaRef}>
                <div className="space-y-4">
                  {testState.messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-4 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white/20 text-white'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white/20 text-white p-4 rounded-lg">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Input Area */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <textarea
                  ref={inputRef}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  placeholder="Type your answer here..."
                  className="flex-1 min-h-[80px] p-3 rounded-md bg-white/10 text-white border border-white/20 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  disabled={isLoading}
                  maxLength={500}
                />
                <Button
                  type="submit"
                  disabled={!userInput.trim() || isLoading}
                  className="bg-blue-600 hover:bg-blue-700 self-end"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </form>
              <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
                <span>Press Enter to send, Shift+Enter for new line</span>
                <span>{userInput.length}/500</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
