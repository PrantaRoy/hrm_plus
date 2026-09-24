import request from "supertest";
import { TENANT_HEADER } from "@hrm-plus/shared";
import { createApp } from "../app";
import { controlClient } from "../db/controlClient";
import { disconnectAllTenantClients } from "../db/tenantClientPool";
import { loginAsAdmin, setupTestTenant, teardownTestTenant, TestTenant } from "./testUtils";

const app = createApp();
let tenant: TestTenant;
let adminToken: string;

interface Person {
  employeeId: number;
  token: string;
}
let hr: Person;
let manager: Person;
let projectSupervisor: Person; // Staff, supervises project P
let taskSupervisor: Person; // Staff, supervises only task T
let member: Person; // Staff, member of task T
let follower: Person; // Staff, follows task T
let projectMember: Person; // Staff, member of project P only (no task)
let outsider: Person; // Staff, only involved in project Q

let adminEmployeeId: number;
let P: number; // project supervised by projectSupervisor
let Q: number; // unrelated project
let T: { id: number; checklistIds: number[] }; // task in P
let T2: number; // second task in P (default supervisor = projectSupervisor)
let TQ: number; // task in Q
let memberComment: number;

const as = (req: request.Test, token: string) =>
  req.set(TENANT_HEADER, tenant.slug).set("Authorization", `Bearer ${token}`);
const asAdmin = (req: request.Test) => as(req, adminToken);

async function createPerson(email: string, role: string, departmentId: number): Promise<Person> {
  const res = await asAdmin(request(app).post("/api/employees")).send({
    firstName: role,
    lastName: email.split("@")[0],
    email,
    joiningDate: "2026-01-01",
    departmentId,
    role,
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

const projectBody = (title: string, supervisorId: number, memberIds: number[] = []) => ({
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

const taskBody = (projectId: number, extra: Record<string, unknown> = {}) => ({
  projectId,
  title: "New task",
  priority: "medium",
  timeType: "flexible",
  ...extra,
});

const ids = (items: { id: number }[]) => items.map((i) => i.id).sort((a, b) => a - b);

beforeAll(async () => {
  tenant = await setupTestTenant("perms");
  adminToken = await loginAsAdmin(app, tenant);
  const departmentId = (await asAdmin(request(app).post("/api/departments")).send({ name: "Perm Dept" })).body.id;
  hr = await createPerson("perm.hr@example.com", "HR", departmentId);
  manager = await createPerson("perm.manager@example.com", "Manager", departmentId);
  projectSupervisor = await createPerson("perm.projsup@example.com", "Staff", departmentId);
  taskSupervisor = await createPerson("perm.tasksup@example.com", "Staff", departmentId);
  member = await createPerson("perm.member@example.com", "Staff", departmentId);
  follower = await createPerson("perm.follower@example.com", "Staff", departmentId);
  projectMember = await createPerson("perm.projmember@example.com", "Staff", departmentId);
  outsider = await createPerson("perm.outsider@example.com", "Staff", departmentId);

  const me = (await asAdmin(request(app).get("/api/employees?pageSize=100"))).body.items.find(
    (e: { email: string }) => e.email === tenant.adminEmail
  );
  adminEmployeeId = me.id;

  P = (await asAdmin(request(app).post("/api/projects")).send(projectBody("Project P", projectSupervisor.employeeId, [projectMember.employeeId]))).body.id;
  Q = (await asAdmin(request(app).post("/api/projects")).send(projectBody("Project Q", adminEmployeeId))).body.id;

  const t = await asAdmin(request(app).post("/api/tasks")).send(
    taskBody(P, {
      title: "T",
      supervisorId: taskSupervisor.employeeId,
      memberIds: [member.employeeId],
      followerIds: [follower.employeeId],
      checklist: ["item one", "item two"],
    })
  );
  expect(t.status).toBe(201);
  T = { id: t.body.id, checklistIds: t.body.checklists.map((c: { id: number }) => c.id) };
  T2 = (await asAdmin(request(app).post("/api/tasks")).send(taskBody(P, { title: "T2" }))).body.id;
  TQ = (await asAdmin(request(app).post("/api/tasks")).send(taskBody(Q, { title: "TQ", memberIds: [outsider.employeeId] }))).body.id;

  // the member completes item one so that it can be verified
  await as(request(app).post(`/api/tasks/${T.id}/checklists/${T.checklistIds[0]}/complete`), member.token).send({});
  memberComment = (await as(request(app).post(`/api/tasks/${T.id}/comments`), member.token).send({ body: "please review" })).body.id;
}, 120000);

afterAll(async () => {
  await teardownTestTenant(tenant);
  await disconnectAllTenantClients();
  await controlClient.$disconnect();
});

describe("Admin", () => {
  it("can edit and delete projects and tasks and reports full permissions", async () => {
    const task = await asAdmin(request(app).get(`/api/tasks/${T.id}`));
    expect(task.body.viewer).toEqual({ canManage: true, canWork: true, canVerify: true, canModerate: true });
    const project = await asAdmin(request(app).get(`/api/projects/${P}`));
    expect(project.body.viewer).toEqual({ canManage: true, canCreateTasks: true, canModerate: true });

    expect((await asAdmin(request(app).patch(`/api/projects/${Q}`)).send({ title: "Project Q (renamed)" })).status).toBe(200);
    expect((await asAdmin(request(app).patch(`/api/tasks/${TQ}`)).send({ title: "TQ renamed" })).status).toBe(200);
    expect((await asAdmin(request(app).put(`/api/tasks/${TQ}/members`)).send({ employeeIds: [outsider.employeeId] })).status).toBe(200);
    const extra = await asAdmin(request(app).post("/api/tasks")).send(taskBody(Q, { title: "throwaway" }));
    expect((await asAdmin(request(app).delete(`/api/tasks/${extra.body.id}`))).status).toBe(204);
    const proj = await asAdmin(request(app).post("/api/projects")).send(projectBody("Throwaway", adminEmployeeId));
    expect(proj.status).toBe(201);
    expect((await asAdmin(request(app).delete(`/api/projects/${proj.body.id}`))).status).toBe(204);
  });
});

describe.each([
  ["HR", () => hr],
  ["Manager", () => manager],
])("%s", (_label, who) => {
  it("sees every project and task", async () => {
    const projects = await as(request(app).get("/api/projects?pageSize=100"), who().token);
    expect(ids(projects.body.items)).toEqual(expect.arrayContaining([P, Q]));
    const tasks = await as(request(app).get("/api/tasks?pageSize=100"), who().token);
    expect(ids(tasks.body.items)).toEqual(expect.arrayContaining([T.id, T2, TQ]));
  });

  it("can add a task, but cannot edit or delete it afterwards", async () => {
    const created = await as(request(app).post("/api/tasks"), who().token).send(taskBody(P, { title: "added by role" }));
    expect(created.status).toBe(201);
    expect(created.body.viewer).toEqual({ canManage: false, canWork: false, canVerify: false, canModerate: false });

    const id = created.body.id;
    expect((await as(request(app).patch(`/api/tasks/${id}`), who().token).send({ title: "renamed" })).status).toBe(403);
    expect((await as(request(app).patch(`/api/tasks/${id}`), who().token).send({ status: "in_progress" })).status).toBe(403);
    expect((await as(request(app).put(`/api/tasks/${id}/members`), who().token).send({ employeeIds: [] })).status).toBe(403);
    expect((await as(request(app).post(`/api/tasks/${id}/checklists`), who().token).send({ title: "x" })).status).toBe(403);
    expect((await as(request(app).delete(`/api/tasks/${id}`), who().token)).status).toBe(403);
    // Admin can still clean up
    expect((await asAdmin(request(app).delete(`/api/tasks/${id}`))).status).toBe(204);
  });

  it("cannot create, edit or delete a project", async () => {
    expect((await as(request(app).post("/api/projects"), who().token).send(projectBody("Nope", adminEmployeeId))).status).toBe(403);
    expect((await as(request(app).patch(`/api/projects/${P}`), who().token).send({ title: "Hacked" })).status).toBe(403);
    expect((await as(request(app).put(`/api/projects/${P}/members`), who().token).send({ employeeIds: [] })).status).toBe(403);
    expect((await as(request(app).delete(`/api/projects/${P}`), who().token)).status).toBe(403);
  });

  it("does not get supervisor or member powers on other people's tasks", async () => {
    const detail = await as(request(app).get(`/api/tasks/${T.id}`), who().token);
    expect(detail.body.viewer).toEqual({ canManage: false, canWork: false, canVerify: false, canModerate: false });
    expect((await as(request(app).post(`/api/tasks/${T.id}/checklists/${T.checklistIds[0]}/verify`), who().token).send({})).status).toBe(403);
    expect((await as(request(app).post(`/api/tasks/${T.id}/time-entries/start`), who().token).send({})).status).toBe(403);
  });

  it("can still read and comment on what they can see", async () => {
    const res = await as(request(app).post(`/api/tasks/${T.id}/comments`), who().token).send({ body: "FYI" });
    expect(res.status).toBe(201);
  });
});

describe("project supervisor (Staff)", () => {
  it("sees the project and every task in it, with supervisor-level permissions only", async () => {
    const project = await as(request(app).get(`/api/projects/${P}`), projectSupervisor.token);
    expect(project.status).toBe(200);
    expect(project.body.viewer).toEqual({ canManage: false, canCreateTasks: false, canModerate: true });
    const task = await as(request(app).get(`/api/tasks/${T.id}`), projectSupervisor.token);
    expect(task.body.viewer).toEqual({ canManage: false, canWork: true, canVerify: true, canModerate: true });
    const list = await as(request(app).get("/api/tasks?pageSize=100"), projectSupervisor.token);
    expect(ids(list.body.items)).toEqual([T.id, T2].sort((a, b) => a - b));
  });

  it("cannot add tasks or edit/delete the project or its tasks", async () => {
    expect((await as(request(app).post("/api/tasks"), projectSupervisor.token).send(taskBody(P))).status).toBe(403);
    expect((await as(request(app).patch(`/api/projects/${P}`), projectSupervisor.token).send({ title: "x" })).status).toBe(403);
    expect((await as(request(app).delete(`/api/projects/${P}`), projectSupervisor.token)).status).toBe(403);
    expect((await as(request(app).patch(`/api/tasks/${T2}`), projectSupervisor.token).send({ title: "x" })).status).toBe(403);
    expect((await as(request(app).delete(`/api/tasks/${T2}`), projectSupervisor.token)).status).toBe(403);
    expect((await as(request(app).put(`/api/tasks/${T2}/members`), projectSupervisor.token).send({ employeeIds: [] })).status).toBe(403);
    expect((await as(request(app).post(`/api/tasks/${T2}/checklists`), projectSupervisor.token).send({ title: "x" })).status).toBe(403);
  });

  it("can verify checklist items, moderate comments, and update status/progress", async () => {
    const verified = await as(request(app).post(`/api/tasks/${T.id}/checklists/${T.checklistIds[0]}/verify`), projectSupervisor.token).send({});
    expect(verified.status).toBe(200);
    expect(verified.body.isVerified).toBe(true);
    const resolved = await as(request(app).patch(`/api/comments/${memberComment}`), projectSupervisor.token).send({ status: "considered" });
    expect(resolved.status).toBe(200);
    const progress = await as(request(app).patch(`/api/tasks/${T2}`), projectSupervisor.token).send({ status: "in_progress", progressPercentage: 20 });
    expect(progress.status).toBe(200);
  });
});

describe("task supervisor (Staff)", () => {
  it("sees only their task and its project", async () => {
    const tasks = await as(request(app).get("/api/tasks?pageSize=100"), taskSupervisor.token);
    expect(ids(tasks.body.items)).toEqual([T.id]);
    const projects = await as(request(app).get("/api/projects?pageSize=100"), taskSupervisor.token);
    expect(ids(projects.body.items)).toEqual([P]);
    expect((await as(request(app).get(`/api/tasks/${T2}`), taskSupervisor.token)).status).toBe(404);
  });

  it("can verify and moderate but not edit", async () => {
    const detail = await as(request(app).get(`/api/tasks/${T.id}`), taskSupervisor.token);
    expect(detail.body.viewer).toEqual({ canManage: false, canWork: true, canVerify: true, canModerate: true });
    const verified = await as(request(app).post(`/api/tasks/${T.id}/checklists/${T.checklistIds[0]}/verify`), taskSupervisor.token).send({ value: true });
    expect(verified.status).toBe(200);
    expect((await as(request(app).patch(`/api/tasks/${T.id}`), taskSupervisor.token).send({ title: "x" })).status).toBe(403);
    expect((await as(request(app).delete(`/api/tasks/${T.id}`), taskSupervisor.token)).status).toBe(403);
    expect((await as(request(app).post("/api/tasks"), taskSupervisor.token).send(taskBody(P))).status).toBe(403);
  });
});

describe("member (Staff)", () => {
  it("sees only their task and its project, and only works on it", async () => {
    const tasks = await as(request(app).get("/api/tasks?pageSize=100"), member.token);
    expect(ids(tasks.body.items)).toEqual([T.id]);
    const projects = await as(request(app).get("/api/projects?pageSize=100"), member.token);
    expect(ids(projects.body.items)).toEqual([P]);

    const detail = await as(request(app).get(`/api/tasks/${T.id}`), member.token);
    expect(detail.body.viewer).toEqual({ canManage: false, canWork: true, canVerify: false, canModerate: false });
    expect((await as(request(app).patch(`/api/tasks/${T.id}`), member.token).send({ status: "in_progress", progressPercentage: 10 })).status).toBe(200);
    expect((await as(request(app).patch(`/api/tasks/${T.id}`), member.token).send({ title: "x" })).status).toBe(403);
    expect((await as(request(app).post(`/api/tasks/${T.id}/checklists/${T.checklistIds[1]}/verify`), member.token).send({})).status).toBe(403);
    expect((await as(request(app).patch(`/api/comments/${memberComment}`), member.token).send({ status: "open" })).status).toBe(200); // own comment
  });
});

describe("follower (Staff)", () => {
  it("can see the task and project and comment, but not work on the task", async () => {
    expect((await as(request(app).get(`/api/tasks/${T.id}`), follower.token)).status).toBe(200);
    expect((await as(request(app).get(`/api/projects/${P}`), follower.token)).status).toBe(200);
    const detail = await as(request(app).get(`/api/tasks/${T.id}`), follower.token);
    expect(detail.body.viewer).toEqual({ canManage: false, canWork: false, canVerify: false, canModerate: false });

    expect((await as(request(app).post(`/api/tasks/${T.id}/comments`), follower.token).send({ body: "following along" })).status).toBe(201);
    expect((await as(request(app).post(`/api/tasks/${T.id}/comments`), follower.token).send({ body: "x", status: "resolved" })).status).toBe(403);
    expect((await as(request(app).post(`/api/tasks/${T.id}/time-entries/start`), follower.token).send({})).status).toBe(403);
    expect((await as(request(app).patch(`/api/tasks/${T.id}`), follower.token).send({ status: "completed" })).status).toBe(403);
    expect((await as(request(app).post(`/api/tasks/${T.id}/checklists/${T.checklistIds[1]}/complete`), follower.token).send({})).status).toBe(403);

    const tasks = await as(request(app).get("/api/tasks?pageSize=100"), follower.token);
    expect(ids(tasks.body.items)).toEqual([T.id]);
  });
});

describe("project member without tasks (Staff)", () => {
  it("sees the project but none of its tasks", async () => {
    expect((await as(request(app).get(`/api/projects/${P}`), projectMember.token)).status).toBe(200);
    const tasks = await as(request(app).get("/api/tasks?pageSize=100"), projectMember.token);
    expect(tasks.body.items).toEqual([]);
    expect((await as(request(app).get(`/api/tasks/${T.id}`), projectMember.token)).status).toBe(404);
  });
});

describe("outsider (Staff)", () => {
  it("sees nothing outside their own project and task", async () => {
    expect((await as(request(app).get(`/api/projects/${P}`), outsider.token)).status).toBe(404);
    expect((await as(request(app).get(`/api/tasks/${T.id}`), outsider.token)).status).toBe(404);
    const projects = await as(request(app).get("/api/projects?pageSize=100"), outsider.token);
    expect(ids(projects.body.items)).toEqual([Q]);
    const tasks = await as(request(app).get("/api/tasks?pageSize=100"), outsider.token);
    expect(ids(tasks.body.items)).toEqual([TQ]);
    expect((await as(request(app).get(`/api/tasks/${T.id}/comments`), outsider.token)).status).toBe(404);
    expect((await as(request(app).get(`/api/tasks/${T.id}/attachments`), outsider.token)).status).toBe(404);
  });
});
