'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';
import { useUIStore } from '@/stores/ui';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { chatApi } from '@/lib/api';
import { ChatMessage } from '@/shared/validation/schemas';
import { WordsModal } from '@/components/words/WordsModal';

const LS_KEY = "eb.chat.messages";
const SID_KEY = "eb.chat.sid";

interface Message extends ChatMessage {
  id?: string;
  pending?: boolean;
  error?: boolean;
}

export function ChatPage() {
  const { } = useAuthStore();
  const { setLoading, setModal, modals } = useUIStore();
  
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      return saved ? JSON.parse(saved) : [{ role: "assistant", content: "Witaj!" }];
    } catch { 
      return [{ role: "assistant", content: "Witaj!" }]; 
    }
  });
  
  const [sid] = useState(() => {
    try {
      let v = localStorage.getItem(SID_KEY);
      if (!v) { 
        v = (crypto?.randomUUID?.() ?? String(Date.now())); 
        localStorage.setItem(SID_KEY, v); 
      }
      return v;
    } catch { 
      return "fallback-sid"; 
    }
  });
  
  const [input, setInput] = useState("");
  const [loading, setLoadingState] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Save messages to localStorage
  useEffect(() => {
    try { 
      localStorage.setItem(LS_KEY, JSON.stringify(messages)); 
    } catch {} 
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  // Update loading state in UI store
  useEffect(() => {
    setLoading('chat', loading);
  }, [loading, setLoading]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    
    setError(null);
    const userMsg: Message = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoadingState(true);

    // Placeholder for assistant response
    const placeholderId = crypto.randomUUID();
    setMessages(prev => [...prev, { 
      id: placeholderId, 
      role: "assistant", 
      content: "", 
      pending: true 
    }]);

    try {
      // Try streaming first, fallback to regular request
      try {
        setIsStreaming(true);
        setStreamingText("");
        
        await chatApi.sendMessageStream(
          { 
            message: text, 
            history: next.slice(-10), 
            conversation_id: sid 
          },
          (chunk: string) => {
            setStreamingText(prev => prev + chunk);
          },
          () => {
            // Complete streaming
            setMessages(prev => prev.map(m =>
              m.id === placeholderId 
                ? { role: "assistant", content: streamingText || "Brak odpowiedzi." } 
                : m
            ));
            setStreamingText("");
            setIsStreaming(false);
          },
          (error: Error) => {
            // Streaming failed, try regular request
            console.warn('Streaming failed, falling back to regular request:', error);
            sendRegularMessage(placeholderId, text, next);
          }
        );
      } catch {
        // Fallback to regular request
        sendRegularMessage(placeholderId, text, next);
      }
    } catch (e: unknown) {
      // Show error in placeholder
      setMessages(prev => prev.map(m =>
        m.id === placeholderId 
          ? { ...m, content: "Nie udało się wysłać. Spróbuj ponownie.", error: true } 
          : m
      ));
      setError(e instanceof Error ? e.message : "Nie udało się wysłać wiadomości. Sprawdź połączenie.");
      setIsStreaming(false);
    } finally {
      setLoadingState(false);
      inputRef.current?.focus();
    }
  };

  const sendRegularMessage = async (placeholderId: string, text: string, next: Message[]) => {
    try {
      const data = await chatApi.sendMessage({ 
        message: text, 
        history: next.slice(-10), 
        conversation_id: sid 
      });

      // Replace placeholder with actual response
      setMessages(prev => prev.map(m =>
        m.id === placeholderId 
          ? { role: "assistant", content: data?.response ?? "Brak odpowiedzi." } 
          : m
      ));
    } catch (e: unknown) {
      // Show error in placeholder
      setMessages(prev => prev.map(m =>
        m.id === placeholderId 
          ? { ...m, content: "Nie udało się wysłać. Spróbuj ponownie.", error: true } 
          : m
      ));
      setError(e instanceof Error ? e.message : "Nie udało się wysłać wiadomości. Sprawdź połączenie.");
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    localStorage.removeItem(LS_KEY);
    setMessages([{ role: "assistant", content: "Witaj!" }]);
  };

  return (
    <div className="mx-auto max-w-[980px] px-4 pb-8">
      {/* Buttons */}
      <div className="flex justify-between items-center mb-4 mx-3">
        <Button
          onClick={() => setModal('words', true)}
          className="bg-blue-600 hover:bg-blue-700 h-8 text-base px-3"
        >
          Dodaj trudne słówka
        </Button>
        <Button
          className="bg-blue-600 hover:bg-blue-700 h-8 text-base px-3"
          onClick={clearChat}
        >
          Nowa rozmowa
        </Button>
      </div>

      {/* Chat Container */}
      <div className="m-3 rounded-3xl overflow-hidden bg-transparent border border-white/30 shadow-lg">
        {/* Messages Area */}
        <div 
          className="h-[60vh] overflow-y-auto panel"
          style={{ backgroundColor: 'rgba(var(--panel-bg))', backdropFilter: 'blur(var(--blur-amount))' }}
        >
          <div className="p-4 space-y-3" style={{ backgroundColor: 'transparent' }}>
            {messages.map((m, i) => {
              const isUser = m.role === "user";
              const isLastAssistant = !isUser && i === messages.length - 1 && isStreaming;
              return (
                <div key={i} className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Image
                      src={isUser ? "/user-avatar.png" : "/ai-avatar.png"}
                      alt={isUser ? "User" : "AI"}
                      width={35}
                      height={35}
                      className="rounded-full"
                      priority={i < 2} // Priority for first 2 messages
                    />
                  </div>
                  <div className={`bubble ${isUser ? "bubble-user" : "bubble-ai"}`}>
                    {m.content}
                    {isLastAssistant && streamingText && (
                      <span className="animate-pulse">|</span>
                    )}
                  </div>
                </div>
              );
            })}
            
            {/* Streaming text display */}
            {isStreaming && streamingText && (
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-2 mb-1">
                  <Image
                    src="/ai-avatar.png"
                    alt="AI"
                    width={35}
                    height={35}
                    className="rounded-full"
                  />
                </div>
                <div className="bubble bubble-ai">
                  {streamingText}
                  <span className="animate-pulse">|</span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="sticky bottom-0 p-3 flex gap-2 border-t border-white/30 bg-white/55 backdrop-blur-md">
          <textarea
            ref={inputRef}
            className="flex-1 bg-white/65 backdrop-blur-sm border-white/40 placeholder-black/50 focus-visible:ring-1 focus-visible:ring-white/60 rounded-md px-3 py-2 text-base resize-none min-h-[40px] max-h-[120px]"
            placeholder="..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={loading}
          />
          <Button 
            onClick={sendMessage} 
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="sr-only">Wyślij</span>
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 text-sm text-red-500 text-center">
          {error}
        </div>
      )}

      {/* Words Modal */}
      <WordsModal
        isOpen={modals.words}
        onClose={() => setModal('words', false)}
      />
    </div>
  );
}
