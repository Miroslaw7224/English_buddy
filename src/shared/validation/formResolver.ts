import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

/**
 * Creates a form resolver for React Hook Form with Zod validation
 * @param schema Zod schema to validate against
 * @returns Form resolver function
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createFormResolver = <T extends z.ZodType<any, any, any>>(schema: T) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  zodResolver(schema as any);

/**
 * Common form resolver configurations
 */
export const formResolvers = {
  login: createFormResolver,
  signup: createFormResolver,
  word: createFormResolver,
  wordUpdate: createFormResolver,
  chatMessage: createFormResolver,
  chatRequest: createFormResolver,
} as const;
