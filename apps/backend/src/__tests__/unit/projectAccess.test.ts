import {
  Actor,
  loadProjectAccess,
  projectVisibilityWhere,
  requireEmployeeId,
  resolveActor,
  taskVisibilityWhere,
} from "../../modules/projects/projectAccess";
import { ApiError } from "../../utils/ApiError";

const actor = (over: Partial<Actor> = {}): Actor => ({
  userId: 1,
  role: "Staff",
  employeeId: 10,
  isAdmin: false,
  canViewAll: false,
  canAddTasks: false,
  ...over,
});

describe("resolveActor", () => {
  const prismaFor = (employee: { id: number } | null) => ({ employee: { findUnique: jest.fn().mockResolvedValue(employee) } }) as never;

  it.each([
    ["Admin", { isAdmin: true, canViewAll: true, canAddTasks: true }],
    ["HR", { isAdmin: false, canViewAll: true, canAddTasks: true }],
    ["Manager", { isAdmin: false, canViewAll: true, canAddTasks: true }],
    ["Staff", { isAdmin: false, canViewAll: false, canAddTasks: false }],
    ["Payroll", { isAdmin: false, canViewAll: false, canAddTasks: false }],
  ])("derives flags for role %s", async (role, flags) => {
    const a = await resolveActor(prismaFor({ id: 5 }), { id: 1, role });
    expect(a).toMatchObject({ userId: 1, role, employeeId: 5, ...flags });
  });

  it("sets employeeId to null when the user has no employee profile", async () => {
    expect((await resolveActor(prismaFor(null), { id: 1, role: "Admin" })).employeeId).toBeNull();
  });
});

describe("requireEmployeeId", () => {
  it("returns the id when present", () => expect(requireEmployeeId(actor({ employeeId: 3 }))).toBe(3));
  it("throws NO_EMPLOYEE_PROFILE otherwise", () => {
    try {
      requireEmployeeId(actor({ employeeId: null }));
      fail("expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).status).toBe(400);
      expect((e as ApiError).code).toBe("NO_EMPLOYEE_PROFILE");
    }
  });
});

describe("taskVisibilityWhere", () => {
  it("does not restrict users who can view everything", () => {
    expect(taskVisibilityWhere(actor({ canViewAll: true }))).toEqual({});
  });

  it("matches nothing for a user without an employee profile", () => {
    expect(taskVisibilityWhere(actor({ employeeId: null }))).toEqual({ id: -1 });
  });

  it("limits ordinary users to supervised/member/followed tasks and tasks in projects they supervise", () => {
    expect(taskVisibilityWhere(actor({ employeeId: 10 }))).toEqual({
      OR: [
        { supervisorId: 10 },
        { members: { some: { employeeId: 10 } } },
        { followers: { some: { employeeId: 10 } } },
        { project: { supervisorId: 10 } },
      ],
    });
  });
});

describe("projectVisibilityWhere", () => {
  it("does not restrict users who can view everything", () => {
    expect(projectVisibilityWhere(actor({ canViewAll: true }))).toEqual({});
  });

  it("matches nothing for a user without an employee profile", () => {
    expect(projectVisibilityWhere(actor({ employeeId: null }))).toEqual({ id: -1 });
  });

  it("includes projects reachable through involvement in a task", () => {
    const where = projectVisibilityWhere(actor({ employeeId: 10 })) as { OR: unknown[] };
    expect(where.OR).toHaveLength(3);
    expect(where.OR[0]).toEqual({ supervisorId: 10 });
    expect(where.OR[1]).toEqual({ members: { some: { employeeId: 10 } } });
    expect(JSON.stringify(where.OR[2])).toContain('"followers":{"some":{"employeeId":10}}');
  });
});

describe("loadProjectAccess", () => {
  const prismaWithProject = (project: unknown) => ({ project: { findFirst: jest.fn().mockResolvedValue(project) } });
  const project = { id: 1, code: "hrm", supervisorId: 10, status: "active" };

  it("404s when the project is missing or invisible (no existence leak)", async () => {
    await expect(loadProjectAccess(prismaWithProject(null) as never, actor(), 1)).rejects.toMatchObject({ status: 404 });
  });

  it("scopes the lookup with the actor's visibility filter", async () => {
    const prisma = prismaWithProject(project);
    await loadProjectAccess(prisma as never, actor({ canViewAll: true }), 1);
    expect(prisma.project.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { AND: [{ id: 1 }, {}] } })
    );
  });

  it("grants admins manage + moderate + create-tasks", async () => {
    const a = await loadProjectAccess(
      prismaWithProject(project) as never,
      actor({ isAdmin: true, canViewAll: true, canAddTasks: true, employeeId: 99 }),
      1
    );
    expect(a).toMatchObject({ isSupervisor: false, canManage: true, canCreateTasks: true, canModerate: true });
  });

  it("lets the supervising employee moderate but not manage", async () => {
    const a = await loadProjectAccess(prismaWithProject(project) as never, actor({ employeeId: 10 }), 1);
    expect(a).toMatchObject({ isSupervisor: true, canManage: false, canCreateTasks: false, canModerate: true });
  });

  it("gives a plain member no elevated rights", async () => {
    const a = await loadProjectAccess(prismaWithProject(project) as never, actor({ employeeId: 11 }), 1);
    expect(a).toMatchObject({ isSupervisor: false, canManage: false, canModerate: false });
  });

  it("lets HR/Manager create tasks without managing", async () => {
    const a = await loadProjectAccess(
      prismaWithProject(project) as never,
      actor({ role: "HR", canViewAll: true, canAddTasks: true, employeeId: 11 }),
      1
    );
    expect(a).toMatchObject({ canManage: false, canCreateTasks: true, canModerate: false });
  });

  it("never treats an employee-less actor as supervisor", async () => {
    const a = await loadProjectAccess(
      prismaWithProject({ ...project, supervisorId: 0 }) as never,
      actor({ employeeId: null, canViewAll: true }),
      1
    );
    expect(a.isSupervisor).toBe(false);
  });
});
