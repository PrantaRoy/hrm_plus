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
let applicationId: number;
let tenantSlug: string;
let tenantDatabaseName: string;
let tenantId: number;
const contactEmail = `owner-${Date.now()}@approvaltest.example`;

beforeAll(async () => {
  saasAdmin = await setupTestSaasAdmin("approval");
  saasToken = await loginAsSaasAdmin(app, saasAdmin);

  const pkg = await controlClient.package.create({
    data: { name: "Approval Test Package", price: 19.99, validityDays: 30 },
  });
  packageId = pkg.id;

  tenantSlug = `approval-${Date.now()}`;

  const submitRes = await request(app)
    .post("/saas/public/applications")
    .field("companyName", "Approval Test Co")
    .field("companyType", "Services")
    .field("overview", "Company used to test the approval flow")
    .field("numberOfEmployees", "25")
    .field("contactEmail", contactEmail)
    .field("subdomainSlug", tenantSlug)
    .field("packageId", String(packageId));

  applicationId = submitRes.body.id;
}, 30000);

afterAll(async () => {
  await disconnectAllTenantClients();
  if (tenantId) {
    await controlClient.tenant.deleteMany({ where: { id: tenantId } });
  }
  await controlClient.tenantApplication.deleteMany({ where: { id: applicationId } });
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

describe("Tenant approval provisions a real tenant database", () => {
  it("approves the application and provisions the tenant", async () => {
    const res = await asSaasAdmin(request(app).post(`/saas/admin/applications/${applicationId}/approve`));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("Approved");

    const tenant = await controlClient.tenant.findUnique({ where: { slug: tenantSlug } });
    expect(tenant).not.toBeNull();
    tenantId = tenant!.id;
    tenantDatabaseName = tenant!.databaseName;
    expect(tenant!.packageId).toBe(packageId);
    expect(tenant!.status).toBe("Active");

    const expectedEndDate = new Date(tenant!.startDate);
    expectedEndDate.setDate(expectedEndDate.getDate() + 30);
    expect(tenant!.endDate?.toISOString().slice(0, 10)).toBe(expectedEndDate.toISOString().slice(0, 10));
  }, 30000);

  it("creates the tenant admin user with the default password and mustChangePassword=true", async () => {
    const tenantClient = getTenantClient(tenantDatabaseName);
    const user = await tenantClient.user.findUnique({
      where: { email: contactEmail },
      include: { role: true },
    });
    expect(user).not.toBeNull();
    expect(user!.role.name).toBe("Admin");
    expect(user!.mustChangePassword).toBe(true);
  });

  it("confirms the email exists via check-email on the new tenant", async () => {
    const res = await request(app)
      .post("/api/auth/check-email")
      .set(TENANT_HEADER, tenantSlug)
      .send({ email: contactEmail });
    expect(res.status).toBe(200);
    expect(res.body.exists).toBe(true);

    const missingRes = await request(app)
      .post("/api/auth/check-email")
      .set(TENANT_HEADER, tenantSlug)
      .send({ email: "nobody@approvaltest.example" });
    expect(missingRes.body.exists).toBe(false);
  });

  it("logs in with the default password and reports mustChangePassword", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set(TENANT_HEADER, tenantSlug)
      .send({ email: contactEmail, password: "12345678" });

    expect(res.status).toBe(200);
    expect(res.body.mustChangePassword).toBe(true);
  });

  it("forces a password change before further use", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .set(TENANT_HEADER, tenantSlug)
      .send({ email: contactEmail, password: "12345678" });
    const token = loginRes.body.accessToken;

    const changeRes = await request(app)
      .post("/api/auth/change-password")
      .set(TENANT_HEADER, tenantSlug)
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: "12345678", newPassword: "BrandNewPass123!" });
    expect(changeRes.status).toBe(204);

    const oldPasswordRes = await request(app)
      .post("/api/auth/login")
      .set(TENANT_HEADER, tenantSlug)
      .send({ email: contactEmail, password: "12345678" });
    expect(oldPasswordRes.status).toBe(401);

    const newPasswordRes = await request(app)
      .post("/api/auth/login")
      .set(TENANT_HEADER, tenantSlug)
      .send({ email: contactEmail, password: "BrandNewPass123!" });
    expect(newPasswordRes.status).toBe(200);
    expect(newPasswordRes.body.mustChangePassword).toBe(false);
  });

  it("appears in the saas admin tenant list with package name and dates", async () => {
    const res = await asSaasAdmin(request(app).get("/saas/admin/tenants"));
    const entry = res.body.find((t: { slug: string }) => t.slug === tenantSlug);
    expect(entry).toBeDefined();
    expect(entry.packageName).toBe("Approval Test Package");
    expect(entry.endDate).not.toBeNull();
  });

  it("deactivating the tenant blocks all further access to its subdomain", async () => {
    const tenant = await controlClient.tenant.findUnique({ where: { slug: tenantSlug } });
    const toggleRes = await asSaasAdmin(
      request(app).post(`/saas/admin/tenants/${tenant!.id}/toggle-status`)
    );
    expect(toggleRes.status).toBe(200);
    expect(toggleRes.body.status).toBe("Inactive");

    const blockedRes = await request(app)
      .post("/api/auth/check-email")
      .set(TENANT_HEADER, tenantSlug)
      .send({ email: contactEmail });
    expect(blockedRes.status).toBe(404);
  });
});
