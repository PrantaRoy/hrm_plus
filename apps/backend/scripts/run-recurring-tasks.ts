import "dotenv/config";
import { controlClient } from "../src/db/controlClient";
import { disconnectAllTenantClients, getTenantClient } from "../src/db/tenantClientPool";
import {
  runRecurringTaskGeneration,
  runRecurringTaskGenerationForTenant,
} from "../src/modules/tasks/recurringTask.processor";

/**
 * Manually runs the recurring-task generation that the worker schedules daily
 * (00:30, see src/queue/recurringTasks.queue.ts). Safe to run at any time and to
 * re-run: a cycle is only ever generated once.
 *
 *   npm run recurring-tasks:run                    # every active tenant
 *   npm run recurring-tasks:run -- --tenant acme   # one tenant, by slug
 */
async function main(): Promise<void> {
  const flagIndex = process.argv.indexOf("--tenant");
  const slug = flagIndex >= 0 ? process.argv[flagIndex + 1] : undefined;
  if (flagIndex >= 0 && !slug) {
    throw new Error("--tenant requires a tenant slug");
  }

  if (!slug) {
    await runRecurringTaskGeneration();
    console.log("Recurring task generation finished for all active tenants (see logs for per-tenant counts).");
    return;
  }

  const tenant = await controlClient.tenant.findUnique({ where: { slug } });
  if (!tenant) throw new Error(`Unknown tenant slug: ${slug}`);
  const created = await runRecurringTaskGenerationForTenant(getTenantClient(tenant.databaseName));
  console.log(`Tenant "${slug}": generated ${created} recurring task(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectAllTenantClients();
    await controlClient.$disconnect();
  });
