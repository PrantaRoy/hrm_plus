import request from "supertest";
import { TENANT_HEADER } from "@hrm-plus/shared";
import { createApp } from "../app";
import { controlClient } from "../db/controlClient";
import { disconnectAllTenantClients } from "../db/tenantClientPool";
import { loginAsAdmin, setupTestTenant, teardownTestTenant, TestTenant } from "./testUtils";

const app = createApp();
let tenantA: TestTenant;
let tenantB: TestTenant;
let tokenA: string;
let tokenB: string;

beforeAll(async () => {
  tenantA = await setupTestTenant("iso-a");
  tenantB = await setupTestTenant("iso-b");
  tokenA = await loginAsAdmin(app, tenantA);
  tokenB = await loginAsAdmin(app, tenantB);
}, 60000);

afterAll(async () => {
  await teardownTestTenant(tenantA);
  await teardownTestTenant(tenantB);
  await disconnectAllTenantClients();
  await controlClient.$disconnect();
});

describe("Multi-tenant isolation", () => {
  it("does not expose tenant A's employees through tenant B's API calls", async () => {
    const createRes = await request(app)
      .post("/api/employees")
      .set(TENANT_HEADER, tenantA.slug)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        firstName: "Secret",
        lastName: "FromTenantA",
        email: "secret@tenant-a.test",
        joiningDate: "2026-01-01",
        role: "Staff",
        password: "SuperSecret123!",
      });
    expect(createRes.status).toBe(201);
    const employeeId = createRes.body.id;

    const listFromB = await request(app)
      .get("/api/employees")
      .query({ search: "Secret" })
      .set(TENANT_HEADER, tenantB.slug)
      .set("Authorization", `Bearer ${tokenB}`);

    expect(listFromB.status).toBe(200);
    expect(listFromB.body.total).toBe(0);

    const directFetchFromB = await request(app)
      .get(`/api/employees/${employeeId}`)
      .set(TENANT_HEADER, tenantB.slug)
      .set("Authorization", `Bearer ${tokenB}`);

    expect(directFetchFromB.status).toBe(404);
  });

  it("rejects a tenant A token when used against tenant B's header", async () => {
    const res = await request(app)
      .get("/api/employees")
      .set(TENANT_HEADER, tenantB.slug)
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(401);
  });
});
