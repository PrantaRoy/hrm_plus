import { PrismaClient } from "../../../generated/tenant";
import { DepartmentDto } from "@hrm-plus/shared";

export async function listDepartments(prisma: PrismaClient): Promise<DepartmentDto[]> {
  const departments = await prisma.department.findMany({ orderBy: { name: "asc" } });
  return departments.map((d) => ({
    id: d.id,
    name: d.name,
    parentDepartmentId: d.parentDepartmentId,
  }));
}

export async function createDepartment(
  prisma: PrismaClient,
  input: { name: string; parentDepartmentId?: number | null }
): Promise<DepartmentDto> {
  const department = await prisma.department.create({
    data: { name: input.name, parentDepartmentId: input.parentDepartmentId ?? null },
  });
  return { id: department.id, name: department.name, parentDepartmentId: department.parentDepartmentId };
}
