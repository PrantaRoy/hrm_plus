import request from "supertest";
import { TENANT_HEADER } from "@hrm-plus/shared";
import { createApp } from "../app";
import { controlClient } from "../db/controlClient";
import { disconnectAllTenantClients } from "../db/tenantClientPool";
import { loginAsAdmin, setupTestTenant, teardownTestTenant, TestTenant } from "./testUtils";

const app = createApp();
let tenant: TestTenant;
let token: string;

beforeAll(async () => {
  tenant = await setupTestTenant("crud");
  token = await loginAsAdmin(app, tenant);
}, 30000);

afterAll(async () => {
  await teardownTestTenant(tenant);
  await disconnectAllTenantClients();
  await controlClient.$disconnect();
});

function authed(req: request.Test) {
  return req.set(TENANT_HEADER, tenant.slug).set("Authorization", `Bearer ${token}`);
}

describe("Employee directory CRUD", () => {
  it("creates an employee with a linked login user", async () => {
    const res = await authed(request(app).post("/api/employees")).send({
      firstName: "Jane",
      lastName: "Doe",
      email: "jane.doe@example.com",
      startDate: "2026-01-15",
      role: "Staff",
      password: "SuperSecret123!",
    });

    expect(res.status).toBe(201);
    expect(res.body.firstName).toBe("Jane");
    expect(res.body.role).toBe("Staff");
    expect(res.body.status).toBe("Active");
  });

  it("lists and searches employees", async () => {
    const listRes = await authed(request(app).get("/api/employees"));
    expect(listRes.status).toBe(200);
    expect(listRes.body.total).toBeGreaterThanOrEqual(2); // seeded admin + Jane

    const searchRes = await authed(request(app).get("/api/employees").query({ search: "Jane" }));
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.total).toBe(1);
    expect(searchRes.body.items[0].firstName).toBe("Jane");
  });

  it("rejects duplicate email on create", async () => {
    const res = await authed(request(app).post("/api/employees")).send({
      firstName: "Jane",
      lastName: "Duplicate",
      email: "jane.doe@example.com",
      startDate: "2026-01-15",
      role: "Staff",
      password: "SuperSecret123!",
    });
    expect(res.status).toBe(409);
  });

  it("updates an employee and deactivates their login", async () => {
    const created = await authed(request(app).post("/api/employees")).send({
      firstName: "Sam",
      lastName: "Smith",
      email: "sam.smith@example.com",
      startDate: "2026-02-01",
      role: "Staff",
      password: "SuperSecret123!",
    });

    const updateRes = await authed(
      request(app).patch(`/api/employees/${created.body.id}`)
    ).send({ status: "Inactive", jobTitle: "Former Employee" });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.status).toBe("Inactive");
    expect(updateRes.body.jobTitle).toBe("Former Employee");
  });

  it("blocks non-Admin/HR roles from creating employees", async () => {
    const staffCreate = await authed(request(app).post("/api/employees")).send({
      firstName: "Extra",
      lastName: "Staff",
      email: "extra.staff@example.com",
      startDate: "2026-02-01",
      role: "Staff",
      password: "SuperSecret123!",
    });
    const staffToken = (
      await request(app)
        .post("/api/auth/login")
        .set(TENANT_HEADER, tenant.slug)
        .send({ email: "extra.staff@example.com", password: "SuperSecret123!" })
    ).body.accessToken;

    const res = await request(app)
      .post("/api/employees")
      .set(TENANT_HEADER, tenant.slug)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({
        firstName: "Blocked",
        lastName: "Attempt",
        email: "blocked@example.com",
        startDate: "2026-02-01",
        role: "Staff",
        password: "SuperSecret123!",
      });

    expect(staffCreate.status).toBe(201);
    expect(res.status).toBe(403);
  });
});
