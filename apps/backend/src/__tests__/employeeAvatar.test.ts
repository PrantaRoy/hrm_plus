import fs from "node:fs";
import path from "node:path";
import request from "supertest";
import { TENANT_HEADER } from "@hrm-plus/shared";
import { createApp } from "../app";
import { controlClient } from "../db/controlClient";
import { disconnectAllTenantClients } from "../db/tenantClientPool";
import { LOCAL_UPLOAD_ROOT } from "../storage";
import { loginAsAdmin, setupTestTenant, teardownTestTenant, TestTenant } from "./testUtils";

const app = createApp();
let tenant: TestTenant;
let token: string;
let employeeId: number;

const fakeImage = Buffer.from("fake-png-bytes");

beforeAll(async () => {
  tenant = await setupTestTenant("avatar");
  token = await loginAsAdmin(app, tenant);

  const created = await authed(request(app).post("/api/employees")).send({
    firstName: "Ava",
    lastName: "Tar",
    email: "ava.tar@example.com",
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

describe("Employee avatar upload", () => {
  it("uploads an avatar and stores the file locally", async () => {
    const res = await authed(request(app).post(`/api/employees/${employeeId}/avatar`)).attach(
      "avatar",
      fakeImage,
      { filename: "photo.png", contentType: "image/png" }
    );

    expect(res.status).toBe(200);
    expect(res.body.avatarUrl).toMatch(/^\/uploads\/avatars\/.+\.png$/);

    const filePath = path.join(LOCAL_UPLOAD_ROOT, res.body.avatarUrl.replace("/uploads/", ""));
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it("replaces the previous avatar file when uploaded again", async () => {
    const first = await authed(request(app).post(`/api/employees/${employeeId}/avatar`)).attach(
      "avatar",
      fakeImage,
      { filename: "first.png", contentType: "image/png" }
    );
    const firstPath = path.join(LOCAL_UPLOAD_ROOT, first.body.avatarUrl.replace("/uploads/", ""));

    const second = await authed(request(app).post(`/api/employees/${employeeId}/avatar`)).attach(
      "avatar",
      fakeImage,
      { filename: "second.png", contentType: "image/png" }
    );

    expect(second.status).toBe(200);
    expect(second.body.avatarUrl).not.toBe(first.body.avatarUrl);
    expect(fs.existsSync(firstPath)).toBe(false);
  });

  it("rejects an unsupported file type", async () => {
    const res = await authed(request(app).post(`/api/employees/${employeeId}/avatar`)).attach(
      "avatar",
      Buffer.from("not an image"),
      { filename: "notes.txt", contentType: "text/plain" }
    );
    expect(res.status).toBe(500);
  });

  it("404s for a non-existent employee", async () => {
    const res = await authed(request(app).post("/api/employees/999999/avatar")).attach(
      "avatar",
      fakeImage,
      { filename: "photo.png", contentType: "image/png" }
    );
    expect(res.status).toBe(404);
  });
});
