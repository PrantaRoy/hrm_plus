import request from "supertest";
import { TENANT_HEADER } from "@hrm-plus/shared";
import { createApp } from "../app";
import { controlClient } from "../db/controlClient";
import { disconnectAllTenantClients, getTenantClient } from "../db/tenantClientPool";
import { loginAsAdmin, setupTestTenant, teardownTestTenant, TestTenant } from "./testUtils";

const app = createApp();
let tenant: TestTenant;
let adminToken: string;

const todayStr = new Date().toISOString().slice(0, 10);

beforeAll(async () => {
  tenant = await setupTestTenant("attqr");
  adminToken = await loginAsAdmin(app, tenant);
}, 30000);

afterAll(async () => {
  await teardownTestTenant(tenant);
  await disconnectAllTenantClients();
  await controlClient.$disconnect();
});

function asAdmin(req: request.Test) {
  return req.set(TENANT_HEADER, tenant.slug).set("Authorization", `Bearer ${adminToken}`);
}

function asUser(req: request.Test, token: string) {
  return req.set(TENANT_HEADER, tenant.slug).set("Authorization", `Bearer ${token}`);
}

async function createStaff(email: string, departmentId: number) {
  const res = await asAdmin(request(app).post("/api/employees")).send({
    firstName: "Staff",
    lastName: email.split("@")[0],
    email,
    joiningDate: "2026-01-01",
    departmentId,
    role: "Staff",
    password: "SuperSecret123!",
  });
  expect(res.status).toBe(201);

  const loginRes = await request(app)
    .post("/api/auth/login")
    .set(TENANT_HEADER, tenant.slug)
    .send({ email, password: "SuperSecret123!" });
  expect(loginRes.status).toBe(200);

  return { employeeId: res.body.id as number, token: loginRes.body.accessToken as string };
}

async function setupEmployeeWithAssignment(email: string, methods: string[] = ["QrCode"]) {
  const department = await asAdmin(request(app).post("/api/departments")).send({ name: `Dept-${email}` });
  const departmentId = department.body.id;
  const staff = await createStaff(email, departmentId);

  const dutySchedule = await asAdmin(request(app).post("/api/duty-schedules")).send({
    name: "Round the clock",
    startTime: "00:00",
    endTime: "23:59",
    checkinConsiderMinutes: 0,
    checkoutConsiderMinutes: 0,
    earlyCheckinBufferMinutes: 0,
  });

  const roster = await asAdmin(request(app).post("/api/rosters")).send({
    departmentId,
    periodType: "Weekly",
    startDate: todayStr,
    endDate: todayStr,
  });
  await asAdmin(request(app).post(`/api/rosters/${roster.body.id}/assignments`)).send({
    employeeId: staff.employeeId,
    dutyScheduleId: dutySchedule.body.id,
    date: todayStr,
  });

  await asAdmin(request(app).put(`/api/attendance/employees/${staff.employeeId}/methods`)).send({ methods });

  return staff;
}

async function enableQrTenantWide() {
  const res = await asAdmin(request(app).patch("/api/attendance/settings")).send({ qrCodeEnabled: true });
  expect(res.status).toBe(200);
  expect(res.body.qrCodeEnabled).toBe(true);
}

async function createKioskSessionAndToken() {
  const session = await asAdmin(request(app).post("/api/attendance/qr/kiosk-sessions")).send({ label: "Lobby" });
  expect(session.status).toBe(200);

  const tokenRes = await asAdmin(request(app).get(`/api/attendance/qr/kiosk-sessions/${session.body.id}/token`));
  expect(tokenRes.status).toBe(200);
  expect(tokenRes.body.qrImageDataUri).toMatch(/^data:image\/png;base64,/);

  return { sessionId: session.body.id as number, token: tokenRes.body.token as string };
}

describe("QR attendance settings and per-employee gating", () => {
  it("blocks assigning QrCode to an employee until it's enabled tenant-wide", async () => {
    await asAdmin(request(app).patch("/api/attendance/settings")).send({ qrCodeEnabled: false });

    const department = await asAdmin(request(app).post("/api/departments")).send({ name: "Dept-qr-gate" });
    const staff = await createStaff("attendance.qr.gate@example.com", department.body.id);

    const blocked = await asAdmin(request(app).put(`/api/attendance/employees/${staff.employeeId}/methods`)).send({
      methods: ["QrCode"],
    });
    expect(blocked.status).toBe(400);

    await enableQrTenantWide();

    const allowed = await asAdmin(request(app).put(`/api/attendance/employees/${staff.employeeId}/methods`)).send({
      methods: ["QrCode"],
    });
    expect(allowed.status).toBe(200);
    expect(allowed.body.methods).toEqual(["QrCode"]);
  });

  it("rejects a non-Admin/HR role from changing tenant settings", async () => {
    const department = await asAdmin(request(app).post("/api/departments")).send({ name: "Dept-qr-role" });
    const staff = await createStaff("attendance.qr.role@example.com", department.body.id);

    const res = await asUser(request(app).patch("/api/attendance/settings"), staff.token).send({
      qrCodeEnabled: true,
    });
    expect(res.status).toBe(403);
  });
});

describe("QR kiosk session + token", () => {
  beforeAll(enableQrTenantWide);

  it("creates a kiosk session and returns a rotating token with a QR image", async () => {
    const { token } = await createKioskSessionAndToken();
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(2);
  });
});

describe("QR printable static code", () => {
  beforeAll(enableQrTenantWide);

  it("generates a static QR that keeps working across repeated check-ins/check-outs", async () => {
    const session = await asAdmin(request(app).post("/api/attendance/qr/kiosk-sessions")).send({ label: "Front door" });
    expect(session.status).toBe(200);

    const staticRes = await asAdmin(
      request(app).get(`/api/attendance/qr/kiosk-sessions/${session.body.id}/static-token`)
    );
    expect(staticRes.status).toBe(200);
    expect(staticRes.body.qrImageDataUri).toMatch(/^data:image\/png;base64,/);
    const staticToken = staticRes.body.token as string;

    const staff = await setupEmployeeWithAssignment("attendance.qr.static@example.com");
    const checkIn = await asUser(request(app).post("/api/attendance/check-in"), staff.token).send({
      method: "QrCode",
      qrToken: staticToken,
      reason: "late ok",
    });
    expect(checkIn.status).toBe(200);

    // Same static code, a different employee — it must still be valid (no single-use, no expiry).
    const staff2 = await setupEmployeeWithAssignment("attendance.qr.static2@example.com");
    const checkIn2 = await asUser(request(app).post("/api/attendance/check-in"), staff2.token).send({
      method: "QrCode",
      qrToken: staticToken,
      reason: "late ok",
    });
    expect(checkIn2.status).toBe(200);
  });
});

describe("QR check-in / check-out", () => {
  beforeAll(enableQrTenantWide);

  it("checks in and out successfully with a valid QR token", async () => {
    const staff = await setupEmployeeWithAssignment("attendance.qr.happy@example.com");
    const { token: checkInToken } = await createKioskSessionAndToken();

    const checkIn = await asUser(request(app).post("/api/attendance/check-in"), staff.token).send({
      method: "QrCode",
      qrToken: checkInToken,
      reason: "late ok",
    });
    expect(checkIn.status).toBe(200);
    expect(checkIn.body.attendance.checkInMethod).toBe("QrCode");

    const { token: checkOutToken } = await createKioskSessionAndToken();
    const checkOut = await asUser(request(app).post("/api/attendance/check-out"), staff.token).send({
      method: "QrCode",
      qrToken: checkOutToken,
      reason: "early ok",
    });
    expect(checkOut.status).toBe(200);
    expect(checkOut.body.attendance.checkOutMethod).toBe("QrCode");
  });

  it("rejects reusing the same QR token twice", async () => {
    const staff = await setupEmployeeWithAssignment("attendance.qr.replay@example.com");
    const { token } = await createKioskSessionAndToken();

    const first = await asUser(request(app).post("/api/attendance/check-in"), staff.token).send({
      method: "QrCode",
      qrToken: token,
      reason: "late ok",
    });
    expect(first.status).toBe(200);

    const staff2 = await setupEmployeeWithAssignment("attendance.qr.replay2@example.com");
    const replay = await asUser(request(app).post("/api/attendance/check-in"), staff2.token).send({
      method: "QrCode",
      qrToken: token,
    });
    expect(replay.status).toBe(403);
  });

  it("rejects an expired QR token", async () => {
    const staff = await setupEmployeeWithAssignment("attendance.qr.expired@example.com");
    const { sessionId, token } = await createKioskSessionAndToken();

    const tenantClient = getTenantClient(tenant.databaseName);
    const jti = Buffer.from(token.split(".")[0], "base64url").toString("utf8");
    const parsed = JSON.parse(jti);
    await tenantClient.attendanceQrToken.updateMany({
      where: { sessionId, jti: parsed.jti },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const res = await asUser(request(app).post("/api/attendance/check-in"), staff.token).send({
      method: "QrCode",
      qrToken: token,
    });
    expect(res.status).toBe(403);
  });

  it("rejects a tampered QR token", async () => {
    const staff = await setupEmployeeWithAssignment("attendance.qr.tampered@example.com");
    const { token } = await createKioskSessionAndToken();
    const tampered = `${token.slice(0, -1)}${token.slice(-1) === "a" ? "b" : "a"}`;

    const res = await asUser(request(app).post("/api/attendance/check-in"), staff.token).send({
      method: "QrCode",
      qrToken: tampered,
    });
    expect(res.status).toBe(403);
  });

  it("rejects check-in when the employee doesn't have QrCode granted, even with a valid token", async () => {
    const staff = await setupEmployeeWithAssignment("attendance.qr.notgranted@example.com", []);
    const { token } = await createKioskSessionAndToken();

    const res = await asUser(request(app).post("/api/attendance/check-in"), staff.token).send({
      method: "QrCode",
      qrToken: token,
    });
    expect(res.status).toBe(403);
  });
});
