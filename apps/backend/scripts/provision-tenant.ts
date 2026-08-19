import "dotenv/config";
import { nanoid } from "nanoid";
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

interface Args {
  name: string;
  slug: string;
  adminEmail: string;
  adminPassword?: string;
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const idx = args.indexOf(flag);
    return idx >= 0 ? args[idx + 1] : undefined;
  };

  const name = get("--name");
  const slug = get("--slug");
  const adminEmail = get("--admin-email") ?? `admin@${slug ?? "tenant"}.hrmplus.test`;
  const adminPassword = get("--admin-password");

  if (!name || !slug) {
    console.error(
      'Usage: provision-tenant --name "Acme Ltd" --slug acme [--admin-email admin@acme.com] [--admin-password <password>]'
    );
    process.exit(1);
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    console.error("Slug must be lowercase letters, numbers, and hyphens only");
    process.exit(1);
  }

  return { name, slug, adminEmail, adminPassword };
}

async function main() {
  const { name, slug, adminEmail, adminPassword } = parseArgs();

  const existing = await controlClient.tenant.findUnique({ where: { slug } });
  if (existing) {
    console.error(`Tenant with slug "${slug}" already exists`);
    process.exit(1);
  }

  const databaseName = `hrm_tenant_${slug.replace(/-/g, "_")}`;

  console.log(`Creating database ${databaseName}...`);
  await createTenantDatabase(databaseName);

  console.log("Running tenant migrations...");
  runTenantMigrations(tenantDatabaseUrl(databaseName));

  console.log("Registering tenant in control database...");
  await controlClient.tenant.create({
    data: { name, slug, databaseName, status: "Active" },
  });

  console.log("Seeding roles and admin user...");
  const tenantClient = getTenantClient(databaseName);
  const roleIds = await seedDefaultRoles(tenantClient);
  await seedDefaultWeekDays(tenantClient);
  await seedDefaultScreeningQuestions(tenantClient);
  await seedDefaultSiteSections(tenantClient);

  const finalPassword = adminPassword ?? nanoid(12);
  const admin = await provisionTenantAdmin(tenantClient, {
    email: adminEmail,
    password: finalPassword,
    roleId: roleIds.Admin,
  });

  console.log("Seeding default landing page content...");
  await seedDefaultLandingPageContent(tenantClient, { id: admin.id, email: admin.email }, name);

  console.log("\nTenant provisioned successfully:");
  console.log(`  Tenant slug:    ${slug}`);
  console.log(`  Admin email:    ${adminEmail}`);
  console.log(`  Admin password: ${finalPassword}`);
  console.log(`\nSend header "X-Tenant-Slug: ${slug}" with login requests.\n`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await controlClient.$disconnect();
  });
