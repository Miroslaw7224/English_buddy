import { ChatRequest } from '@/shared/validation/schemas';
import { ApiError } from './http';

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

