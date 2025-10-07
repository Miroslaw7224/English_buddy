'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { openaiTts, chatApi } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  id?: string;
  pending?: boolean;
  error?: boolean;
}

const LS_KEY = "eb.chat-voice.messages";

export default function ChatVoicePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  
  const [isRecording, setIsRecording] = useState(false);
  // Voice is now taken from user profile, default 'alloy'
  const selectedVoiceRef = useRef('alloy');
  
  // Load messages from localStorage after hydration
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        setMessages(JSON.parse(saved));
      } else {
        setMessages([{ role: "assistant", content: "Witaj! Rozpocznij nagrywanie, aby porozmawiać ze mną głosowo." }]);
      }
    } catch { 
      setMessages([{ role: "assistant", content: "Witaj! Rozpocznij nagrywanie, aby porozmawiać ze mną głosowo." }]); 
    }
    setIsHydrated(true);
  }, []);

  const [detectedLanguage, setDetectedLanguage] = useState<'pl' | 'en'>('en');
  const [aiResponseLanguage, setAiResponseLanguage] = useState<'pl' | 'en'>('en');
  const [isProcessing, setIsProcessing] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Save messages to localStorage
  useEffect(() => {
    try { 
      localStorage.setItem(LS_KEY, JSON.stringify(messages)); 
    } catch {} 
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'pl-PL'; // Start with Polish, will auto-detect

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleVoiceInput(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        setIsProcessing(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
        setIsProcessing(true);
      };
    }
  }, []);

  // Simple language detection function
  const detectLanguage = (text: string): 'pl' | 'en' => {
    const polishWords = ['jest', 'nie', 'tak', 'ale', 'lub', 'czy', 'jak', 'gdzie', 'kiedy', 'dlaczego', 'co', 'kto', 'który', 'która', 'które', 'mój', 'moja', 'moje', 'twój', 'twoja', 'twoje', 'nasz', 'nasza', 'nasze', 'wasz', 'wasza', 'wasze', 'ich', 'jej', 'jego', 'ich', 'jej', 'jego'];
    const englishWords = ['is', 'not', 'yes', 'no', 'but', 'or', 'if', 'how', 'where', 'when', 'why', 'what', 'who', 'which', 'my', 'your', 'our', 'their', 'his', 'her', 'its'];
    
    const words = text.toLowerCase().split(/\s+/);
    const polishCount = words.filter(word => polishWords.includes(word)).length;
    const englishCount = words.filter(word => englishWords.includes(word)).length;
    
    return polishCount > englishCount ? 'pl' : 'en';
  };

  const startRecording = () => {
    if (recognitionRef.current) {
      setIsRecording(true);
      setIsProcessing(false);
      recognitionRef.current.start();
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const speakText = useCallback(async (text: string, voiceOverride?: string) => {
    const actualVoice = voiceOverride ?? selectedVoiceRef.current;
    // Try OpenAI TTS first
    try {
      await openaiTts.speakText(text, actualVoice);
      return;
    } catch (error) {
      console.error('OpenAI TTS error:', error);
    }
    
    // Fallback to browser speech synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Stop any current speech
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
      
      // Try to find a matching voice
      const voices = speechSynthesis.getVoices();
      
      // Map OpenAI voices to browser voices
      const voiceMap: { [key: string]: string[] } = {
        'alloy': ['Samantha', 'Karen', 'Female', 'Woman', 'Alloy'],
        'echo': ['Alex', 'Daniel', 'Male', 'Man', 'Echo'],
        'fable': ['Moira', 'Fiona', 'British', 'UK', 'Fable'],
        'nova': ['Samantha', 'Karen', 'Female', 'Woman', 'Nova'],
        'onyx': ['Alex', 'Daniel', 'Male', 'Man', 'Onyx'],
        'shimmer': ['Samantha', 'Karen', 'Female', 'Woman', 'Shimmer']
      };
      
      const voiceKeywords = voiceMap[actualVoice] || ['Samantha'];
      
      // Try exact match first
      let selectedVoiceObj = voices.find(voice => 
        voiceKeywords.some(keyword => voice.name.toLowerCase().includes(keyword.toLowerCase()))
      );
      
      // If no exact match, try partial match
      if (!selectedVoiceObj) {
        if (actualVoice === 'echo' || actualVoice === 'onyx') {
          selectedVoiceObj = voices.find(voice => 
            voice.name.toLowerCase().includes('male') || 
            voice.name.toLowerCase().includes('man') ||
            voice.name.toLowerCase().includes('alex') ||
            voice.name.toLowerCase().includes('daniel')
          );
        } else {
          selectedVoiceObj = voices.find(voice => 
            voice.name.toLowerCase().includes('female') || 
            voice.name.toLowerCase().includes('woman') ||
            voice.name.toLowerCase().includes('samantha') ||
            voice.name.toLowerCase().includes('karen')
          );
        }
      }
      
      if (selectedVoiceObj) {
        utterance.voice = selectedVoiceObj;
      }
      
      speechSynthesis.speak(utterance);
    }
  }, []);

  const handleVoiceInput = useCallback(async (transcript: string) => {
    // Detect language
    const detectedLang = detectLanguage(transcript);
    setDetectedLanguage(detectedLang);
    
    // Add user message
    const userMessage: Message = { 
      role: "user", 
      content: transcript,
      id: crypto.randomUUID()
    };
    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      // Use real AI from ChatPage
      const response = await chatApi.sendMessage({
        message: transcript,
        history: messages.slice(-10), // Last 10 messages for context
        conversation_id: 'voice-chat-' + Date.now()
      });

      const aiResponse: Message = {
        role: "assistant",
        content: response.response,
        id: crypto.randomUUID()
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsProcessing(false);
      
      // Speak the response
      speakText(aiResponse.content, selectedVoiceRef.current);
    } catch (error) {
      console.error('AI response error:', error);
      
      // Fallback response
      const aiResponse: Message = {
        role: "assistant",
        content: aiResponseLanguage === 'pl' 
          ? `Przepraszam, wystąpił błąd. Usłyszałem: "${transcript}".`
          : `Sorry, there was an error. I heard you say: "${transcript}".`,
        id: crypto.randomUUID()
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsProcessing(false);
      
      // Speak the response
      speakText(aiResponse.content, selectedVoiceRef.current);
    }
  }, [messages, aiResponseLanguage, speakText]);

  const clearChat = () => {
    localStorage.removeItem(LS_KEY);
    setMessages([{ role: "assistant", content: "Witaj! Rozpocznij nagrywanie, aby porozmawiać ze mną głosowo." }]);
  };

  // Don't render until hydrated to prevent hydration mismatch
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <TopBar />
        <div className="pt-8">
          <div className="mx-auto max-w-[980px] px-4 pb-8">
            <div className="text-center text-white">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <TopBar />
      
      <div className="pt-8">
        <div className="mx-auto max-w-[980px] px-4 pb-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white text-center mb-8">
              Chat Głosowy
            </h1>
            
            {/* Przyciski */}
            <div className="flex justify-between items-center mb-4 mx-3">
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
                className={`${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-red-600 hover:bg-red-700'} h-8 text-base px-3 disabled:opacity-50`}
              >
                {isProcessing ? 'Processing...' : (isRecording ? 'STOP' : 'REC')}
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
                    return (
                      <div key={i} className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <Image
                            src={isUser ? "/user-avatar.png" : "/ai-avatar.png"}
                            alt={isUser ? "User" : "AI"}
                            width={35}
                            height={35}
                            className="rounded-full"
                            priority={i < 2}
                          />
                        </div>
                        <div className={`bubble ${isUser ? "bubble-user" : "bubble-ai"}`}>
                          {m.content}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={endRef} />
                </div>
              </div>
            </div>
            
            {/* Status języka */}
            <div className="mt-6 mx-3">
              <label className="block text-white text-sm font-medium mb-2">
                Wykryty język:
              </label>
              <div className="w-full bg-gray-800/90 backdrop-blur-sm border border-gray-600/50 rounded-lg px-3 py-2 text-white flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${detectedLanguage === 'pl' ? 'bg-red-500' : 'bg-blue-500'}`}></span>
                <span>{detectedLanguage === 'pl' ? 'Polski' : 'English'}</span>
              </div>
              <p className="text-gray-400 text-xs mt-2">
                Zmień głos AI w Profilu użytkownika
              </p>
            </div>
            {/* Język odpowiedzi AI */}
            <div className="mt-4 mx-3">
              <label className="block text-white text-sm font-medium mb-2">
                Język odpowiedzi AI:
              </label>
              <div className="flex gap-2">
                <Button
                  onClick={() => setAiResponseLanguage('pl')}
                  className={`flex-1 h-10 ${
                    aiResponseLanguage === 'pl' 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  Polski
                </Button>
                <Button
                  onClick={() => setAiResponseLanguage('en')}
                  className={`flex-1 h-10 ${
                    aiResponseLanguage === 'en' 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  English
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
