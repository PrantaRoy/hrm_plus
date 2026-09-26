import request from "supertest";
import { TENANT_HEADER } from "@hrm-plus/shared";
import { createApp } from "../app";
import { disconnectAllTenantClients } from "../db/tenantClientPool";
import { loginAsAdmin, setupTestTenant, teardownTestTenant, TestTenant } from "./testUtils";

const app = createApp();
let tenant: TestTenant;
let adminToken: string;
let staffToken: string;

function as(req: request.Test, token: string) {
  return req.set(TENANT_HEADER, tenant.slug).set("Authorization", `Bearer ${token}`);
}
const asAdmin = (req: request.Test) => as(req, adminToken);
const asStaff = (req: request.Test) => as(req, staffToken);

beforeAll(async () => {
  tenant = await setupTestTenant("sticky");
  adminToken = await loginAsAdmin(app, tenant);

  const staffRes = await asAdmin(request(app).post("/api/employees")).send({
    firstName: "Staff",
    lastName: "Member",
    email: "sticky.staff@example.com",
    joiningDate: "2026-01-01",
    role: "Staff",
    password: "SuperSecret123!",
  });
  expect(staffRes.status).toBe(201);

  const staffLogin = await request(app)
    .post("/api/auth/login")
    .set(TENANT_HEADER, tenant.slug)
    .send({ email: "sticky.staff@example.com", password: "SuperSecret123!" });
  staffToken = staffLogin.body.accessToken;
});

afterAll(async () => {
  await disconnectAllTenantClients();
  await teardownTestTenant(tenant);
});

describe("sticky notes", () => {
  it("requires authentication", async () => {
    const res = await request(app).get("/api/sticky-notes").set(TENANT_HEADER, tenant.slug);
    expect(res.status).toBe(401);
  });

  it("rejects empty content", async () => {
    const res = await asAdmin(request(app).post("/api/sticky-notes")).send({ content: "" });
    expect(res.status).toBe(400);
  });

  it("rejects an invalid priority", async () => {
    const res = await asAdmin(request(app).post("/api/sticky-notes")).send({
      content: "Bad priority",
      priority: "URGENT",
    });
    expect(res.status).toBe(400);
  });

  it("creates a note and lists it (defaults to ACTIVE)", async () => {
    const deadline = new Date(Date.now() + 86400000).toISOString();
    const createRes = await asAdmin(request(app).post("/api/sticky-notes")).send({
      content: "Finish the KPI review",
      priority: "HIGH",
      deadline,
    });
    expect(createRes.status).toBe(201);
    expect(createRes.body).toMatchObject({
      content: "Finish the KPI review",
      priority: "HIGH",
      status: "ACTIVE",
    });

    const listRes = await asAdmin(request(app).get("/api/sticky-notes"));
    expect(listRes.status).toBe(200);
    expect(listRes.body.some((n: { id: number }) => n.id === createRes.body.id)).toBe(true);
  });

  it("hides a note via DONE or DISMISSED, filterable by status", async () => {
    const doneNote = await asAdmin(request(app).post("/api/sticky-notes")).send({ content: "Will be done" });
    const dismissedNote = await asAdmin(request(app).post("/api/sticky-notes")).send({
      content: "Will be dismissed",
    });

    const doneUpdate = await asAdmin(request(app).patch(`/api/sticky-notes/${doneNote.body.id}/status`)).send({
      status: "DONE",
    });
    expect(doneUpdate.status).toBe(200);
    expect(doneUpdate.body.status).toBe("DONE");

    const dismissedUpdate = await asAdmin(
      request(app).patch(`/api/sticky-notes/${dismissedNote.body.id}/status`)
    ).send({ status: "DISMISSED" });
    expect(dismissedUpdate.status).toBe(200);
    expect(dismissedUpdate.body.status).toBe("DISMISSED");

    const activeList = await asAdmin(request(app).get("/api/sticky-notes"));
    const activeIds = activeList.body.map((n: { id: number }) => n.id);
    expect(activeIds).not.toContain(doneNote.body.id);
    expect(activeIds).not.toContain(dismissedNote.body.id);

    const doneList = await asAdmin(request(app).get("/api/sticky-notes?status=DONE"));
    expect(doneList.body.map((n: { id: number }) => n.id)).toContain(doneNote.body.id);

    const dismissedList = await asAdmin(request(app).get("/api/sticky-notes?status=DISMISSED"));
    expect(dismissedList.body.map((n: { id: number }) => n.id)).toContain(dismissedNote.body.id);
  });

  it("scopes notes to their own user", async () => {
    const adminNote = await asAdmin(request(app).post("/api/sticky-notes")).send({ content: "Admin's private note" });

    const staffList = await asStaff(request(app).get("/api/sticky-notes"));
    expect(staffList.body.map((n: { id: number }) => n.id)).not.toContain(adminNote.body.id);

    const staffPatch = await asStaff(request(app).patch(`/api/sticky-notes/${adminNote.body.id}/status`)).send({
      status: "DONE",
    });
    expect(staffPatch.status).toBe(404);
  });
});
