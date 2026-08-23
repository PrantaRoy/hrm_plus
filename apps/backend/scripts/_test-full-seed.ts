import "dotenv/config";
import { controlClient } from "../src/db/controlClient";
import { getTenantClient } from "../src/db/tenantClientPool";
import { tenantDatabaseUrl } from "../src/config/env";
import {
  createTenantDatabase,
  runTenantMigrations,
  seedDefaultRoles,
  seedDefaultWeekDays,
  seedDefaultScreeningQuestions,
  seedDefaultSiteSections,
  seedDefaultLandingPageContent,
  provisionTenantAdmin,
} from "../src/modules/tenants/tenantProvisioning";
import { seedFullDemoData } from "./seed-demo";

const SLUG = "demotest";

async function main() {
  let tenant = await controlClient.tenant.findUnique({ where: { slug: SLUG } });
  if (!tenant) {
    const databaseName = `hrm_tenant_${SLUG}`;
    await createTenantDatabase(databaseName);
    tenant = await controlClient.tenant.create({ data: { name: "Demo Test Co", slug: SLUG, databaseName, status: "Active" } });
  }
  runTenantMigrations(tenantDatabaseUrl(tenant.databaseName));

  const tc = getTenantClient(tenant.databaseName);
  const roleIds = await seedDefaultRoles(tc);
  await seedDefaultWeekDays(tc);
  await seedDefaultScreeningQuestions(tc);
  await seedDefaultSiteSections(tc);
  const admin = await provisionTenantAdmin(tc, { email: "admin@demotest.test", password: "1234abcd", roleId: roleIds.Admin });
  await seedDefaultLandingPageContent(tc, { id: admin.id, email: admin.email }, "Demo Test Co");

  console.log("=== Starting seedFullDemoData ===");
  const start = Date.now();
  await seedFullDemoData(tc, { id: tenant.id, slug: tenant.slug }, admin, roleIds);
  console.log(`=== Done in ${((Date.now() - start) / 1000).toFixed(1)}s ===`);
}

main()
  .catch((err) => {
    console.error("SEED TEST FAILED:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await controlClient.$disconnect();
  });
