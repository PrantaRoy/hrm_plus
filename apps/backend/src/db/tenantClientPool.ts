import { PrismaClient } from "../../generated/tenant";
import { tenantDatabaseUrl } from "../config/env";

const pool = new Map<string, PrismaClient>();

export function getTenantClient(databaseName: string): PrismaClient {
  const existing = pool.get(databaseName);
  if (existing) {
    return existing;
  }

  const client = new PrismaClient({
    datasources: {
      db: { url: tenantDatabaseUrl(databaseName) },
    },
  });
  pool.set(databaseName, client);
  return client;
}

export async function disconnectAllTenantClients(): Promise<void> {
  await Promise.all(Array.from(pool.values()).map((client) => client.$disconnect()));
  pool.clear();
}
