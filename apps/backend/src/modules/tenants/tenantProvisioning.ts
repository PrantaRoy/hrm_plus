import { execFileSync } from "node:child_process";
import path from "node:path";
import bcrypt from "bcrypt";
import mysql from "mysql2/promise";
import { nanoid } from "nanoid";
import { ROLES } from "@hrm-plus/shared";
import { PrismaClient as TenantPrismaClient, User as TenantUser } from "../../../generated/tenant";
import { env } from "../../config/env";

async function withAdminConnection<T>(fn: (conn: mysql.Connection) => Promise<T>): Promise<T> {
  const connection = await mysql.createConnection({
    host: env.TENANT_DB_HOST,
    port: Number(env.TENANT_DB_PORT),
    user: env.TENANT_DB_USER,
    password: env.TENANT_DB_PASSWORD,
  });
  try {
    return await fn(connection);
  } finally {
    await connection.end();
  }
}

export async function createTenantDatabase(databaseName: string): Promise<void> {
  await withAdminConnection((conn) => conn.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\``) as any);
}

export async function dropTenantDatabase(databaseName: string): Promise<void> {
  await withAdminConnection((conn) => conn.query(`DROP DATABASE IF EXISTS \`${databaseName}\``) as any);
}

export function runTenantMigrations(databaseUrl: string): void {
  const schemaPath = path.join(__dirname, "..", "..", "..", "prisma", "tenant", "schema.prisma");
  execFileSync("npx", ["prisma", "migrate", "deploy", `--schema=${schemaPath}`], {
    stdio: "inherit",
    env: { ...process.env, TENANT_MIGRATION_DATABASE_URL: databaseUrl },
  });
}

export async function seedDefaultRoles(
  tenantClient: TenantPrismaClient
): Promise<Record<(typeof ROLES)[number], number>> {
  const records = await Promise.all(
    ROLES.map((roleName) =>
      tenantClient.role.upsert({
        where: { name: roleName },
        update: {},
        create: { name: roleName },
      })
    )
  );

  return Object.fromEntries(records.map((r) => [r.name, r.id])) as Record<
    (typeof ROLES)[number],
    number
  >;
}

const WEEK_DAYS: Array<{ name: string; isWeekend: boolean }> = [
  { name: "Sunday", isWeekend: true },
  { name: "Monday", isWeekend: false },
  { name: "Tuesday", isWeekend: false },
  { name: "Wednesday", isWeekend: false },
  { name: "Thursday", isWeekend: false },
  { name: "Friday", isWeekend: false },
  { name: "Saturday", isWeekend: true },
];

export async function seedDefaultWeekDays(tenantClient: TenantPrismaClient): Promise<void> {
  const existing = await tenantClient.weekDay.count();
  if (existing > 0) {
    return;
  }
  await tenantClient.weekDay.createMany({ data: WEEK_DAYS });
}

const DOCUMENT_CATEGORIES: Array<{ code: string; name: string }> = [
  { code: "SALARY_CERT", name: "Salary Certificate" },
  { code: "PAYSLIP", name: "Payslip" },
  { code: "EXP_LETTER", name: "Experience Letter" },
  { code: "APPOINT_LETTER", name: "Appointment Letter" },
  { code: "LEAVE_APPROVAL", name: "Leave Approval Letter" },
  { code: "APPRECIATION_LETTER", name: "Appreciation Letter" },
  { code: "SALARY_INCREMENT", name: "Salary Increment Letter" },
  { code: "AWARD_LETTER", name: "Award Letter" },
];

/**
 * Kept in sync with the seed INSERT embedded in migration
 * `20260805125453_add_document_builder/migration.sql` (which is what actually
 * seeds already-provisioned tenants when their migrations run). This helper
 * exists for new-tenant provisioning parity and test setup.
 */
export async function seedDefaultDocumentCategories(tenantClient: TenantPrismaClient): Promise<void> {
  await Promise.all(
    DOCUMENT_CATEGORIES.map((category) =>
      tenantClient.documentCategory.upsert({
        where: { code: category.code },
        update: { name: category.name },
        create: category,
      })
    )
  );
}

/**
 * Idempotently ensures a tenant admin user (+ linked employee) exists with the
 * given plaintext password. Re-running this always resets the password back
 * to `params.password` instead of leaving behind a previously-generated one.
 */
export async function provisionTenantAdmin(
  tenantClient: TenantPrismaClient,
  params: { email: string; password: string; roleId: number }
): Promise<TenantUser> {
  const passwordHash = await bcrypt.hash(params.password, 10);

  const adminUser = await tenantClient.user.upsert({
    where: { email: params.email },
    update: { passwordHash, roleId: params.roleId, mustChangePassword: false },
    create: { email: params.email, passwordHash, roleId: params.roleId },
  });

  await tenantClient.employee.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      employeeCode: `EMP-${nanoid(6).toUpperCase()}`,
      firstName: "Tenant",
      lastName: "Admin",
      email: params.email,
      joiningDate: new Date(),
      userId: adminUser.id,
    },
  });

  return adminUser;
}
