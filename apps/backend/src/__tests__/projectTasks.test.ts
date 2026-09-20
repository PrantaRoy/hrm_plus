import request from "supertest";
import { TENANT_HEADER } from "@hrm-plus/shared";
import { createApp } from "../app";
import { controlClient } from "../db/controlClient";
import { disconnectAllTenantClients, getTenantClient } from "../db/tenantClientPool";
import { PrismaClient } from "../../generated/tenant";
import { createTaskWithNumber } from "../modules/tasks/taskNumber.service";
import { runRecurringTaskGenerationForTenant } from "../modules/tasks/recurringTask.processor";
import { loginAsAdmin, setupTestTenant, teardownTestTenant, TestTenant } from "./testUtils";

const app = createApp();
let tenant: TestTenant;
let adminToken: string;
let tc: PrismaClient;
let adminUserId: number;
let adminEmployeeId: number;

let memberToken: string;
let memberEmployeeId: number;
let outsiderToken: string;
let outsiderEmployeeId: number;

let projectId: number; // code "hrm"
let projectCode: string;

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function as(req: request.Test, token: string) {
  return req.set(TENANT_HEADER, tenant.slug).set("Authorization", `Bearer ${token}`);
}
const asAdmin = (req: request.Test) => as(req, adminToken);

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
  const login = await request(app)
    .post("/api/auth/login")
    .set(TENANT_HEADER, tenant.slug)
    .send({ email, password: "SuperSecret123!" });
  expect(login.status).toBe(200);
  return { employeeId: res.body.id as number, token: login.body.accessToken as string };
}

function projectBody(overrides: Record<string, unknown> = {}) {
  return {
    title: "HRM Plus",
    contractType: "fixed",
    totalAmount: 12000.5,
    estimatedHours: 240,
    deadlineType: "casual",
    startDate: "2026-10-01",
    supervisorId: adminEmployeeId,
    priority: "high",
    ...overrides,
  };
}

function taskBody(overrides: Record<string, unknown> = {}) {
  return {
    projectId,
    title: "Build login page",
    priority: "medium",
    timeType: "flexible",
    ...overrides,
  };
}

async function createTask(overrides: Record<string, unknown> = {}, token = adminToken) {
  const res = await as(request(app).post("/api/tasks"), token).send(taskBody(overrides));
  expect(res.status).toBe(201);
  return res.body as { id: number; taskNumber: string; checklists: { id: number }[] };
}

/** A recurring parent inserted directly, already due, so the job can be driven with a fixed `now`. */
async function makeRecurringParent(opts: {
  now: Date;
  totalCycles: number;
  dueOffsetMs?: number;
  nextRecurrenceAt?: Date;
  frequency?: string;
  status?: string;
  projectId?: number;
}) {
  const task = await createTaskWithNumber(tc, {
    projectId: opts.projectId ?? projectId,
    title: "Weekly report",
    priority: "medium",
    status: opts.status ?? "in_progress",
    timeType: "flexible",
    recurrenceFrequency: opts.frequency ?? "daily",
    totalCycles: opts.totalCycles,
    nextRecurrenceAt: opts.nextRecurrenceAt ?? new Date(opts.now.getTime() - HOUR),
    supervisorId: adminEmployeeId,
    description: "recurring",
    progressPercentage: 40,
    dueDate: opts.dueOffsetMs != null ? new Date(Date.now() + opts.dueOffsetMs) : null,
    createdById: adminUserId,
  });
  return task;
}

beforeAll(async () => {
  tenant = await setupTestTenant("projects");
  adminToken = await loginAsAdmin(app, tenant);
  tc = getTenantClient(tenant.databaseName);
  const adminUser = await tc.user.findFirstOrThrow({
    where: { email: tenant.adminEmail },
    include: { employee: true },
  });
  adminUserId = adminUser.id;
  adminEmployeeId = adminUser.employee!.id;

  const departmentId = (await asAdmin(request(app).post("/api/departments")).send({ name: "Projects Dept" })).body.id;
  const member = await createStaff("project.member@example.com", departmentId);
  memberToken = member.token;
  memberEmployeeId = member.employeeId;
  const outsider = await createStaff("project.outsider@example.com", departmentId);
  outsiderToken = outsider.token;
  outsiderEmployeeId = outsider.employeeId;

  const created = await asAdmin(request(app).post("/api/projects")).send(projectBody());
  expect(created.status).toBe(201);
  projectId = created.body.id;
  projectCode = created.body.code;
}, 90000);

afterAll(async () => {
  await teardownTestTenant(tenant);
  await disconnectAllTenantClients();
  await controlClient.$disconnect();
});

describe("clients", () => {
  let clientId: number;

  it("is restricted to managers", async () => {
    const res = await as(request(app).get("/api/clients"), memberToken);
    expect(res.status).toBe(403);
  });

  it("creates, lists, updates and validates", async () => {
    const created = await asAdmin(request(app).post("/api/clients")).send({
      name: "Acme Ltd",
      email: "Contact@Acme.test",
      address: "1 Queen St, Auckland",
      tag: "enterprise",
      priority: "high",
    });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ email: "contact@acme.test", isActive: true, companyName: null, projectCount: 0 });
    clientId = created.body.id;

    const bad = await asAdmin(request(app).post("/api/clients")).send({ name: "x", email: "nope" });
    expect(bad.status).toBe(400);
    expect(bad.body.error.code).toBe("VALIDATION_ERROR");

    const list = await asAdmin(request(app).get("/api/clients?search=acme&isActive=true"));
    expect(list.status).toBe(200);
    expect(list.body.total).toBe(1);

    const updated = await asAdmin(request(app).patch(`/api/clients/${clientId}`)).send({ isActive: false, phoneNumber: "021 555" });
    expect(updated.body).toMatchObject({ isActive: false, phoneNumber: "021 555" });
  });

  it("refuses to delete a client that has projects", async () => {
    const p = await asAdmin(request(app).post("/api/projects")).send(projectBody({ title: "Acme Portal", clientId }));
    expect(p.status).toBe(201);
    expect(p.body.clientName).toBe("Acme Ltd");

    const del = await asAdmin(request(app).delete(`/api/clients/${clientId}`));
    expect(del.status).toBe(409);
    expect(del.body.error.code).toBe("CLIENT_HAS_PROJECTS");
  });
});

describe("projects", () => {
  it("derives a code from the title and de-duplicates it", async () => {
    expect(projectCode).toBe("hrm");
    const second = await asAdmin(request(app).post("/api/projects")).send(projectBody({ title: "HRM Mobile" }));
    expect(second.body.code).toBe("hrm2");
  });

  it("supports internal projects, explicit codes and rejects duplicate codes", async () => {
    const internal = await asAdmin(request(app).post("/api/projects")).send(projectBody({ title: "Office move", code: "ofc" }));
    expect(internal.status).toBe(201);
    expect(internal.body).toMatchObject({ clientId: null, clientName: null, code: "ofc", totalAmount: 12000.5, tags: [] });

    const dup = await asAdmin(request(app).post("/api/projects")).send(projectBody({ title: "Other", code: "ofc" }));
    expect(dup.status).toBe(409);
  });

  it("validates deadline rules", async () => {
    const noEnd = await asAdmin(request(app).post("/api/projects")).send(projectBody({ title: "Fixed one", deadlineType: "fixed" }));
    expect(noEnd.status).toBe(400);
    expect(noEnd.body.error.code).toBe("TARGET_END_DATE_REQUIRED");

    const backwards = await asAdmin(request(app).post("/api/projects")).send(
      projectBody({ title: "Backwards", targetEndDate: "2026-09-01" })
    );
    expect(backwards.status).toBe(400);
    expect(backwards.body.error.code).toBe("INVALID_DATE_RANGE");
  });

  it("only managers can create; other roles only see projects they belong to", async () => {
    const forbidden = await as(request(app).post("/api/projects"), memberToken).send(projectBody({ title: "Nope" }));
    expect(forbidden.status).toBe(403);

    const before = await as(request(app).get("/api/projects"), memberToken);
    expect(before.body.total).toBe(0);
    expect((await as(request(app).get(`/api/projects/${projectId}`), memberToken)).status).toBe(404);

    const set = await asAdmin(request(app).put(`/api/projects/${projectId}/members`)).send({ employeeIds: [memberEmployeeId] });
    expect(set.status).toBe(200);
    expect(set.body.members).toEqual([{ id: memberEmployeeId, name: expect.any(String) }]);

    const after = await as(request(app).get("/api/projects"), memberToken);
    expect(after.body.items.map((p: { id: number }) => p.id)).toEqual([projectId]);
    // ...but still cannot edit it.
    expect((await as(request(app).patch(`/api/projects/${projectId}`), memberToken).send({ title: "Hacked" })).status).toBe(403);

    await asAdmin(request(app).put(`/api/projects/${projectId}/members`)).send({ employeeIds: [] });
  });

  it("rejects unknown supervisors", async () => {
    const res = await asAdmin(request(app).post("/api/projects")).send(projectBody({ title: "Ghost", supervisorId: 999999 }));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_EMPLOYEE");
  });
});

describe("task numbers", () => {
  it("issues sequential numbers starting at 101 through the API", async () => {
    const p = await asAdmin(request(app).post("/api/projects")).send(projectBody({ title: "Sequence", code: "seq" }));
    const a = await as(request(app).post("/api/tasks"), adminToken).send(taskBody({ projectId: p.body.id }));
    const b = await as(request(app).post("/api/tasks"), adminToken).send(taskBody({ projectId: p.body.id }));
    expect(a.body.taskNumber).toBe("seq-101");
    expect(b.body.taskNumber).toBe("seq-102");
  });

  it("never issues a duplicate under concurrent creation", async () => {
    const p = await asAdmin(request(app).post("/api/projects")).send(projectBody({ title: "Race", code: "race" }));
    const results = await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        createTaskWithNumber(tc, {
          projectId: p.body.id,
          title: `Race ${i}`,
          priority: "low",
          timeType: "flexible",
          supervisorId: adminEmployeeId,
          description: "",
          createdById: adminUserId,
        })
      )
    );
    const numbers = results.map((t) => t.taskNumber).sort();
    const expected = Array.from({ length: 20 }, (_, i) => `race-${101 + i}`).sort();
    expect(numbers).toEqual(expected);
  }, 60000);

  it("releases the number when the surrounding transaction rolls back", async () => {
    const p = await asAdmin(request(app).post("/api/projects")).send(projectBody({ title: "Rollback", code: "rb" }));
    await expect(
      tc.$transaction(async (tx) => {
        await createTaskWithNumber(tx, {
          projectId: p.body.id,
          title: "doomed",
          priority: "low",
          timeType: "flexible",
          supervisorId: adminEmployeeId,
          description: "",
          createdById: adminUserId,
        });
        throw new Error("boom");
      })
    ).rejects.toThrow("boom");
    const next = await as(request(app).post("/api/tasks"), adminToken).send(taskBody({ projectId: p.body.id }));
    expect(next.body.taskNumber).toBe("rb-101");
  });
});

describe("tasks", () => {
  it("validates recurrence and computes the schedule", async () => {
    const custom = await as(request(app).post("/api/tasks"), adminToken).send(
      taskBody({ recurrenceFrequency: "custom", totalCycles: 3 })
    );
    expect(custom.status).toBe(400);
    expect(custom.body.error.code).toBe("RECURRENCE_INTERVAL_REQUIRED");

    const ok = await as(request(app).post("/api/tasks"), adminToken).send(
      taskBody({ recurrenceFrequency: "weekly", totalCycles: 4 })
    );
    expect(ok.status).toBe(201);
    expect(ok.body.totalCycles).toBe(4);
    const next = new Date(ok.body.nextRecurrenceAt).getTime();
    expect(Math.abs(next - (Date.now() + 7 * DAY))).toBeLessThan(60 * 1000);

    const off = await as(request(app).patch(`/api/tasks/${ok.body.id}`), adminToken).send({ recurrenceFrequency: "none" });
    expect(off.body).toMatchObject({ totalCycles: 0, nextRecurrenceAt: null, recurrenceFrequency: "none" });
  });

  it("defaults the supervisor to the project supervisor and stores members, followers, checklist", async () => {
    const res = await as(request(app).post("/api/tasks"), adminToken).send(
      taskBody({
        memberIds: [memberEmployeeId],
        followerIds: [outsiderEmployeeId],
        checklist: ["Design", "Implement"],
        budgetAmount: 500,
        dueDate: "2026-11-01T09:00:00.000Z",
      })
    );
    expect(res.status).toBe(201);
    expect(res.body.supervisor.id).toBe(adminEmployeeId);
    expect(res.body.members.map((m: { id: number }) => m.id)).toEqual([memberEmployeeId]);
    expect(res.body.followers.map((m: { id: number }) => m.id)).toEqual([outsiderEmployeeId]);
    expect(res.body.checklists.map((c: { title: string }) => c.title)).toEqual(["Design", "Implement"]);
    expect(res.body).toMatchObject({ budgetAmount: 500, status: "to_do", dueDate: "2026-11-01T09:00:00.000Z" });
  });

  it("scopes visibility and lets members change only status/progress", async () => {
    const task = await createTask({ memberIds: [memberEmployeeId] });

    expect((await as(request(app).get(`/api/tasks/${task.id}`), memberToken)).status).toBe(200);
    expect((await as(request(app).get(`/api/tasks/${task.id}`), outsiderToken)).status).toBe(404);
    const outsiderList = await as(request(app).get(`/api/tasks?projectId=${projectId}`), outsiderToken);
    expect(outsiderList.body.items.every((t: { id: number }) => t.id !== task.id)).toBe(true);

    const title = await as(request(app).patch(`/api/tasks/${task.id}`), memberToken).send({ title: "Renamed" });
    expect(title.status).toBe(403);

    const progress = await as(request(app).patch(`/api/tasks/${task.id}`), memberToken).send({ status: "in_progress", progressPercentage: 30 });
    expect(progress.status).toBe(200);
    expect(progress.body).toMatchObject({ status: "in_progress", progressPercentage: 30 });

    const done = await as(request(app).patch(`/api/tasks/${task.id}`), memberToken).send({ status: "completed" });
    expect(done.body.progressPercentage).toBe(100);

    const mine = await as(request(app).get("/api/tasks/my"), memberToken);
    expect(mine.body.items.map((t: { id: number }) => t.id)).toContain(task.id);

    // Only managers/supervisors can create tasks or reassign people.
    expect((await as(request(app).post("/api/tasks"), memberToken).send(taskBody())).status).toBe(403);
    expect((await as(request(app).put(`/api/tasks/${task.id}/members`), memberToken).send({ employeeIds: [] })).status).toBe(403);
  });

  it("recalculates project progress from its tasks", async () => {
    const p = await asAdmin(request(app).post("/api/projects")).send(projectBody({ title: "Progress", code: "prog" }));
    const t1 = await as(request(app).post("/api/tasks"), adminToken).send(taskBody({ projectId: p.body.id }));
    await as(request(app).post("/api/tasks"), adminToken).send(taskBody({ projectId: p.body.id }));
    await asAdmin(request(app).patch(`/api/tasks/${t1.body.id}`)).send({ status: "completed" });
    const project = await asAdmin(request(app).get(`/api/projects/${p.body.id}`));
    expect(project.body.progressPercentage).toBe(50);
  });

  it("does not allow tasks in archived projects", async () => {
    const p = await asAdmin(request(app).post("/api/projects")).send(projectBody({ title: "Old", code: "old" }));
    await asAdmin(request(app).patch(`/api/projects/${p.body.id}`)).send({ status: "archived" });
    const res = await as(request(app).post("/api/tasks"), adminToken).send(taskBody({ projectId: p.body.id }));
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("PROJECT_CLOSED");
  });
});

describe("checklists", () => {
  it("separates member completion from supervisor verification", async () => {
    const task = await createTask({ memberIds: [memberEmployeeId], checklist: ["One", "Two"] });
    const [one, two] = task.checklists;

    const notCompleted = await asAdmin(request(app).post(`/api/tasks/${task.id}/checklists/${one.id}/verify`)).send({});
    expect(notCompleted.status).toBe(409);
    expect(notCompleted.body.error.code).toBe("CHECKLIST_NOT_COMPLETED");

    const completed = await as(request(app).post(`/api/tasks/${task.id}/checklists/${one.id}/complete`), memberToken).send({});
    expect(completed.body).toMatchObject({ isCompleted: true, isVerified: false });

    const memberVerify = await as(request(app).post(`/api/tasks/${task.id}/checklists/${one.id}/verify`), memberToken).send({});
    expect(memberVerify.status).toBe(403);

    const verified = await asAdmin(request(app).post(`/api/tasks/${task.id}/checklists/${one.id}/verify`)).send({});
    expect(verified.body).toMatchObject({ isCompleted: true, isVerified: true });

    const undone = await as(request(app).post(`/api/tasks/${task.id}/checklists/${one.id}/complete`), memberToken).send({ value: false });
    expect(undone.body).toMatchObject({ isCompleted: false, isVerified: false });

    expect((await as(request(app).post(`/api/tasks/${task.id}/checklists/${two.id}/complete`), outsiderToken).send({})).status).toBe(404);
    expect((await as(request(app).post(`/api/tasks/${task.id}/checklists`), memberToken).send({ title: "Extra" })).status).toBe(403);

    const added = await asAdmin(request(app).post(`/api/tasks/${task.id}/checklists`)).send({ title: "Extra" });
    expect(added.status).toBe(201);
    expect((await asAdmin(request(app).delete(`/api/tasks/${task.id}/checklists/${added.body.id}`))).status).toBe(204);
  });
});

describe("time entries", () => {
  it("runs a timer, blocks a second one, and reports totals", async () => {
    const t1 = await createTask({ memberIds: [memberEmployeeId] });
    const t2 = await createTask({ memberIds: [memberEmployeeId] });

    const started = await as(request(app).post(`/api/tasks/${t1.id}/time-entries/start`), memberToken).send({ note: "focus" });
    expect(started.status).toBe(201);
    expect(started.body).toMatchObject({ isRunning: true, endTime: null, durationMinutes: null, isBillable: true });

    const second = await as(request(app).post(`/api/tasks/${t2.id}/time-entries/start`), memberToken).send({});
    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe("TIMER_ALREADY_RUNNING");

    const stopped = await as(request(app).post(`/api/tasks/${t1.id}/time-entries/stop`), memberToken).send({ note: "done" });
    expect(stopped.status).toBe(200);
    expect(stopped.body).toMatchObject({ isRunning: false, note: "done" });
    expect(stopped.body.durationMinutes).toBeGreaterThanOrEqual(0);

    expect((await as(request(app).post(`/api/tasks/${t1.id}/time-entries/stop`), memberToken).send({})).status).toBe(404);

    const manual = await as(request(app).post(`/api/tasks/${t1.id}/time-entries`), memberToken).send({
      startTime: "2026-10-01T09:00:00.000Z",
      endTime: "2026-10-01T10:30:00.000Z",
      isBillable: false,
    });
    expect(manual.body.durationMinutes).toBe(90);

    const list = await as(request(app).get(`/api/tasks/${t1.id}/time-entries`), memberToken);
    expect(list.body.items).toHaveLength(2);
    expect(list.body.totalMinutes).toBeGreaterThanOrEqual(90);
    expect(list.body.billableMinutes).toBe(list.body.totalMinutes - 90);
  });

  it("allows only one of two simultaneous timer starts", async () => {
    const t1 = await createTask({ memberIds: [memberEmployeeId] });
    const t2 = await createTask({ memberIds: [memberEmployeeId] });
    const [a, b] = await Promise.all([
      as(request(app).post(`/api/tasks/${t1.id}/time-entries/start`), memberToken).send({}),
      as(request(app).post(`/api/tasks/${t2.id}/time-entries/start`), memberToken).send({}),
    ]);
    expect([a.status, b.status].sort()).toEqual([201, 409]);
    const running = await tc.timeEntry.count({ where: { employeeId: memberEmployeeId, endTime: null } });
    expect(running).toBe(1);
    await tc.timeEntry.deleteMany({ where: { employeeId: memberEmployeeId, endTime: null } });
  });

  it("validates ranges and permissions", async () => {
    const task = await createTask({ memberIds: [memberEmployeeId], followerIds: [outsiderEmployeeId] });

    const backwards = await as(request(app).post(`/api/tasks/${task.id}/time-entries`), memberToken).send({
      startTime: "2026-10-01T10:00:00.000Z",
      endTime: "2026-10-01T09:00:00.000Z",
    });
    expect(backwards.status).toBe(400);
    expect(backwards.body.error.code).toBe("INVALID_TIME_RANGE");

    // A follower can see the task but not log time on it.
    const follower = await as(request(app).post(`/api/tasks/${task.id}/time-entries`), outsiderToken).send({
      startTime: "2026-10-01T09:00:00.000Z",
      endTime: "2026-10-01T10:00:00.000Z",
    });
    expect(follower.status).toBe(403);

    const entry = await as(request(app).post(`/api/tasks/${task.id}/time-entries`), memberToken).send({
      startTime: "2026-10-01T09:00:00.000Z",
      endTime: "2026-10-01T10:00:00.000Z",
    });
    // Someone else cannot edit it; the supervisor/admin can.
    expect((await as(request(app).patch(`/api/tasks/time-entries/${entry.body.id}`), outsiderToken).send({ note: "x" })).status).toBe(403);
    const edited = await asAdmin(request(app).patch(`/api/tasks/time-entries/${entry.body.id}`)).send({ note: "reviewed" });
    expect(edited.body.note).toBe("reviewed");

    // Tasks with logged time cannot be deleted.
    const del = await asAdmin(request(app).delete(`/api/tasks/${task.id}`));
    expect(del.status).toBe(409);
    expect(del.body.error.code).toBe("TASK_HAS_TIME_ENTRIES");

    expect((await as(request(app).delete(`/api/tasks/time-entries/${entry.body.id}`), memberToken)).status).toBe(204);
    expect((await asAdmin(request(app).delete(`/api/tasks/${task.id}`))).status).toBe(204);
  });
});

describe("polymorphic comments and attachments", () => {
  it("keeps task and project threads separate and enforces visibility", async () => {
    const task = await createTask({ memberIds: [memberEmployeeId] });

    const onTask = await as(request(app).post(`/api/tasks/${task.id}/comments`), memberToken).send({ body: "On the task" });
    expect(onTask.status).toBe(201);
    expect(onTask.body).toMatchObject({ commentableType: "task", commentableId: task.id, status: null });

    const onProject = await asAdmin(request(app).post(`/api/projects/${projectId}/comments`)).send({ body: "On the project", status: "open" });
    expect(onProject.body).toMatchObject({ commentableType: "project", commentableId: projectId, status: "open" });

    const taskThread = await as(request(app).get(`/api/tasks/${task.id}/comments`), memberToken);
    expect(taskThread.body.map((c: { body: string }) => c.body)).toEqual(["On the task"]);
    const projectThread = await asAdmin(request(app).get(`/api/projects/${projectId}/comments`));
    expect(projectThread.body.map((c: { body: string }) => c.body)).toEqual(["On the project"]);

    expect((await as(request(app).get(`/api/tasks/${task.id}/comments`), outsiderToken)).status).toBe(404);
    expect((await as(request(app).post(`/api/tasks/${task.id}/comments`), outsiderToken).send({ body: "hi" })).status).toBe(404);

    // Status: a plain member cannot pre-set one, the supervisor can resolve it.
    expect((await as(request(app).post(`/api/tasks/${task.id}/comments`), memberToken).send({ body: "x", status: "resolved" })).status).toBe(403);
    const resolved = await asAdmin(request(app).patch(`/api/comments/${onTask.body.id}`)).send({ status: "resolved" });
    expect(resolved.body.status).toBe("resolved");
    // Only the author edits the text.
    expect((await asAdmin(request(app).patch(`/api/comments/${onTask.body.id}`)).send({ body: "rewritten" })).status).toBe(403);
    expect((await as(request(app).patch(`/api/comments/${onTask.body.id}`), memberToken).send({ body: "edited" })).body.body).toBe("edited");

    expect((await as(request(app).delete(`/api/comments/${onTask.body.id}`), outsiderToken)).status).toBe(404);
    expect((await as(request(app).delete(`/api/comments/${onTask.body.id}`), memberToken)).status).toBe(204);
  });

  it("uploads, lists and deletes attachments, and purges them with the owner", async () => {
    const task = await createTask({ memberIds: [memberEmployeeId] });

    const noFile = await as(request(app).post(`/api/tasks/${task.id}/attachments`), memberToken);
    expect(noFile.status).toBe(400);

    const uploaded = await as(request(app).post(`/api/tasks/${task.id}/attachments`), memberToken).attach(
      "file",
      Buffer.from("hello world"),
      { filename: "notes.txt", contentType: "text/plain" }
    );
    expect(uploaded.status).toBe(201);
    expect(uploaded.body).toMatchObject({
      attachableType: "task",
      attachableId: task.id,
      fileName: "notes.txt",
      fileType: "text/plain",
      fileSize: 11,
    });
    expect(uploaded.body.fileUrl).toEqual(expect.any(String));

    const badType = await as(request(app).post(`/api/tasks/${task.id}/attachments`), memberToken).attach(
      "file",
      Buffer.from("MZ"),
      { filename: "evil.exe", contentType: "application/x-msdownload" }
    );
    expect(badType.status).toBeGreaterThanOrEqual(400);

    const list = await as(request(app).get(`/api/tasks/${task.id}/attachments`), memberToken);
    expect(list.body).toHaveLength(1);
    expect((await as(request(app).get(`/api/tasks/${task.id}/attachments`), outsiderToken)).status).toBe(404);

    // Owner deletion cleans up polymorphic rows (no FK to cascade).
    await as(request(app).post(`/api/tasks/${task.id}/comments`), memberToken).send({ body: "will be purged" });
    expect((await asAdmin(request(app).delete(`/api/tasks/${task.id}`))).status).toBe(204);
    expect(await tc.comment.count({ where: { commentableType: "task", commentableId: task.id } })).toBe(0);
    expect(await tc.attachment.count({ where: { attachableType: "task", attachableId: task.id } })).toBe(0);
  });

  it("only the uploader or a supervisor can delete an attachment", async () => {
    const task = await createTask({ memberIds: [memberEmployeeId, outsiderEmployeeId] });
    const uploaded = await as(request(app).post(`/api/tasks/${task.id}/attachments`), memberToken).attach(
      "file",
      Buffer.from("abc"),
      { filename: "a.txt", contentType: "text/plain" }
    );
    expect((await as(request(app).delete(`/api/attachments/${uploaded.body.id}`), outsiderToken)).status).toBe(403);
    expect((await asAdmin(request(app).delete(`/api/attachments/${uploaded.body.id}`))).status).toBe(204);
  });
});

describe("recurring task generation", () => {
  it("spawns the next cycle, decrements the parent and advances the schedule", async () => {
    const now = new Date();
    const parent = await makeRecurringParent({ now, totalCycles: 3, dueOffsetMs: 2 * DAY });
    await tc.taskMember.create({ data: { taskId: parent.id, employeeId: memberEmployeeId } });
    await tc.taskFollower.create({ data: { taskId: parent.id, employeeId: outsiderEmployeeId } });
    await tc.checklist.create({ data: { taskId: parent.id, title: "Step", isCompleted: true, isVerified: true } });
    const cycleAt = parent.nextRecurrenceAt!;

    expect(await runRecurringTaskGenerationForTenant(tc, now)).toBe(1);

    const refreshed = await tc.task.findUniqueOrThrow({ where: { id: parent.id } });
    expect(refreshed.totalCycles).toBe(2);
    expect(refreshed.nextRecurrenceAt!.getTime()).toBe(cycleAt.getTime() + DAY);

    const children = await tc.task.findMany({
      where: { recurrenceParentId: parent.id },
      include: { members: true, followers: true, checklists: true },
    });
    expect(children).toHaveLength(1);
    const child = children[0];
    expect(child.taskNumber).toMatch(new RegExp(`^${projectCode}-\\d+$`));
    expect(child.taskNumber).not.toBe(parent.taskNumber);
    expect(child).toMatchObject({
      title: parent.title,
      status: "to_do",
      progressPercentage: 0,
      recurrenceFrequency: "none",
      totalCycles: 0,
      nextRecurrenceAt: null,
      supervisorId: adminEmployeeId,
    });
    expect(child.cycleAt!.getTime()).toBe(cycleAt.getTime());
    // due date keeps the parent's created->due distance from the spawn time
    expect(child.dueDate!.getTime() - cycleAt.getTime()).toBe(parent.dueDate!.getTime() - parent.createdAt.getTime());
    expect(child.members.map((m) => m.employeeId)).toEqual([memberEmployeeId]);
    expect(child.followers.map((f) => f.employeeId)).toEqual([outsiderEmployeeId]);
    expect(child.checklists).toMatchObject([{ title: "Step", isCompleted: false, isVerified: false }]);
  });

  it("is idempotent for the same clock", async () => {
    const now = new Date();
    const parent = await makeRecurringParent({ now, totalCycles: 5 });
    expect(await runRecurringTaskGenerationForTenant(tc, now)).toBeGreaterThanOrEqual(1);
    const childrenAfterFirst = await tc.task.count({ where: { recurrenceParentId: parent.id } });
    expect(await runRecurringTaskGenerationForTenant(tc, now)).toBe(0);
    expect(await tc.task.count({ where: { recurrenceParentId: parent.id } })).toBe(childrenAfterFirst);
    expect((await tc.task.findUniqueOrThrow({ where: { id: parent.id } })).totalCycles).toBe(5 - childrenAfterFirst);
  });

  it("catches up missed cycles, then stops and clears the schedule when cycles run out", async () => {
    const now = new Date();
    const parent = await makeRecurringParent({
      now,
      totalCycles: 3,
      nextRecurrenceAt: new Date(now.getTime() - 10 * DAY),
    });

    // 10 days overdue, but only 3 cycles remain -> exactly 3 are created.
    expect(await runRecurringTaskGenerationForTenant(tc, now)).toBe(3);
    const refreshed = await tc.task.findUniqueOrThrow({ where: { id: parent.id } });
    expect(refreshed.totalCycles).toBe(0);
    expect(refreshed.nextRecurrenceAt).toBeNull();

    const cycles = (await tc.task.findMany({ where: { recurrenceParentId: parent.id }, orderBy: { cycleAt: "asc" } })).map((c) => c.cycleAt!.getTime());
    // one child per missed day, oldest first: -10d, -9d, -8d
    expect(cycles).toEqual([0, 1, 2].map((i) => parent.nextRecurrenceAt!.getTime() + i * DAY));

    expect(await runRecurringTaskGenerationForTenant(tc, now)).toBe(0);
    expect(await tc.task.count({ where: { recurrenceParentId: parent.id } })).toBe(3);
  });

  it("does not generate cycles that are not due yet", async () => {
    const now = new Date();
    const parent = await makeRecurringParent({ now, totalCycles: 2, nextRecurrenceAt: new Date(now.getTime() + HOUR) });
    expect(await runRecurringTaskGenerationForTenant(tc, now)).toBe(0);
    expect(await tc.task.count({ where: { recurrenceParentId: parent.id } })).toBe(0);
  });

  it("skips cancelled parents and closed projects but keeps their cycles", async () => {
    const now = new Date();
    const cancelled = await makeRecurringParent({ now, totalCycles: 2, status: "cancelled" });

    const closedProject = await asAdmin(request(app).post("/api/projects")).send(projectBody({ title: "Closing", code: "closing" }));
    const inClosed = await makeRecurringParent({ now, totalCycles: 2, projectId: closedProject.body.id });
    await tc.project.update({ where: { id: closedProject.body.id }, data: { status: "archived" } });

    const before = await tc.task.count();
    // Other due parents from earlier tests are exhausted or already caught up, so nothing new appears.
    await runRecurringTaskGenerationForTenant(tc, now);
    expect(await tc.task.count({ where: { recurrenceParentId: { in: [cancelled.id, inClosed.id] } } })).toBe(0);
    expect((await tc.task.findUniqueOrThrow({ where: { id: cancelled.id } })).totalCycles).toBe(2);
    expect((await tc.task.findUniqueOrThrow({ where: { id: inClosed.id } })).totalCycles).toBe(2);
    expect(await tc.task.count()).toBe(before);

    // Reopening the project resumes generation.
    await tc.project.update({ where: { id: closedProject.body.id }, data: { status: "in_progress" } });
    expect(await runRecurringTaskGenerationForTenant(tc, now)).toBeGreaterThanOrEqual(1);
    expect(await tc.task.count({ where: { recurrenceParentId: inClosed.id } })).toBeGreaterThanOrEqual(1);
  });

  it("creates each cycle once when two workers run at the same time", async () => {
    const now = new Date();
    const parent = await makeRecurringParent({ now, totalCycles: 4 });
    const [a, b] = await Promise.all([
      runRecurringTaskGenerationForTenant(tc, now),
      runRecurringTaskGenerationForTenant(tc, now),
    ]);
    const children = await tc.task.count({ where: { recurrenceParentId: parent.id } });
    expect(children).toBe(1);
    expect(a + b).toBeGreaterThanOrEqual(1);
    expect((await tc.task.findUniqueOrThrow({ where: { id: parent.id } })).totalCycles).toBe(3);
  });

  it("rejects a duplicate cycle at the database level", async () => {
    const now = new Date();
    const parent = await makeRecurringParent({ now, totalCycles: 0, nextRecurrenceAt: undefined });
    const cycleAt = new Date(now.getTime() - DAY);
    const data = {
      projectId,
      title: "dup",
      priority: "low",
      timeType: "flexible",
      supervisorId: adminEmployeeId,
      description: "",
      createdById: adminUserId,
      recurrenceParentId: parent.id,
      cycleAt,
    };
    await createTaskWithNumber(tc, data);
    await expect(createTaskWithNumber(tc, data)).rejects.toThrow();
  });

  it("keeps generated cycles when the recurring parent is deleted", async () => {
    const now = new Date();
    const parent = await makeRecurringParent({ now, totalCycles: 2 });
    await runRecurringTaskGenerationForTenant(tc, now);
    const child = await tc.task.findFirstOrThrow({ where: { recurrenceParentId: parent.id } });

    expect((await asAdmin(request(app).delete(`/api/tasks/${parent.id}`))).status).toBe(204);
    const survivor = await tc.task.findUniqueOrThrow({ where: { id: child.id } });
    expect(survivor.recurrenceParentId).toBeNull();
  });
});
