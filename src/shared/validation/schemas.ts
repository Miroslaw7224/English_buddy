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
  term: z.string().min(1, 'Term is required'),
  translation: z.string().optional(),
  example: z.string().optional(),
});

export const wordUpdateSchema = wordSchema.partial().extend({
  id: z.string().min(1, 'ID is required'),
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
