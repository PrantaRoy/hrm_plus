import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import { controlClient } from "../db/controlClient";
import { getTenantClient } from "../db/tenantClientPool";
import { tenantDatabaseUrl } from "../config/env";
import {
  createTenantDatabase,
  dropTenantDatabase,
  runTenantMigrations,
  seedDefaultRoles,
} from "../modules/tenants/tenantProvisioning";

export interface TestTenant {
  slug: string;
  databaseName: string;
  adminEmail: string;
  adminPassword: string;
}

export async function setupTestTenant(prefix: string): Promise<TestTenant> {
  const suffix = nanoid(8).toLowerCase();
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
