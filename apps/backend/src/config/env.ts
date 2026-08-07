import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  CONTROL_DATABASE_URL: z.string().min(1),
  TENANT_DB_HOST: z.string().min(1),
  TENANT_DB_PORT: z.string().min(1),
  TENANT_DB_USER: z.string().min(1),
  TENANT_DB_PASSWORD: z.string().default(""),
  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_ACCESS_TTL: z.string().default("30m"),
  JWT_REFRESH_SECRET: z.string().min(1),
  JWT_REFRESH_TTL: z.string().default("7d"),
  JWT_SAAS_ACCESS_SECRET: z.string().min(1),
  JWT_SAAS_ACCESS_TTL: z.string().default("30m"),
  PORT: z.string().default("4000"),
  NODE_ENV: z.string().default("development"),
  CORS_ORIGIN: z.string().default("http://localhost:5173,http://localhost:5174"),
  PUBLIC_TENANT_BASE_DOMAIN: z.string().default("hrmplus.test"),
  FRONTEND_BASE_URL: z.string().default("http://localhost:5173"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().default("587"),
  SMTP_SECURE: z.string().default("false"),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default("HRM PLUS <no-reply@hrmplus.test>"),
  STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
  LOCAL_UPLOAD_DIR: z.string().default("uploads"),
  AWS_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  AWS_S3_PUBLIC_BASE_URL: z.string().optional(),

  // Candidate portal / ATS pipeline
  CANDIDATE_PORTAL_TOKEN_TTL_HOURS: z.string().default("168"),
  ASSESSMENT_BORDERLINE_BAND_PERCENT: z.string().default("10"),

  // Background queue (BullMQ + Redis) — used by the async short-text assessment grading worker
  REDIS_URL: z.string().default("redis://localhost:6379"),
  ASSESSMENT_GRADING_CONCURRENCY: z.string().default("5"),

  // LLM provider — assessment question generation + short-text grading
  LLM_PROVIDER: z.enum(["openai", "anthropic"]).default("openai"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default("claude-3-5-haiku-latest"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration");
}

// Deliberately not enforced at boot (unlike the rest of this file's fail-fast checks): requiring
// an LLM key up front would take down the entire API/worker process for tenants that never touch
// AI assessment generation/grading, and would break the Jest suite. Enforced lazily instead, in
// modules/llm's provider factory, only when a caller actually tries to use the configured provider.
export const env = parsed.data;

export const corsOrigins = env.CORS_ORIGIN.split(",").map((origin) => origin.trim());

export function tenantDatabaseUrl(databaseName: string): string {
  const user = encodeURIComponent(env.TENANT_DB_USER);
  const auth = env.TENANT_DB_PASSWORD
    ? `${user}:${encodeURIComponent(env.TENANT_DB_PASSWORD)}`
    : user;
  return `mysql://${auth}@${env.TENANT_DB_HOST}:${env.TENANT_DB_PORT}/${databaseName}`;
}

export function tenantLoginUrl(slug: string): string {
  return `https://${slug}.${env.PUBLIC_TENANT_BASE_DOMAIN}`;
}
