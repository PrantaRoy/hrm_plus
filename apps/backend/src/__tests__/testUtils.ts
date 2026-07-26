import bcrypt from "bcrypt";
import { nanoid, customAlphabet } from "nanoid";
import request from "supertest";
import { Express } from "express";
import { controlClient } from "../db/controlClient";
import { getTenantClient } from "../db/tenantClientPool";
import { tenantDatabaseUrl } from "../config/env";
import {
  createTenantDatabase,
  dropTenantDatabase,
  runTenantMigrations,
  seedDefaultRoles,
} from "../modules/tenants/tenantProvisioning";

// Email- and slug-safe: nanoid's default alphabet includes "_", which occasionally produces
// addresses like "admin@iso-a-ab_cd.test" that fail the app's own email validation.
const safeSuffix = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 8);

export interface TestTenant {
  slug: string;
  databaseName: string;
  adminEmail: string;
  adminPassword: string;
}

export async function setupTestTenant(prefix: string): Promise<TestTenant> {
  const suffix = safeSuffix();
  const slug = `${prefix}-${suffix}`;
  const databaseName = `hrm_test_${prefix}_${suffix}`.replace(/-/g, "_");
  const adminEmail = `admin@${slug}.test`;
  const adminPassword = "TestPass123!";

  await createTenantDatabase(databaseName);
  runTenantMigrations(tenantDatabaseUrl(databaseName));

  await controlClient.tenant.create({
    data: { name: `Test Tenant ${suffix}`, slug, databaseName, status: "Active" },
  });

  const tenantClient = getTenantClient(databaseName);
  const roleIds = await seedDefaultRoles(tenantClient);

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const adminUser = await tenantClient.user.create({
    data: { email: adminEmail, passwordHash, roleId: roleIds.Admin },
  });

  await tenantClient.employee.create({
    data: {
      employeeCode: `EMP-${nanoid(6).toUpperCase()}`,
      firstName: "Test",
      lastName: "Admin",
      email: adminEmail,
      startDate: new Date(),
      userId: adminUser.id,
    },
  });

  return { slug, databaseName, adminEmail, adminPassword };
}

export async function teardownTestTenant(tenant: TestTenant): Promise<void> {
  await controlClient.tenant.deleteMany({ where: { slug: tenant.slug } });
  await dropTenantDatabase(tenant.databaseName);
}

export async function loginAsAdmin(app: Express, tenant: TestTenant): Promise<string> {
  const res = await request(app)
    .post("/api/auth/login")
    .set("X-Tenant-Slug", tenant.slug)
    .send({ email: tenant.adminEmail, password: tenant.adminPassword });
  if (res.status !== 200) {
    throw new Error(`loginAsAdmin failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.accessToken as string;
}

export interface TestSaasAdmin {
  email: string;
  password: string;
}

export async function setupTestSaasAdmin(prefix: string): Promise<TestSaasAdmin> {
  const suffix = safeSuffix();
  const email = `${prefix}-${suffix}@saas-admin.test`;
  const password = "SaasAdminPass123!";
  const passwordHash = await bcrypt.hash(password, 10);
  await controlClient.platformAdmin.create({ data: { email, passwordHash } });
  return { email, password };
}

export async function teardownTestSaasAdmin(admin: TestSaasAdmin): Promise<void> {
  await controlClient.platformAdmin.deleteMany({ where: { email: admin.email } });
}

export async function loginAsSaasAdmin(app: Express, admin: TestSaasAdmin): Promise<string> {
  const res = await request(app)
    .post("/saas/admin/auth/login")
    .send({ email: admin.email, password: admin.password });
  if (res.status !== 200) {
    throw new Error(`loginAsSaasAdmin failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.accessToken as string;
}
