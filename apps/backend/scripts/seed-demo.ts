import "dotenv/config";
import bcrypt from "bcrypt";
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

/**
 * Idempotent demo-data seeder. Safe to re-run at any time (e.g. after a fresh
 * `prisma migrate deploy` or a wiped local database) — it always resets the
 * demo credentials back to fixed, known values instead of leaving behind a
 * previously auto-generated password.
 */

const SAAS_ADMIN = {
  email: process.env.SEED_SAAS_ADMIN_EMAIL ?? "saas@hrmplus.test",
  password: process.env.SEED_SAAS_ADMIN_PASSWORD ?? "1234abcd",
};

const DEMO_TENANT = {
  name: "Acme Ltd",
  slug: "acme",
  adminEmail: process.env.SEED_TENANT_ADMIN_EMAIL ?? "acme@hrmplus.test",
  adminPassword: process.env.SEED_TENANT_ADMIN_PASSWORD ?? "1234abcd",
};

async function seedSaasAdmin(): Promise<void> {
  const passwordHash = await bcrypt.hash(SAAS_ADMIN.password, 10);
  await controlClient.platformAdmin.upsert({
    where: { email: SAAS_ADMIN.email },
    update: { passwordHash },
    create: { email: SAAS_ADMIN.email, passwordHash },
  });
  console.log(`SaaS super-admin ready: ${SAAS_ADMIN.email} / ${SAAS_ADMIN.password}`);
}

async function seedDemoTenant(): Promise<void> {
  let tenant = await controlClient.tenant.findUnique({ where: { slug: DEMO_TENANT.slug } });

  if (!tenant) {
    const databaseName = `hrm_tenant_${DEMO_TENANT.slug.replace(/-/g, "_")}`;
    console.log(`Creating database ${databaseName}...`);
    await createTenantDatabase(databaseName);
    tenant = await controlClient.tenant.create({
      data: { name: DEMO_TENANT.name, slug: DEMO_TENANT.slug, databaseName, status: "Active" },
    });
  }

  console.log(`Running migrations for tenant "${DEMO_TENANT.slug}"...`);
  runTenantMigrations(tenantDatabaseUrl(tenant.databaseName));

  const tenantClient = getTenantClient(tenant.databaseName);
  const roleIds = await seedDefaultRoles(tenantClient);
  await seedDefaultWeekDays(tenantClient);
  await seedDefaultScreeningQuestions(tenantClient);
  await seedDefaultSiteSections(tenantClient);

  const admin = await provisionTenantAdmin(tenantClient, {
    email: DEMO_TENANT.adminEmail,
    password: DEMO_TENANT.adminPassword,
    roleId: roleIds.Admin,
  });

  await seedDefaultLandingPageContent(tenantClient, { id: admin.id, email: admin.email }, DEMO_TENANT.name);
  await seedDemoPayrollData(tenantClient, admin.id);

  console.log(
    `Tenant admin ready: [slug=${DEMO_TENANT.slug}] ${DEMO_TENANT.adminEmail} / ${DEMO_TENANT.adminPassword}`
  );
}

/**
 * Idempotent starter data for the payroll module so there's something to
 * click through in a fresh demo tenant: one active PayCycle, the tenant admin's
 * employee assigned to it with an HOURLY rate. Only run for the demo tenant —
 * real provisioned tenants start with an empty payroll module by design.
 */
async function seedDemoPayrollData(tenantClient: ReturnType<typeof getTenantClient>, adminUserId: number): Promise<void> {
  const employee = await tenantClient.employee.findUnique({ where: { userId: adminUserId } });
  if (!employee) return;

  const payCycle =
    (await tenantClient.payCycle.findFirst({ where: { name: "Standard Fortnightly" } })) ??
    (await tenantClient.payCycle.create({
      data: { name: "Standard Fortnightly", frequency: "FORTNIGHTLY", createdById: adminUserId },
    }));

  await tenantClient.employee.update({ where: { id: employee.id }, data: { payCycleId: payCycle.id } });

  const existingRate = await tenantClient.employeePayRate.findFirst({ where: { employeeId: employee.id } });
  if (!existingRate) {
    await tenantClient.employeePayRate.create({
      data: {
        employeeId: employee.id,
        rateType: "HOURLY",
        baseRate: 35,
        effectiveFrom: new Date("2026-01-01"),
        createdById: adminUserId,
      },
    });
  }

  console.log(`Payroll demo data ready: pay cycle "${payCycle.name}", employee #${employee.id} rated $35/hr`);
}

async function main(): Promise<void> {
  await seedSaasAdmin();
  await seedDemoTenant();
  console.log("\nDemo seed complete — credentials match README 'Demo login details'.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await controlClient.$disconnect();
  });
