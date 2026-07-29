import request from "supertest";
import { TENANT_HEADER } from "@hrm-plus/shared";
import { createApp } from "../app";
import { controlClient } from "../db/controlClient";
import { disconnectAllTenantClients } from "../db/tenantClientPool";
import { loginAsAdmin, setupTestTenant, teardownTestTenant, TestTenant } from "./testUtils";

const app = createApp();
let tenant: TestTenant;
let token: string;
let employeeId: number;

const fakePdf = Buffer.from("%PDF-1.4 fake");

beforeAll(async () => {
  tenant = await setupTestTenant("docs");
  token = await loginAsAdmin(app, tenant);

  const created = await authed(request(app).post("/api/employees")).send({
    firstName: "Dana",
    lastName: "Docs",
    email: "dana.docs@example.com",
    joiningDate: "2026-01-15",
    role: "Staff",
    password: "SuperSecret123!",
  });
  employeeId = created.body.id;
}, 30000);

afterAll(async () => {
  await teardownTestTenant(tenant);
  await disconnectAllTenantClients();
  await controlClient.$disconnect();
});

function authed(req: request.Test) {
  return req.set(TENANT_HEADER, tenant.slug).set("Authorization", `Bearer ${token}`);
}

describe("Employee documents", () => {
  it("creates a document with an uploaded file", async () => {
    const res = await authed(request(app).post(`/api/employees/${employeeId}/documents`))
      .field("documentName", "Work Visa")
      .field("type", "Visa")
      .field("startDate", "2026-01-01")
      .field("expiryDate", "2027-01-01")
      .attach("file", fakePdf, { filename: "visa.pdf", contentType: "application/pdf" });

    expect(res.status).toBe(201);
    expect(res.body.documentName).toBe("Work Visa");
    expect(res.body.type).toBe("Visa");
    expect(res.body.status).toBe("Active");
    expect(res.body.documentFileUrl).toMatch(/^\/uploads\/employee-documents\/.+\.pdf$/);
  });

  it("lists documents for the employee", async () => {
    const res = await authed(request(app).get(`/api/employees/${employeeId}/documents`));
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it("rejects creating a document without a file", async () => {
    const res = await authed(request(app).post(`/api/employees/${employeeId}/documents`))
      .field("documentName", "No File")
      .field("type", "Certification");
    expect(res.status).toBe(400);
  });

  it("updates document metadata (status) without touching the file", async () => {
    const created = await authed(request(app).post(`/api/employees/${employeeId}/documents`))
      .field("documentName", "First Aid Cert")
      .field("type", "Certification")
      .attach("file", fakePdf, { filename: "cert.pdf", contentType: "application/pdf" });

    const updateRes = await authed(
      request(app).patch(`/api/employees/${employeeId}/documents/${created.body.id}`)
    ).send({ status: "Inactive" });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.status).toBe("Inactive");
    expect(updateRes.body.documentFileUrl).toBe(created.body.documentFileUrl);
  });

  it("deletes a document", async () => {
    const created = await authed(request(app).post(`/api/employees/${employeeId}/documents`))
      .field("documentName", "Temp License")
      .field("type", "License")
      .attach("file", fakePdf, { filename: "license.pdf", contentType: "application/pdf" });

    const deleteRes = await authed(
      request(app).delete(`/api/employees/${employeeId}/documents/${created.body.id}`)
    );
    expect(deleteRes.status).toBe(204);

    const getRes = await authed(
      request(app).get(`/api/employees/${employeeId}/documents/${created.body.id}`)
    );
    expect(getRes.status).toBe(404);
  });

  it("404s for documents scoped to a different employee", async () => {
    const otherEmployee = await authed(request(app).post("/api/employees")).send({
      firstName: "Other",
      lastName: "Person",
      email: "other.person@example.com",
      joiningDate: "2026-01-15",
      role: "Staff",
      password: "SuperSecret123!",
    });
    const doc = await authed(request(app).post(`/api/employees/${employeeId}/documents`))
      .field("documentName", "Scoped Doc")
      .field("type", "Certification")
      .attach("file", fakePdf, { filename: "scoped.pdf", contentType: "application/pdf" });

    const res = await authed(
      request(app).get(`/api/employees/${otherEmployee.body.id}/documents/${doc.body.id}`)
    );
    expect(res.status).toBe(404);
  });

  it("blocks non-Admin/HR roles from creating documents", async () => {
    await authed(request(app).post("/api/employees")).send({
      firstName: "Plain",
      lastName: "Staffer",
      email: "plain.staffer.docs@example.com",
      joiningDate: "2026-01-01",
      role: "Staff",
      password: "SuperSecret123!",
    });
    const staffToken = (
      await request(app)
        .post("/api/auth/login")
        .set(TENANT_HEADER, tenant.slug)
        .send({ email: "plain.staffer.docs@example.com", password: "SuperSecret123!" })
    ).body.accessToken;

    const res = await request(app)
      .post(`/api/employees/${employeeId}/documents`)
      .set(TENANT_HEADER, tenant.slug)
      .set("Authorization", `Bearer ${staffToken}`)
      .field("documentName", "Blocked Doc")
      .field("type", "Certification")
      .attach("file", fakePdf, { filename: "blocked.pdf", contentType: "application/pdf" });

    expect(res.status).toBe(403);
  });
});
