import request from "supertest";
import { TENANT_HEADER } from "@hrm-plus/shared";
import { createApp } from "../app";
import { controlClient } from "../db/controlClient";
import { getTenantClient, disconnectAllTenantClients } from "../db/tenantClientPool";
import { dropTenantDatabase } from "../modules/tenants/tenantProvisioning";
import { setupTestSaasAdmin, teardownTestSaasAdmin, loginAsSaasAdmin, TestSaasAdmin } from "./testUtils";

const app = createApp();
let saasAdmin: TestSaasAdmin;
let saasToken: string;
let packageId: number;
let applicationId: number | undefined;
let tenantId: number | undefined;
let tenantDatabaseName: string | undefined;
const tenantSlug = `admincreate-${Date.now()}`;
const contactEmail = `owner-${Date.now()}@admincreatetest.example`;

beforeAll(async () => {
  saasAdmin = await setupTestSaasAdmin("admincreate");
  saasToken = await loginAsSaasAdmin(app, saasAdmin);

  const pkg = await controlClient.package.create({
    data: { name: "Admin Create Package", price: 0, validityDays: 30 },
  });
  packageId = pkg.id;
}, 30000);

afterAll(async () => {
  await disconnectAllTenantClients();
  if (tenantId) {
    await controlClient.tenant.deleteMany({ where: { id: tenantId } });
  }
  if (applicationId) {
    await controlClient.tenantApplication.deleteMany({ where: { id: applicationId } });
  }
  await controlClient.package.deleteMany({ where: { id: packageId } });
  await teardownTestSaasAdmin(saasAdmin);
  if (tenantDatabaseName) {
    await dropTenantDatabase(tenantDatabaseName);
  }
  await controlClient.$disconnect();
}, 30000);

function asSaasAdmin(req: request.Test) {
  return req.set("Authorization", `Bearer ${saasToken}`);
}

describe("SaaS admin can create a company directly", () => {
  it("provisions an active tenant without a review step", async () => {
    const res = await asSaasAdmin(
      request(app)
        .post("/saas/admin/tenants")
        .field("companyName", "Admin Created Co")
        .field("companyType", "Services")
        .field("overview", "Company provisioned straight from the admin panel")
        .field("numberOfEmployees", "10")
        .field("contactEmail", contactEmail)
        .field("subdomainSlug", tenantSlug)
        .field("packageId", String(packageId))
    );

    expect(res.status).toBe(201);
    expect(res.body.slug).toBe(tenantSlug);
    expect(res.body.status).toBe("Active");
    expect(res.body.packageName).toBe("Admin Create Package");

    tenantId = res.body.id;

    const tenant = await controlClient.tenant.findUnique({ where: { slug: tenantSlug } });
    expect(tenant).not.toBeNull();
    tenantDatabaseName = tenant!.databaseName;
    applicationId = tenant!.applicationId ?? undefined;

    const application = await controlClient.tenantApplication.findUnique({
      where: { id: applicationId },
    });
    expect(application!.status).toBe("Approved");
  }, 60000);

  it("creates a tenant admin that can log in with the default password", async () => {
    const tenantClient = getTenantClient(tenantDatabaseName!);
    const user = await tenantClient.user.findUnique({
      where: { email: contactEmail },
      include: { role: true },
    });
    expect(user!.role.name).toBe("Admin");

    const loginRes = await request(app)
      .post("/api/auth/login")
      .set(TENANT_HEADER, tenantSlug)
      .send({ email: contactEmail, password: "12345678" });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.mustChangePassword).toBe(true);
  }, 30000);

  it("rejects a duplicate subdomain", async () => {
    const res = await asSaasAdmin(
      request(app)
        .post("/saas/admin/tenants")
        .field("companyName", "Dupe Co")
        .field("companyType", "Services")
        .field("overview", "Should collide on the subdomain slug")
        .field("numberOfEmployees", "5")
        .field("contactEmail", `dupe-${Date.now()}@admincreatetest.example`)
        .field("subdomainSlug", tenantSlug)
        .field("packageId", String(packageId))
    );
    expect(res.status).toBe(409);
  });

  it("requires saas admin auth", async () => {
    const res = await request(app)
      .post("/saas/admin/tenants")
      .field("companyName", "No Auth Co")
      .field("companyType", "Services")
      .field("overview", "Should be rejected without a token")
      .field("numberOfEmployees", "5")
      .field("contactEmail", `noauth-${Date.now()}@admincreatetest.example`)
      .field("subdomainSlug", `noauth-${Date.now()}`)
      .field("packageId", String(packageId));
    expect(res.status).toBe(401);
  });
});
