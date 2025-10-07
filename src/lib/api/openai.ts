import { ApiError } from './http';

// Global audio mutex
let currentAudio: HTMLAudioElement | null = null;
let currentUrl: string | null = null;

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

