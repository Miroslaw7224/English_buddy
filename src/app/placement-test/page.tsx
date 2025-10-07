'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send } from 'lucide-react';

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

  const startTest = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/placement-agent/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
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
      const response = await fetch('/api/placement-agent/next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      inputRef.current?.focus();
    }
  };

  const finalizeTest = async (sessionId: string, finalCefr: string) => {
    try {
      await fetch('/api/placement-agent/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          final_cefr: finalCefr,
          confidence: 0.8
        })
      });
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
                <CardTitle className="text-white text-3xl mb-4">Test Completed!</CardTitle>
                <CardDescription className="text-gray-300 text-lg">
                  Your English level has been assessed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <Badge className="text-3xl px-8 py-4 bg-green-600">
                    {testState.final_cefr}
                  </Badge>
                  <p className="text-white text-xl mt-4">Your English Level</p>
                </div>
                
                <div className="p-4 bg-white/10 rounded-lg space-y-2">
                  <p className="text-gray-300 text-center">
                    {testState.final_cefr === 'A1' && "You understand basic phrases and can introduce yourself."}
                    {testState.final_cefr === 'A2' && "You can communicate in simple tasks and describe your background."}
                    {testState.final_cefr === 'B1' && "You can express opinions on familiar topics and handle most situations."}
                    {testState.final_cefr === 'B2' && "You can express yourself clearly and handle abstract discussions."}
                    {testState.final_cefr === 'C1' && "You can use language flexibly for social, academic, and professional purposes."}
                    {testState.final_cefr === 'C2' && "You can express yourself spontaneously and precisely in complex situations."}
                  </p>
                  <p className="text-gray-400 text-sm text-center">
                    {testState.final_cefr <= 'B1' && "Next step: practice grammar and expand your vocabulary."}
                    {testState.final_cefr === 'B2' && "Next step: practice complex grammar and idioms to reach C1."}
                    {testState.final_cefr >= 'C1' && "Continue practicing to maintain and enhance your fluency."}
                  </p>
                </div>

                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                  onClick={() => router.push('/dashboard')}
                >
                  Continue to Dashboard
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
