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
  it("creates an employee with a linked login user and the full HR profile", async () => {
    const res = await authed(request(app).post("/api/employees")).send({
      firstName: "Jane",
      lastName: "Doe",
      email: "jane.doe@example.com",
      phoneNumber: "+1-555-0100",
      gender: "Female",
      dateOfBirth: "1990-05-01",
      joiningDate: "2026-01-15",
      employmentType: "Full-Time",
      role: "Staff",
      password: "SuperSecret123!",
    });

    expect(res.status).toBe(201);
    expect(res.body.firstName).toBe("Jane");
    expect(res.body.role).toBe("Staff");
    expect(res.body.status).toBe("Active");
    expect(res.body.phoneNumber).toBe("+1-555-0100");
    expect(res.body.gender).toBe("Female");
    expect(res.body.joiningDate.slice(0, 10)).toBe("2026-01-15");
    expect(res.body.employmentType).toBe("Full-Time");
    expect(res.body.avatarUrl).toBeNull();
  });

  it("creates an employee with a department, designation, and reporting-to manager", async () => {
    const department = await authed(request(app).post("/api/departments")).send({ name: "Engineering" });
    const designation = await authed(request(app).post("/api/designations")).send({ name: "Engineer" });
    const managerRes = await authed(request(app).post("/api/employees")).send({
      firstName: "Mona",
      lastName: "Manager",
      email: "mona.manager@example.com",
      joiningDate: "2026-01-01",
      role: "Manager",
      password: "SuperSecret123!",
    });

    const res = await authed(request(app).post("/api/employees")).send({
      firstName: "Rick",
      lastName: "Report",
      email: "rick.report@example.com",
      joiningDate: "2026-01-15",
      departmentId: department.body.id,
      designationId: designation.body.id,
      reportingToId: managerRes.body.id,
      role: "Staff",
      password: "SuperSecret123!",
    });

    expect(res.status).toBe(201);
    expect(res.body.departmentName).toBe("Engineering");
    expect(res.body.designationName).toBe("Engineer");
    expect(res.body.reportingToId).toBe(managerRes.body.id);
    expect(res.body.reportingToName).toBe("Mona Manager");
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
      joiningDate: "2026-01-15",
      role: "Staff",
      password: "SuperSecret123!",
    });
    expect(res.status).toBe(409);
  });

  it("updates an employee's HR profile fields and deactivates their login", async () => {
    const created = await authed(request(app).post("/api/employees")).send({
      firstName: "Sam",
      lastName: "Smith",
      email: "sam.smith@example.com",
      joiningDate: "2026-02-01",
      role: "Staff",
      password: "SuperSecret123!",
    });

    const updateRes = await authed(request(app).patch(`/api/employees/${created.body.id}`)).send({
      status: "Inactive",
      jobTitle: "Former Employee",
      terminationDate: "2026-06-01",
      employmentType: "Part-Time",
    });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.status).toBe("Inactive");
    expect(updateRes.body.jobTitle).toBe("Former Employee");
    expect(updateRes.body.terminationDate?.slice(0, 10)).toBe("2026-06-01");
    expect(updateRes.body.employmentType).toBe("Part-Time");
  });

  it("rejects an employee reporting to themselves", async () => {
    const created = await authed(request(app).post("/api/employees")).send({
      firstName: "Self",
      lastName: "Reporter",
      email: "self.reporter@example.com",
      joiningDate: "2026-02-01",
      role: "Staff",
      password: "SuperSecret123!",
    });

    const res = await authed(request(app).patch(`/api/employees/${created.body.id}`)).send({
      reportingToId: created.body.id,
    });
    expect(res.status).toBe(400);
  });

  it("rejects an invalid gender value", async () => {
    const res = await authed(request(app).post("/api/employees")).send({
      firstName: "Bad",
      lastName: "Gender",
      email: "bad.gender@example.com",
      joiningDate: "2026-02-01",
      gender: "Unknown",
      role: "Staff",
      password: "SuperSecret123!",
    });
    expect(res.status).toBe(400);
  });

  it("blocks non-Admin/HR roles from creating employees", async () => {
    const staffCreate = await authed(request(app).post("/api/employees")).send({
      firstName: "Extra",
      lastName: "Staff",
      email: "extra.staff@example.com",
      joiningDate: "2026-02-01",
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
        joiningDate: "2026-02-01",
        role: "Staff",
        password: "SuperSecret123!",
      });

    expect(staffCreate.status).toBe(201);
    expect(res.status).toBe(403);
  });
});
