import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';
import fs from 'fs';

// Load variables from .env file, searching parent directories dynamically
let envPath = path.resolve(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  envPath = path.resolve(process.cwd(), '../../.env');
}
if (!fs.existsSync(envPath)) {
  envPath = path.resolve(process.cwd(), '../.env');
}
dotenv.config({ path: envPath });

const envSchema = z.object({
  PORT: z.string().transform((val) => parseInt(val, 10)).default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  ENCRYPTION_KEY: z.string().length(64).describe('32-byte hex key for AES-256-GCM'),
  TERMII_API_KEY: z.string().optional(),
  TERMII_SENDER_ID: z.string().optional().default('Iransé'),
  PAYSTACK_SECRET_KEY: z.string().optional(),
  KYC_VENDOR_API_KEY: z.string().optional(),
  WORKER_QUEUES: z.string().default('all'),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().optional().default('gemini-3.6-flash'),
  GEMINI_EMBEDDING_MODEL: z.string().optional().default('text-embedding-004'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_EMBEDDING_MODEL: z.string().optional().default('text-embedding-3-small'),
  PAYMENT_PROVIDER: z.enum(['paystack', 'flutterwave']).optional().default('paystack'),
  FREE_TIER_MONTHLY_CAP: z.string().transform((val) => parseInt(val, 10)).default('5'),
  KYC_VENDOR_NAME: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
