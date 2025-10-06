import { z } from 'zod';

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Word schemas
export const wordSchema = z.object({
  term: z.string().min(1, 'Term is required').max(100, 'Term too long'),
  term_lang: z.string().optional(),
  translation: z.string().min(1, 'Translation is required').max(100, 'Translation too long'),
  translation_lang: z.string().optional(),
  definition: z.string().max(500, 'Definition too long').optional(),
  part_of_speech: z.string().max(50, 'Part of speech too long').optional(),
  ipa: z.string().max(50, 'IPA too long').optional(),
  examples: z.array(z.object({
    text: z.string().min(1, 'Example text required').max(200, 'Example too long'),
    translation: z.string().min(1, 'Example translation required').max(200, 'Example translation too long'),
  })).max(5, 'Too many examples').optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  cefr: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).optional(),
  category: z.string().max(50, 'Category too long').optional(),
  tags: z.array(z.string().max(24, 'Tag too long')).max(10, 'Too many tags').optional(),
  audio_url: z.string().url('Invalid audio URL').optional(),
  image_url: z.string().url('Invalid image URL').optional(),
});

export const wordUpdateSchema = wordSchema.partial().extend({
  word_id: z.string().min(1, 'Word ID is required'),
});

// Chat schemas
export const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1, 'Message content is required'),
  id: z.string().optional(),
  timestamp: z.number().optional(),
});

export const chatRequestSchema = z.object({
  message: z.string().min(1, 'Message is required').max(800, 'Message too long'),
  history: z.array(chatMessageSchema).max(15, 'Too many messages in history'),
  conversation_id: z.string().optional(),
});

// Export types
export type LoginForm = z.infer<typeof loginSchema>;
export type SignupForm = z.infer<typeof signupSchema>;
export type WordForm = z.infer<typeof wordSchema>;
export type WordUpdate = z.infer<typeof wordUpdateSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;
