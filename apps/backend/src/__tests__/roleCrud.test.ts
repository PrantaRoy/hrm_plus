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
  tenant = await setupTestTenant("role");
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

describe("Role CRUD", () => {
  it("lists the seeded built-in roles as system roles", async () => {
    const res = await authed(request(app).get("/api/roles"));
    expect(res.status).toBe(200);
    const admin = res.body.find((r: any) => r.name === "Admin");
    expect(admin.isSystem).toBe(true);
  });

  it("creates a custom role that can be assigned to a new employee", async () => {
    const created = await authed(request(app).post("/api/roles")).send({
      name: "Team Lead",
      shortDescription: "Leads a small team",
    });
    expect(created.status).toBe(201);
    expect(created.body.isSystem).toBe(false);

    const employee = await authed(request(app).post("/api/employees")).send({
      firstName: "Lead",
      lastName: "Person",
      email: "lead.person@example.com",
      joiningDate: "2026-01-01",
      role: "Team Lead",
      password: "SuperSecret123!",
    });
    expect(employee.status).toBe(201);
    expect(employee.body.role).toBe("Team Lead");
  });

  it("rejects creating a duplicate role name", async () => {
    const res = await authed(request(app).post("/api/roles")).send({ name: "Team Lead" });
    expect(res.status).toBe(409);
  });

  it("blocks renaming a built-in role", async () => {
    const listRes = await authed(request(app).get("/api/roles"));
    const staffRole = listRes.body.find((r: any) => r.name === "Staff");

    const res = await authed(request(app).patch(`/api/roles/${staffRole.id}`)).send({ name: "Renamed" });
    expect(res.status).toBe(403);
  });

  it("allows updating status/description on a built-in role", async () => {
    const listRes = await authed(request(app).get("/api/roles"));
    const managerRole = listRes.body.find((r: any) => r.name === "Manager");

    const res = await authed(request(app).patch(`/api/roles/${managerRole.id}`)).send({
      shortDescription: "Manages a team",
    });
    expect(res.status).toBe(200);
    expect(res.body.shortDescription).toBe("Manages a team");
  });

  it("blocks deleting a built-in role", async () => {
    const listRes = await authed(request(app).get("/api/roles"));
    const staffRole = listRes.body.find((r: any) => r.name === "Staff");

    const res = await authed(request(app).delete(`/api/roles/${staffRole.id}`));
    expect(res.status).toBe(403);
  });

  it("blocks deleting a custom role that is assigned to a user", async () => {
    const listRes = await authed(request(app).get("/api/roles"));
    const teamLeadRole = listRes.body.find((r: any) => r.name === "Team Lead");

    const res = await authed(request(app).delete(`/api/roles/${teamLeadRole.id}`));
    expect(res.status).toBe(409);
  });

  it("deletes an unassigned custom role", async () => {
    const created = await authed(request(app).post("/api/roles")).send({ name: "Temp Role" });
    const res = await authed(request(app).delete(`/api/roles/${created.body.id}`));
    expect(res.status).toBe(204);
  });
});
