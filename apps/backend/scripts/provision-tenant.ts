import "dotenv/config";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import { controlClient } from "../src/db/controlClient";
import { getTenantClient } from "../src/db/tenantClientPool";
import { tenantDatabaseUrl } from "../src/config/env";
import {
  createTenantDatabase,
  runTenantMigrations,
  seedDefaultRoles,
  seedDefaultWeekDays,
} from "../src/modules/tenants/tenantProvisioning";

interface Args {
  name: string;
  slug: string;
  adminEmail: string;
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

  if (!name || !slug) {
    console.error('Usage: provision-tenant --name "Acme Ltd" --slug acme [--admin-email admin@acme.com]');
    process.exit(1);
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    console.error("Slug must be lowercase letters, numbers, and hyphens only");
    process.exit(1);
  }

  return { name, slug, adminEmail };
}

async function main() {
  const { name, slug, adminEmail } = parseArgs();

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

  const adminPassword = nanoid(12);
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const adminUser = await tenantClient.user.create({
    data: { email: adminEmail, passwordHash, roleId: roleIds.Admin },
  });

  await tenantClient.employee.create({
    data: {
      employeeCode: `EMP-${nanoid(6).toUpperCase()}`,
      firstName: "Tenant",
      lastName: "Admin",
      email: adminEmail,
      startDate: new Date(),
      userId: adminUser.id,
    },
  });

  console.log("\nTenant provisioned successfully:");
  console.log(`  Tenant slug:    ${slug}`);
  console.log(`  Admin email:    ${adminEmail}`);
  console.log(`  Admin password: ${adminPassword}`);
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
