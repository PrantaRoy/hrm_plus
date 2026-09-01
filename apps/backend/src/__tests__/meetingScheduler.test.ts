import request from "supertest";
import { TENANT_HEADER } from "@hrm-plus/shared";
import { createApp } from "../app";
import { controlClient } from "../db/controlClient";
import { disconnectAllTenantClients, getTenantClient } from "../db/tenantClientPool";
import { PrismaClient } from "../../generated/tenant";
import { loginAsAdmin, setupTestTenant, teardownTestTenant, TestTenant } from "./testUtils";

const app = createApp();
let tenant: TestTenant;
let adminToken: string;
let tc: PrismaClient;
let adminUserId: number;

// A fixed future week so the dates never collide with "today".
const D_OK = "2026-10-05";
const D_APPROVED = "2026-10-06";
const D_PENDING = "2026-10-07";
const D_OUTSIDE = "2026-10-08";
const D_OVERLAP = "2026-10-09";
const WEEK_END = "2026-10-11";

let departmentId: number;
let dutyScheduleId: number;
let rosterId: number;
let organizerToken: string;
let organizerEmployeeId: number;
let participantEmployeeId: number;

function asAdmin(req: request.Test) {
  return req.set(TENANT_HEADER, tenant.slug).set("Authorization", `Bearer ${adminToken}`);
}
function asUser(req: request.Test, token: string) {
  return req.set(TENANT_HEADER, tenant.slug).set("Authorization", `Bearer ${token}`);
}

async function createStaff(email: string) {
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
  const login = await request(app)
    .post("/api/auth/login")
    .set(TENANT_HEADER, tenant.slug)
    .send({ email, password: "SuperSecret123!" });
  expect(login.status).toBe(200);
  return { employeeId: res.body.id as number, token: login.body.accessToken as string };
}

async function addLeave(employeeId: number, date: string, status: "Approved" | "Pending") {
  const leaveType = await tc.leaveType.create({
    data: { name: `LT-${Math.random().toString(36).slice(2)}`, assignedDays: 20 },
  });
  const allocation = await tc.employeeLeaveAllocation.create({
    data: { employeeId, leaveTypeId: leaveType.id, year: 2026, allocatedDays: 20, createdById: adminUserId },
  });
  await tc.leaveRequest.create({
    data: {
      employeeId,
      allocationId: allocation.id,
      startDate: new Date(`${date}T00:00:00.000Z`),
      endDate: new Date(`${date}T00:00:00.000Z`),
      daysRequested: 1,
      status,
      createdById: adminUserId,
    },
  });
}

async function scheduleMeeting(body: Record<string, unknown>) {
  return asUser(request(app).post("/api/meetings"), organizerToken).send(body);
}

beforeAll(async () => {
  tenant = await setupTestTenant("meetings");
  adminToken = await loginAsAdmin(app, tenant);
  tc = getTenantClient(tenant.databaseName);
  adminUserId = (await tc.user.findFirstOrThrow({ where: { email: tenant.adminEmail } })).id;

  departmentId = (await asAdmin(request(app).post("/api/departments")).send({ name: "Meetings Dept" })).body.id;

  const organizer = await createStaff("meeting.organizer@example.com");
  organizerToken = organizer.token;
  organizerEmployeeId = organizer.employeeId;
  const participant = await createStaff("meeting.participant@example.com");
  participantEmployeeId = participant.employeeId;

  dutyScheduleId = (
    await asAdmin(request(app).post("/api/duty-schedules")).send({
      name: "Day shift",
      startTime: "09:00",
      endTime: "17:00",
    })
  ).body.id;

  rosterId = (
    await asAdmin(request(app).post("/api/rosters")).send({
      departmentId,
      periodType: "Weekly",
      startDate: D_OK,
      endDate: WEEK_END,
    })
  ).body.id;

  for (const employeeId of [organizerEmployeeId, participantEmployeeId]) {
    for (const date of [D_OK, D_APPROVED, D_PENDING, D_OUTSIDE, D_OVERLAP]) {
      const res = await asAdmin(request(app).post(`/api/rosters/${rosterId}/assignments`)).send({
        employeeId,
        dutyScheduleId,
        date,
      });
      expect(res.status).toBe(201);
    }
  }

  expect((await asAdmin(request(app).post(`/api/rosters/${rosterId}/approve`))).status).toBe(200);
}, 60000);

afterAll(async () => {
  await teardownTestTenant(tenant);
  await disconnectAllTenantClients();
  await controlClient.$disconnect();
});

describe("Meeting & Appointment Scheduler", () => {
  it("check-availability reports a clear slot with no conflicts", async () => {
    const res = await asUser(request(app).post("/api/meetings/check-availability"), organizerToken).send({
      date: D_OK,
      startTime: "10:00",
      endTime: "11:00",
      participants: [{ employeeId: participantEmployeeId }],
    });
    expect(res.status).toBe(200);
    expect(res.body.canConfirm).toBe(true);
    expect(res.body.hasWarnings).toBe(false);
    expect(res.body.conflicts).toEqual([]);
  });

  it("creates and confirms a meeting when everyone is available", async () => {
    const create = await scheduleMeeting({
      title: "Sprint planning",
      date: D_OK,
      startTime: "10:00",
      endTime: "11:00",
      participants: [{ employeeId: participantEmployeeId }],
    });
    expect(create.status).toBe(201);
    expect(create.body.status).toBe("Draft");

    const confirm = await asUser(
      request(app).post(`/api/meetings/${create.body.id}/confirm`),
      organizerToken
    ).send({});
    expect(confirm.status).toBe(200);
    expect(confirm.body.status).toBe("Confirmed");
  });

  it("hard-blocks confirmation when a required participant is on approved leave", async () => {
    await addLeave(participantEmployeeId, D_APPROVED, "Approved");

    const create = await scheduleMeeting({
      title: "Design review",
      date: D_APPROVED,
      startTime: "10:00",
      endTime: "11:00",
      participants: [{ employeeId: participantEmployeeId }],
    });
    expect(create.status).toBe(201);

    const confirm = await asUser(
      request(app).post(`/api/meetings/${create.body.id}/confirm`),
      organizerToken
    ).send({ acknowledgeWarnings: true });
    expect(confirm.status).toBe(409);
    expect(confirm.body.error.code).toBe("MEETING_CONFLICT");
    const conflict = confirm.body.error.details.conflicts.find(
      (c: { type: string }) => c.type === "APPROVED_LEAVE"
    );
    expect(conflict.severity).toBe("BLOCK");
    expect(conflict.employeeId).toBe(participantEmployeeId);
    expect(conflict.message).toContain("Staff");
  });

  it("warns (but does not block) on pending leave until acknowledged", async () => {
    await addLeave(participantEmployeeId, D_PENDING, "Pending");

    const create = await scheduleMeeting({
      title: "1:1",
      date: D_PENDING,
      startTime: "10:00",
      endTime: "11:00",
      participants: [{ employeeId: participantEmployeeId }],
    });
    const meetingId = create.body.id;

    const noAck = await asUser(request(app).post(`/api/meetings/${meetingId}/confirm`), organizerToken).send({});
    expect(noAck.status).toBe(400);
    expect(noAck.body.error.code).toBe("MEETING_WARNINGS_UNACKNOWLEDGED");

    const withAck = await asUser(request(app).post(`/api/meetings/${meetingId}/confirm`), organizerToken).send({
      acknowledgeWarnings: true,
    });
    expect(withAck.status).toBe(200);
    expect(withAck.body.status).toBe("Confirmed");
    expect(withAck.body.warningsAcknowledged).toBe(true);
  });

  it("warns when the meeting falls outside a participant's shift hours", async () => {
    const res = await asUser(request(app).post("/api/meetings/check-availability"), organizerToken).send({
      date: D_OUTSIDE,
      startTime: "18:00",
      endTime: "19:00",
      participants: [{ employeeId: participantEmployeeId }],
    });
    expect(res.status).toBe(200);
    expect(res.body.canConfirm).toBe(true);
    const outside = res.body.conflicts.find((c: { type: string }) => c.type === "OUTSIDE_SHIFT");
    expect(outside.severity).toBe("WARNING");
  });

  it("flags an overlapping confirmed meeting, and blocks it once the setting is enabled", async () => {
    const first = await scheduleMeeting({
      title: "Standup",
      date: D_OVERLAP,
      startTime: "10:00",
      endTime: "11:00",
      participants: [{ employeeId: participantEmployeeId }],
      confirmNow: true,
    });
    expect(first.status).toBe(201);
    expect(first.body.status).toBe("Confirmed");

    const check = await asUser(request(app).post("/api/meetings/check-availability"), organizerToken).send({
      date: D_OVERLAP,
      startTime: "10:30",
      endTime: "11:30",
      participants: [{ employeeId: participantEmployeeId }],
    });
    expect(check.body.conflicts.some((c: { type: string }) => c.type === "MEETING_OVERLAP")).toBe(true);
    expect(check.body.canConfirm).toBe(true);

    const patch = await asAdmin(request(app).patch("/api/scheduler-settings")).send({
      blockOnMeetingOverlap: true,
    });
    expect(patch.status).toBe(200);
    expect(patch.body.blockOnMeetingOverlap).toBe(true);

    const check2 = await asUser(request(app).post("/api/meetings/check-availability"), organizerToken).send({
      date: D_OVERLAP,
      startTime: "10:30",
      endTime: "11:30",
      participants: [{ employeeId: participantEmployeeId }],
    });
    expect(check2.body.canConfirm).toBe(false);

    await asAdmin(request(app).patch("/api/scheduler-settings")).send({ blockOnMeetingOverlap: false });
  });

  it("makes pending leave a hard block when the setting is enabled", async () => {
    await asAdmin(request(app).patch("/api/scheduler-settings")).send({ blockOnPendingLeave: true });

    const check = await asUser(request(app).post("/api/meetings/check-availability"), organizerToken).send({
      date: D_PENDING,
      startTime: "13:00",
      endTime: "14:00",
      participants: [{ employeeId: participantEmployeeId }],
    });
    expect(check.body.canConfirm).toBe(false);
    expect(
      check.body.conflicts.find((c: { type: string }) => c.type === "PENDING_LEAVE").severity
    ).toBe("BLOCK");

    await asAdmin(request(app).patch("/api/scheduler-settings")).send({ blockOnPendingLeave: false });
  });

  it("records a participant RSVP and lists it under my meetings", async () => {
    const create = await scheduleMeeting({
      title: "Retro",
      date: D_OK,
      startTime: "14:00",
      endTime: "15:00",
      participants: [{ employeeId: participantEmployeeId }],
    });
    const meetingId = create.body.id;

    const participantToken = (
      await request(app)
        .post("/api/auth/login")
        .set(TENANT_HEADER, tenant.slug)
        .send({ email: "meeting.participant@example.com", password: "SuperSecret123!" })
    ).body.accessToken;

    const rsvp = await asUser(request(app).post(`/api/meetings/${meetingId}/respond`), participantToken).send({
      response: "Declined",
    });
    expect(rsvp.status).toBe(200);
    const me = rsvp.body.participants.find(
      (p: { employeeId: number }) => p.employeeId === participantEmployeeId
    );
    expect(me.responseStatus).toBe("Declined");

    const myList = await asUser(request(app).get("/api/meetings/my"), participantToken);
    expect(myList.status).toBe(200);
    const listed = myList.body.find((m: { id: number }) => m.id === meetingId);
    expect(listed.myResponseStatus).toBe("Declined");
    expect(listed.isOrganizer).toBe(false);
  });
});
