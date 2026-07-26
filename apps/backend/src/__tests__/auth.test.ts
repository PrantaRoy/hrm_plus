import request from "supertest";
import { TENANT_HEADER } from "@hrm-plus/shared";
import { createApp } from "../app";
import { controlClient } from "../db/controlClient";
import { disconnectAllTenantClients } from "../db/tenantClientPool";
import { setupTestTenant, teardownTestTenant, TestTenant } from "./testUtils";

const app = createApp();
let tenant: TestTenant;

beforeAll(async () => {
  tenant = await setupTestTenant("auth");
}, 30000);

afterAll(async () => {
  await teardownTestTenant(tenant);
  await disconnectAllTenantClients();
  await controlClient.$disconnect();
});

describe("POST /api/auth/login", () => {
  it("logs in with correct credentials and returns a scoped access token", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set(TENANT_HEADER, tenant.slug)
      .send({ email: tenant.adminEmail, password: tenant.adminPassword });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.user.email).toBe(tenant.adminEmail);
    expect(res.body.user.role).toBe("Admin");
    expect(res.body.tenantSlug).toBe(tenant.slug);
  });

  it("rejects an incorrect password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set(TENANT_HEADER, tenant.slug)
      .send({ email: tenant.adminEmail, password: "wrong-password" });

    expect(res.status).toBe(401);
  });

  it("rejects a login for an unknown tenant", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set(TENANT_HEADER, "does-not-exist")
      .send({ email: tenant.adminEmail, password: tenant.adminPassword });

    expect(res.status).toBe(404);
  });

  it("rejects requests to protected routes without a token", async () => {
    const res = await request(app).get("/api/employees").set(TENANT_HEADER, tenant.slug);
    expect(res.status).toBe(401);
  });
});
