import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  SPOONACULAR_API_KEY: z.string().min(32),
});

export const config = envSchema.parse(process.env);