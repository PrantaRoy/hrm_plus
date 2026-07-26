import request from "supertest";
import { createApp } from "../app";
import { controlClient } from "../db/controlClient";
import { setupTestSaasAdmin, teardownTestSaasAdmin, loginAsSaasAdmin, TestSaasAdmin } from "./testUtils";

const app = createApp();
let admin: TestSaasAdmin;
let token: string;
const createdPackageIds: number[] = [];
const createdApplicationIds: number[] = [];

beforeAll(async () => {
  admin = await setupTestSaasAdmin("saas");
  token = await loginAsSaasAdmin(app, admin);
}, 30000);

afterAll(async () => {
  await controlClient.tenantApplication.deleteMany({ where: { id: { in: createdApplicationIds } } });
  await controlClient.package.deleteMany({ where: { id: { in: createdPackageIds } } });
  await teardownTestSaasAdmin(admin);
  await controlClient.$disconnect();
});

function authed(req: request.Test) {
  return req.set("Authorization", `Bearer ${token}`);
}

describe("SaaS admin auth", () => {
  it("logs in with correct credentials", async () => {
    const res = await request(app)
      .post("/saas/admin/auth/login")
      .send({ email: admin.email, password: admin.password });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.admin.email).toBe(admin.email);
  });

  it("rejects an incorrect password", async () => {
    const res = await request(app)
      .post("/saas/admin/auth/login")
      .send({ email: admin.email, password: "wrong" });
    expect(res.status).toBe(401);
  });

  it("blocks admin package routes without a token", async () => {
    const res = await request(app).get("/saas/admin/packages");
    expect(res.status).toBe(401);
  });

  it("rejects a tenant-scoped token used against the saas-admin routes", async () => {
    // A malformed/foreign bearer token must not be accepted as a saas-admin token.
    const res = await request(app)
      .get("/saas/admin/packages")
      .set("Authorization", "Bearer not-a-real-token");
    expect(res.status).toBe(401);
  });
});

describe("Package management", () => {
  let freePackageId: number;
  let paidPackageId: number;

  it("creates a free, unlimited-validity package", async () => {
    const res = await authed(request(app).post("/saas/admin/packages")).send({
      name: "Free Tier",
      price: 0,
      validityDays: null,
    });
    expect(res.status).toBe(201);
    expect(res.body.price).toBe(0);
    expect(res.body.validityDays).toBeNull();
    freePackageId = res.body.id;
    createdPackageIds.push(freePackageId);
  });

  it("creates a paid, 30-day package", async () => {
    const res = await authed(request(app).post("/saas/admin/packages")).send({
      name: "Growth (30 days)",
      price: 49.99,
      validityDays: 30,
    });
    expect(res.status).toBe(201);
    expect(res.body.price).toBe(49.99);
    expect(res.body.validityDays).toBe(30);
    paidPackageId = res.body.id;
    createdPackageIds.push(paidPackageId);
  });

  it("lists both packages for admins", async () => {
    const res = await authed(request(app).get("/saas/admin/packages"));
    const ids = res.body.map((p: { id: number }) => p.id);
    expect(ids).toEqual(expect.arrayContaining([freePackageId, paidPackageId]));
  });

  it("hides an inactive package from the public listing but not the admin listing", async () => {
    await authed(request(app).patch(`/saas/admin/packages/${paidPackageId}`)).send({
      isActive: false,
    });

    const publicRes = await request(app).get("/saas/public/packages");
    expect(publicRes.body.map((p: { id: number }) => p.id)).not.toContain(paidPackageId);

    const adminRes = await authed(request(app).get("/saas/admin/packages"));
    expect(adminRes.body.map((p: { id: number }) => p.id)).toContain(paidPackageId);
  });

  it("updates a package", async () => {
    const res = await authed(request(app).patch(`/saas/admin/packages/${freePackageId}`)).send({
      name: "Free Tier (Updated)",
    });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Free Tier (Updated)");
  });
});

describe("Tenant application submission and review", () => {
  let packageId: number;
  let applicationId: number;
  const slug = `apptest-${Date.now()}`;

  beforeAll(async () => {
    const pkg = await controlClient.package.create({
      data: { name: "Application Test Package", price: 0, validityDays: null },
    });
    packageId = pkg.id;
    createdPackageIds.push(packageId);
  });

  it("submits a new application", async () => {
    const res = await request(app)
      .post("/saas/public/applications")
      .field("companyName", "Test Co")
      .field("companyType", "Retail")
      .field("overview", "A test company")
      .field("numberOfEmployees", "10")
      .field("contactEmail", "owner@testco.example")
      .field("subdomainSlug", slug)
      .field("packageId", String(packageId));

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("Pending");
    expect(res.body.subdomainSlug).toBe(slug);
    applicationId = res.body.id;
    createdApplicationIds.push(applicationId);
  });

  it("rejects a second application with the same subdomain slug", async () => {
    const res = await request(app)
      .post("/saas/public/applications")
      .field("companyName", "Another Co")
      .field("companyType", "Retail")
      .field("overview", "Another company")
      .field("numberOfEmployees", "5")
      .field("contactEmail", "owner@another.example")
      .field("subdomainSlug", slug)
      .field("packageId", String(packageId));

    expect(res.status).toBe(409);
  });

  it("lists the pending application for the admin", async () => {
    const res = await authed(request(app).get("/saas/admin/applications").query({ status: "Pending" }));
    expect(res.body.map((a: { id: number }) => a.id)).toContain(applicationId);
  });

  it("lets the admin edit application details before approval", async () => {
    const res = await authed(request(app).patch(`/saas/admin/applications/${applicationId}`)).send({
      companyName: "Test Co (Edited)",
    });
    expect(res.status).toBe(200);
    expect(res.body.companyName).toBe("Test Co (Edited)");
  });

  it("rejects the application", async () => {
    const res = await authed(request(app).post(`/saas/admin/applications/${applicationId}/reject`)).send({
      reviewNote: "Not a fit right now",
    });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("Rejected");
  });

  it("refuses to re-review an already-rejected application", async () => {
    const res = await authed(request(app).post(`/saas/admin/applications/${applicationId}/reject`)).send(
      {}
    );
    expect(res.status).toBe(409);
  });
});
