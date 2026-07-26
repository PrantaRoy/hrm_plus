import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  CONTROL_DATABASE_URL: z.string().min(1),
  TENANT_DB_HOST: z.string().min(1),
  TENANT_DB_PORT: z.string().min(1),
  TENANT_DB_USER: z.string().min(1),
  TENANT_DB_PASSWORD: z.string().default(""),
  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_SECRET: z.string().min(1),
  JWT_REFRESH_TTL: z.string().default("7d"),
  PORT: z.string().default("4000"),
  NODE_ENV: z.string().default("development"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration");
}

export const env = parsed.data;

export function tenantDatabaseUrl(databaseName: string): string {
  const user = encodeURIComponent(env.TENANT_DB_USER);
  const auth = env.TENANT_DB_PASSWORD
    ? `${user}:${encodeURIComponent(env.TENANT_DB_PASSWORD)}`
    : user;
  return `mysql://${auth}@${env.TENANT_DB_HOST}:${env.TENANT_DB_PORT}/${databaseName}`;
}
