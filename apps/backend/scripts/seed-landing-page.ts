import "dotenv/config";
import { controlClient } from "../src/db/controlClient";
import { getTenantClient } from "../src/db/tenantClientPool";
import { seedDefaultLandingPageContent } from "../src/modules/tenants/tenantProvisioning";

/**
 * Seeds default landing-page content (hero slide, services, gallery, about/
 * contact copy, social links, legal pages, one blog post) into an EXISTING
 * tenant — for tenants that were provisioned before this seeder existed.
 * Newly-provisioned tenants already get this automatically (see
 * provision-tenant.ts / seed-demo.ts). Idempotent: only fills in empty
 * sections, never touches content an admin has already added.
 */

function parseArgs(): { slug: string } {
  const args = process.argv.slice(2);
  const idx = args.indexOf("--slug");
  const slug = idx >= 0 ? args[idx + 1] : undefined;

  if (!slug) {
    console.error("Usage: seed-landing-page --slug <tenant-slug>");
    process.exit(1);
  }

  return { slug };
}

async function main() {
  const { slug } = parseArgs();

  const tenant = await controlClient.tenant.findUnique({ where: { slug } });
  if (!tenant) {
    console.error(`No tenant found with slug "${slug}"`);
    process.exit(1);
  }

  const tenantClient = getTenantClient(tenant.databaseName);
  const admin = await tenantClient.user.findFirst({
    where: { role: { name: "Admin" } },
    orderBy: { id: "asc" },
  });

  if (!admin) {
    console.error(`Tenant "${slug}" has no Admin user yet — provision one first.`);
    process.exit(1);
  }

  console.log(`Seeding default landing page content for tenant "${slug}"...`);
  await seedDefaultLandingPageContent(tenantClient, { id: admin.id, email: admin.email }, tenant.name);
  console.log("Done. Any content the tenant already added was left untouched.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await controlClient.$disconnect();
  });
