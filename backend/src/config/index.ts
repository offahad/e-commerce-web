import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  APP_NAME: z.string().default('Liton Brothers'),
  BASE_URL: z.string().default('http://localhost:4000'),
  JWT_SECRET: z.string().default('liton-brothers-jwt-super-secret-key-32-chars-long!'),
  JWT_REFRESH_SECRET: z.string().default('liton-brothers-jwt-refresh-super-secret-key-32!'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  DATABASE_URL: z.string().optional(),
  ADMIN_DEFAULT_PHONE: z.string().default('01700000000'),
  ADMIN_DEFAULT_PASSWORD: z.string().default('Admin@123456'),
  BCRYPT_ROUNDS: z.coerce.number().default(10),
});

const parsed = configSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid configuration environment variables:', parsed.error.format());
  process.exit(1);
}

export const config = parsed.data;
export type Config = typeof config;
