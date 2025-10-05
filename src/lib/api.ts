import { ChatRequest } from '@/shared/validation/schemas';
import { Word } from '@/types/words';
import { supabase } from './supabase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Chat API (Real OpenAI integration)
export const chatApi = {
  async sendMessage(request: ChatRequest): Promise<{ response: string }> {
    try {
      const response = await fetch('/api/openai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new ApiError(`Chat API failed: ${response.statusText}`, response.status);
      }

      const data = await response.json();
      return { response: data.response };
    } catch (error) {
      console.error('Chat API error:', error);
      // Fallback to mock response
      const mockResponse = `Hello! I'm your English learning assistant. You said: "${request.message}". Let me help you practice English!`;
      return { response: mockResponse };
    }
  },

  async sendMessageStream(
    request: ChatRequest,
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      // Get full response first
      const response = await this.sendMessage(request);
      
      // Simulate streaming by sending chunks
      const words = response.response.split(' ');
      for (let i = 0; i < words.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 50));
        onChunk(words[i] + (i < words.length - 1 ? ' ' : ''));
      }
      
      onComplete();
    } catch (error: unknown) {
      onError(new ApiError('Stream error', 0, error));
    }
  },
};

// Words API (Supabase)
export const getWords = async (): Promise<Word[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('words')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new ApiError(`Failed to fetch words: ${error.message}`, 500, error);
  }

  return data || [];
};

export const addWord = async (word: Omit<Word, 'id'>): Promise<Word> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new ApiError('User not authenticated', 401);
  }

  const wordWithUserId = {
    ...word,
    user_id: user.id,
  };

  const { data, error } = await supabase
    .from('words')
    .insert([wordWithUserId])
    .select()
    .single();

  if (error) {
    throw new ApiError(`Failed to add word: ${error.message}`, 500, error);
  }

  return data;
};

export const updateWord = async (id: string, word: Partial<Word>): Promise<Word> => {
  const { data, error } = await supabase
    .from('words')
    .update(word)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new ApiError(`Failed to update word: ${error.message}`, 500, error);
  }

  return data;
};

export const deleteWord = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('words')
    .delete()
    .eq('id', id);

  if (error) {
    throw new ApiError(`Failed to delete word: ${error.message}`, 500, error);
  }
};

// Global audio mutex
let currentAudio: HTMLAudioElement | null = null;
let currentUrl: string | null = null;

// OpenAI TTS API
export const openaiTts = {
  async generateSpeech(text: string, voice: string = 'alloy'): Promise<Blob> {
    const response = await fetch('/api/openai/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify({
        text,
        voice,
      }),
    });

    if (!response.ok) {
      throw new ApiError(`TTS generation failed: ${response.statusText}`, response.status);
    }

    return response.blob();
  },

  async playAudio(audioBlob: Blob): Promise<void> {
    // STOP poprzedniego audio (jeśli gra)
    if (currentAudio) {
      try { currentAudio.pause(); } catch {}
      try { currentAudio.src = ''; currentAudio.load(); } catch {}
      currentAudio = null;
    }
    if (currentUrl) {
      URL.revokeObjectURL(currentUrl);
      currentUrl = null;
    }

    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    currentAudio = audio;
    currentUrl = audioUrl;

    return new Promise((resolve, reject) => {
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        currentAudio = null;
        currentUrl = null;
        resolve();
      };
      audio.onerror = (error) => {
        console.error('Audio playback error:', error);
        URL.revokeObjectURL(audioUrl);
        currentAudio = null;
        currentUrl = null;
        reject(new Error('Audio playback failed: ' + (error as any)?.type));
      };
      audio.oncanplay = () => {
        console.log('Audio ready to play, starting playback...');
        const playPromise = audio.play();
        if (playPromise) playPromise.catch(reject);
      };
      audio.load();
    });
  },

  async speakText(text: string, voice: string = 'alloy'): Promise<void> {
    try {
      const audioBlob = await this.generateSpeech(text, voice);
      await this.playAudio(audioBlob);
    } catch (error) {
      console.error('OpenAI TTS error:', error);
      throw error;
    }
  }
};

// Health check (Mock - no external backend needed)
export const healthCheck = async (): Promise<boolean> => {
  // Always return true since we don't have external dependencies
  return true;
};
