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
  tenant = await setupTestTenant("settings");
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

describe("Shift CRUD", () => {
  it("creates, updates, and deletes a shift", async () => {
    const created = await authed(request(app).post("/api/shifts")).send({
      name: "Morning",
      startTime: "09:00",
      endTime: "17:00",
    });
    expect(created.status).toBe(201);
    expect(created.body.status).toBe("Active");

    const listRes = await authed(request(app).get("/api/shifts"));
    expect(listRes.status).toBe(200);
    expect(listRes.body.some((s: any) => s.id === created.body.id)).toBe(true);

    const updateRes = await authed(request(app).patch(`/api/shifts/${created.body.id}`)).send({
      endTime: "18:00",
    });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.endTime).toBe("18:00");

    const deleteRes = await authed(request(app).delete(`/api/shifts/${created.body.id}`));
    expect(deleteRes.status).toBe(204);
  });

  it("rejects an invalid time format", async () => {
    const res = await authed(request(app).post("/api/shifts")).send({
      name: "Bad Shift",
      startTime: "9am",
      endTime: "17:00",
    });
    expect(res.status).toBe(400);
  });
});

describe("Week Day CRUD", () => {
  it("creates, updates, and deletes a week day", async () => {
    const created = await authed(request(app).post("/api/weekdays")).send({
      name: "Friday",
      isWeekend: false,
    });
    expect(created.status).toBe(201);
    expect(created.body.isWeekend).toBe(false);

    const updateRes = await authed(request(app).patch(`/api/weekdays/${created.body.id}`)).send({
      isWeekend: true,
    });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.isWeekend).toBe(true);

    const deleteRes = await authed(request(app).delete(`/api/weekdays/${created.body.id}`));
    expect(deleteRes.status).toBe(204);
  });
});

describe("Leave Type CRUD", () => {
  it("creates, updates, and deletes a leave type", async () => {
    const created = await authed(request(app).post("/api/leave-types")).send({
      name: "Sick Leave",
      assignedDays: 10,
    });
    expect(created.status).toBe(201);
    expect(created.body.assignedDays).toBe(10);

    const updateRes = await authed(request(app).patch(`/api/leave-types/${created.body.id}`)).send({
      assignedDays: 12,
    });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.assignedDays).toBe(12);

    const deleteRes = await authed(request(app).delete(`/api/leave-types/${created.body.id}`));
    expect(deleteRes.status).toBe(204);
  });
});

describe("Designation CRUD", () => {
  it("creates, updates, and deletes a designation", async () => {
    const created = await authed(request(app).post("/api/designations")).send({
      name: "Software Engineer",
      shortDescription: "Builds software",
    });
    expect(created.status).toBe(201);
    expect(created.body.shortDescription).toBe("Builds software");

    const updateRes = await authed(request(app).patch(`/api/designations/${created.body.id}`)).send({
      status: "Inactive",
    });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.status).toBe("Inactive");

    const deleteRes = await authed(request(app).delete(`/api/designations/${created.body.id}`));
    expect(deleteRes.status).toBe(204);
  });
});

describe("Department CRUD (extended)", () => {
  it("creates a department with status and short description, then updates and deletes it", async () => {
    const created = await authed(request(app).post("/api/departments")).send({
      name: "Engineering",
      shortDescription: "Builds the product",
    });
    expect(created.status).toBe(201);
    expect(created.body.status).toBe("Active");
    expect(created.body.shortDescription).toBe("Builds the product");

    const updateRes = await authed(request(app).patch(`/api/departments/${created.body.id}`)).send({
      status: "Inactive",
    });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.status).toBe("Inactive");

    const deleteRes = await authed(request(app).delete(`/api/departments/${created.body.id}`));
    expect(deleteRes.status).toBe(204);
  });

  it("blocks deleting a department that has employees assigned", async () => {
    const dept = await authed(request(app).post("/api/departments")).send({ name: "Sales" });

    await authed(request(app).post("/api/employees")).send({
      firstName: "Dept",
      lastName: "Worker",
      email: "dept.worker@example.com",
      startDate: "2026-01-01",
      role: "Staff",
      password: "SuperSecret123!",
      departmentId: dept.body.id,
    });

    const deleteRes = await authed(request(app).delete(`/api/departments/${dept.body.id}`));
    expect(deleteRes.status).toBe(409);
  });
});

describe("Settings CRUD authorization", () => {
  it("blocks non-Admin/HR roles from creating shifts", async () => {
    await authed(request(app).post("/api/employees")).send({
      firstName: "Plain",
      lastName: "Staffer",
      email: "plain.staffer@example.com",
      startDate: "2026-01-01",
      role: "Staff",
      password: "SuperSecret123!",
    });
    const staffToken = (
      await request(app)
        .post("/api/auth/login")
        .set(TENANT_HEADER, tenant.slug)
        .send({ email: "plain.staffer@example.com", password: "SuperSecret123!" })
    ).body.accessToken;

    const res = await request(app)
      .post("/api/shifts")
      .set(TENANT_HEADER, tenant.slug)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ name: "Night Shift", startTime: "22:00", endTime: "06:00" });

    expect(res.status).toBe(403);
  });
});
