import 'dotenv/config'
import { z } from 'zod'

const environment = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
  JWT_SECRET: z.string().min(32).optional(),
  DATABASE_URL: z.string().url().optional(),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(12).optional(),
  AI_PROVIDER: z.enum(['ollama', 'gateway']).optional(),
  OLLAMA_BASE_URL: z.string().url().default('http://127.0.0.1:11434/v1'),
  OLLAMA_MODEL: z.string().min(1).default('gemma3:1b'),
  AI_GATEWAY_API_KEY: z.string().min(1).optional(),
  AI_MODEL: z.string().regex(/^[a-z0-9-]+\/[a-z0-9._-]+$/i).default('openai/gpt-5.6-terra')
})

const parsed = environment.parse(process.env)
export const config = { ...parsed, AI_PROVIDER: parsed.AI_PROVIDER ?? (process.env.VERCEL ? 'gateway' as const : 'ollama' as const) }
if (config.NODE_ENV === 'production' && !config.JWT_SECRET) throw new Error('JWT_SECRET must be set to a random value of at least 32 characters in production.')
if (config.AI_PROVIDER === 'gateway' && !config.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN) throw new Error('AI Gateway requires AI_GATEWAY_API_KEY locally or Vercel OIDC when deployed.')
export const jwtSecret = config.JWT_SECRET ?? 'development-only-secret-change-before-deployment'
