import "dotenv/config";
import { controlClient } from "../src/db/controlClient";
import { getTenantClient } from "../src/db/tenantClientPool";
import { seedDefaultRoles } from "../src/modules/tenants/tenantProvisioning";

/**
 * Backfills the new "Payroll" and "Finance" roles (added to ROLES in
 * packages/shared/src/roles.ts for the payroll module's separation-of-duties
 * workflow) into every already-provisioned tenant database. New tenants get
 * these automatically via seedDefaultRoles() at provisioning time — this script
 * covers tenants provisioned before that change. Idempotent (upsert by name),
 * safe to re-run.
 */
async function main(): Promise<void> {
  const tenants = await controlClient.tenant.findMany();
  for (const tenant of tenants) {
    const tenantClient = getTenantClient(tenant.databaseName);
    await seedDefaultRoles(tenantClient);
    console.log(`Backfilled roles for tenant "${tenant.slug}"`);
  }
  console.log(`Done — ${tenants.length} tenant(s) processed.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await controlClient.$disconnect();
  });
