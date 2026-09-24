import request from "supertest";
import { TENANT_HEADER, TaskDto } from "@hrm-plus/shared";
import { createApp } from "../app";
import { controlClient } from "../db/controlClient";
import { disconnectAllTenantClients, getTenantClient } from "../db/tenantClientPool";
import { PrismaClient } from "../../generated/tenant";
import { getMyWorkDashboard } from "../modules/tasks/myWorkDashboard.service";
import { loginAsAdmin, setupTestTenant, teardownTestTenant, TestTenant } from "./testUtils";

const app = createApp();
let tenant: TestTenant;
let adminToken: string;
let tc: PrismaClient;
let adminEmployeeId: number;

const DAY = 24 * 60 * 60 * 1000;
const inDays = (n: number) => new Date(Date.now() + n * DAY).toISOString();

interface Person {
  employeeId: number;
  token: string;
}
let member: Person; // works on tasks
let supervisor: Person; // supervises a project and a task
let follower: Person; // follows a task
let other: Person; // unrelated work

let mainProjectId: number; // supervised by `supervisor`, member = `member`
const ids: Record<string, number> = {};

function as(req: request.Test, token: string) {
  return req.set(TENANT_HEADER, tenant.slug).set("Authorization", `Bearer ${token}`);
}
const asAdmin = (req: request.Test) => as(req, adminToken);

async function createStaff(email: string, departmentId: number): Promise<Person> {
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
  return { employeeId: res.body.id, token: login.body.accessToken };
}

async function createProject(title: string, supervisorId: number, memberIds: number[] = []) {
  const res = await asAdmin(request(app).post("/api/projects")).send({
    title,
    contractType: "fixed",
    totalAmount: 1000,
    estimatedHours: 10,
    deadlineType: "casual",
    startDate: "2026-10-01",
    supervisorId,
    priority: "medium",
    memberIds,
  });
  expect(res.status).toBe(201);
  return res.body.id as number;
}

async function createTask(name: string, body: Record<string, unknown>, projectId = mainProjectId) {
  const res = await asAdmin(request(app).post("/api/tasks")).send({
    projectId,
    title: name,
    priority: "medium",
    timeType: "flexible",
    ...body,
  });
  expect(res.status).toBe(201);
  ids[name] = res.body.id;
  return res.body as TaskDto;
}

const dashboard = (token: string) => as(request(app).get("/api/tasks/dashboard"), token);
const titles = (tasks: TaskDto[]) => tasks.map((t) => t.title);

beforeAll(async () => {
  tenant = await setupTestTenant("mywork");
  adminToken = await loginAsAdmin(app, tenant);
  tc = getTenantClient(tenant.databaseName);
  adminEmployeeId = (await tc.user.findFirstOrThrow({ where: { email: tenant.adminEmail }, include: { employee: true } }))
    .employee!.id;

  const departmentId = (await asAdmin(request(app).post("/api/departments")).send({ name: "Work Dept" })).body.id;
  member = await createStaff("mw.member@example.com", departmentId);
  supervisor = await createStaff("mw.supervisor@example.com", departmentId);
  follower = await createStaff("mw.follower@example.com", departmentId);
  other = await createStaff("mw.other@example.com", departmentId);

  mainProjectId = await createProject("Main", supervisor.employeeId, [member.employeeId]);

  // member's work: three in progress (due in 3d / none / 1d), two to do (due in 2d / none)
  await createTask("ip-due3", { status: "in_progress", dueDate: inDays(3), memberIds: [member.employeeId] });
  await createTask("ip-nodue", { status: "in_progress", memberIds: [member.employeeId] });
  await createTask("ip-due1", { status: "in_progress", dueDate: inDays(1), memberIds: [member.employeeId] });
  await createTask("todo-due2", { status: "to_do", dueDate: inDays(2), memberIds: [member.employeeId] });
  await createTask("todo-nodue", { status: "to_do", memberIds: [member.employeeId] });
  // never shown
  await createTask("done", { status: "completed", memberIds: [member.employeeId] });
  await createTask("cancelled", { status: "cancelled", memberIds: [member.employeeId] });
  await createTask("held", { status: "on_hold", memberIds: [member.employeeId] });
  // someone else's, supervised by `supervisor`, followed by `follower`
  await createTask("others-ip", { status: "in_progress", memberIds: [other.employeeId] });
  await createTask("sup-follow", {
    status: "to_do",
    supervisorId: supervisor.employeeId,
    memberIds: [other.employeeId],
    followerIds: [follower.employeeId],
  });
  await createTask("follow-done", {
    status: "completed",
    memberIds: [other.employeeId],
    followerIds: [follower.employeeId],
  });

  // an archived project's tasks are hidden
  const archivedId = await createProject("Archived", adminEmployeeId, [member.employeeId]);
  await createTask("in-archived", { status: "in_progress", memberIds: [member.employeeId] }, archivedId);
  await asAdmin(request(app).patch(`/api/projects/${archivedId}`)).send({ status: "archived" });
}, 120000);

afterAll(async () => {
  await teardownTestTenant(tenant);
  await disconnectAllTenantClients();
  await controlClient.$disconnect();
});

describe("GET /api/tasks/dashboard", () => {
  it("requires authentication", async () => {
    const res = await request(app).get("/api/tasks/dashboard").set(TENANT_HEADER, tenant.slug);
    expect(res.status).toBe(401);
  });

  it("lists a member's in-progress and to-do tasks, soonest due first and undated last", async () => {
    const res = await dashboard(member.token);
    expect(res.status).toBe(200);
    expect(titles(res.body.inProgressTasks)).toEqual(["ip-due1", "ip-due3", "ip-nodue"]);
    expect(titles(res.body.upcomingTasks)).toEqual(["todo-due2", "todo-nodue"]);
    expect(res.body.totals).toMatchObject({ inProgressTasks: 3, upcomingTasks: 2 });
    expect(res.body.runningTimer).toBeNull();
  });

  it("hides finished, cancelled, on-hold, other people's and archived-project tasks", async () => {
    const res = await dashboard(member.token);
    const all = titles([...res.body.inProgressTasks, ...res.body.upcomingTasks]);
    for (const hidden of ["done", "cancelled", "held", "others-ip", "in-archived", "sup-follow"]) {
      expect(all).not.toContain(hidden);
    }
    // being a project member alone does not put anything in supervised/followed
    expect(res.body.supervisedProjects).toEqual([]);
    expect(res.body.supervisedTasks).toEqual([]);
    expect(res.body.followedTasks).toEqual([]);
  });

  it("shows what a supervisor supervises: their project and their tasks", async () => {
    const res = await dashboard(supervisor.token);
    expect(res.body.supervisedProjects.map((p: { id: number }) => p.id)).toEqual([mainProjectId]);
    // Tasks default to their project's supervisor, so this is every unfinished task in "Main",
    // soonest due first (undated by creation order); completed/cancelled are excluded.
    expect(titles(res.body.supervisedTasks)).toEqual([
      "ip-due1",
      "todo-due2",
      "ip-due3",
      "ip-nodue",
      "todo-nodue",
      "held",
      "others-ip",
      "sup-follow",
    ]);
    expect(res.body.totals).toMatchObject({ supervisedProjects: 1, supervisedTasks: 8 });
    // supervising is not the same as working on it
    expect(res.body.inProgressTasks).toEqual([]);
    expect(res.body.upcomingTasks).toEqual([]);
  });

  it("stops listing a supervised project once it is completed", async () => {
    const p = await createProject("Wrapping up", supervisor.employeeId);
    expect((await dashboard(supervisor.token)).body.totals.supervisedProjects).toBe(2);
    await asAdmin(request(app).patch(`/api/projects/${p}`)).send({ status: "completed" });
    expect((await dashboard(supervisor.token)).body.totals.supervisedProjects).toBe(1);
  });

  it("shows tasks a person follows, but only unfinished ones", async () => {
    const res = await dashboard(follower.token);
    expect(titles(res.body.followedTasks)).toEqual(["sup-follow"]);
    expect(res.body.totals.followedTasks).toBe(1);
    expect(res.body.inProgressTasks).toEqual([]);
  });

  it("scopes to the caller even for managers", async () => {
    const res = await dashboard(adminToken);
    expect(res.status).toBe(200);
    expect(res.body.inProgressTasks).toEqual([]);
    expect(res.body.upcomingTasks).toEqual([]);
    // the admin supervises only the archived project, which is not listed
    expect(res.body.supervisedProjects).toEqual([]);
    expect(res.body.supervisedTasks).toEqual([]);
  });

  it("returns empty lists for an account without an employee profile", async () => {
    const dto = await getMyWorkDashboard(tc, { userId: 999999, role: "Staff", employeeId: null, isAdmin: false, canViewAll: false, canAddTasks: false });
    expect(dto.runningTimer).toBeNull();
    expect(dto.inProgressTasks).toEqual([]);
    expect(dto.totals).toEqual({
      inProgressTasks: 0,
      upcomingTasks: 0,
      supervisedProjects: 0,
      supervisedTasks: 0,
      followedTasks: 0,
    });
  });

  it("caps each list at 10 and reports the full total", async () => {
    const busy = await createStaff("mw.busy@example.com", (await tc.department.findFirstOrThrow()).id);
    const pid = await createProject("Busy", adminEmployeeId, [busy.employeeId]);
    for (let i = 0; i < 12; i++) {
      await createTask(`busy-${i}`, { status: "in_progress", memberIds: [busy.employeeId], dueDate: inDays(i + 1) }, pid);
    }
    const res = await dashboard(busy.token);
    expect(res.body.inProgressTasks).toHaveLength(10);
    expect(res.body.totals.inProgressTasks).toBe(12);
    expect(titles(res.body.inProgressTasks)[0]).toBe("busy-0");
  }, 60000);
});

describe("timer rules used by the dashboard", () => {
  it("starting the timer moves a To-do task to In progress and reports the running timer", async () => {
    const start = await as(request(app).post(`/api/tasks/${ids["todo-due2"]}/time-entries/start`), member.token).send({});
    expect(start.status).toBe(201);

    const res = await dashboard(member.token);
    expect(res.body.runningTimer).toMatchObject({ taskId: ids["todo-due2"], taskTitle: "todo-due2" });
    expect(res.body.runningTimer.taskNumber).toMatch(/^main-\d+$/);
    expect(titles(res.body.upcomingTasks)).toEqual(["todo-nodue"]);
    expect(titles(res.body.inProgressTasks)).toContain("todo-due2");
    expect(res.body.totals).toMatchObject({ inProgressTasks: 4, upcomingTasks: 1 });

    const stop = await as(request(app).post(`/api/tasks/${ids["todo-due2"]}/time-entries/stop`), member.token).send({});
    expect(stop.status).toBe(200);
    expect((await dashboard(member.token)).body.runningTimer).toBeNull();
    // stopping does not move it back
    expect((await tc.task.findUniqueOrThrow({ where: { id: ids["todo-due2"] } })).status).toBe("in_progress");
  });

  it("does not override a task that is on hold, and a manual entry leaves a To-do task alone", async () => {
    const start = await as(request(app).post(`/api/tasks/${ids["held"]}/time-entries/start`), member.token).send({});
    expect(start.status).toBe(201);
    expect((await tc.task.findUniqueOrThrow({ where: { id: ids["held"] } })).status).toBe("on_hold");
    await as(request(app).post(`/api/tasks/${ids["held"]}/time-entries/stop`), member.token).send({});

    const manual = await as(request(app).post(`/api/tasks/${ids["todo-nodue"]}/time-entries`), member.token).send({
      startTime: "2026-10-01T09:00:00.000Z",
      endTime: "2026-10-01T10:00:00.000Z",
    });
    expect(manual.status).toBe(201);
    expect((await tc.task.findUniqueOrThrow({ where: { id: ids["todo-nodue"] } })).status).toBe("to_do");
  });

  it("a failed start (timer already running) leaves the task's status untouched", async () => {
    await as(request(app).post(`/api/tasks/${ids["ip-due1"]}/time-entries/start`), member.token).send({});
    const second = await as(request(app).post(`/api/tasks/${ids["todo-nodue"]}/time-entries/start`), member.token).send({});
    expect(second.status).toBe(409);
    expect((await tc.task.findUniqueOrThrow({ where: { id: ids["todo-nodue"] } })).status).toBe("to_do");
    await as(request(app).post(`/api/tasks/${ids["ip-due1"]}/time-entries/stop`), member.token).send({});
  });
});
