import { PrismaClient } from "../../../generated/tenant";
import { CreateDepartmentInput, DepartmentDto, UpdateDepartmentInput } from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";

function toDepartmentDto(department: {
  id: number;
  name: string;
  status: string;
  shortDescription: string | null;
  parentDepartmentId: number | null;
}): DepartmentDto {
  return {
    id: department.id,
    name: department.name,
    status: department.status as DepartmentDto["status"],
    shortDescription: department.shortDescription,
    parentDepartmentId: department.parentDepartmentId,
  };
}

export async function listDepartments(prisma: PrismaClient): Promise<DepartmentDto[]> {
  const departments = await prisma.department.findMany({ orderBy: { name: "asc" } });
  return departments.map(toDepartmentDto);
}

export async function getDepartmentById(prisma: PrismaClient, id: number): Promise<DepartmentDto> {
  const department = await prisma.department.findUnique({ where: { id } });
  if (!department) {
    throw ApiError.notFound("Department not found");
  }
  return toDepartmentDto(department);
}

export async function createDepartment(
  prisma: PrismaClient,
  input: CreateDepartmentInput
): Promise<DepartmentDto> {
  const department = await prisma.department.create({
    data: {
      name: input.name,
      status: input.status ?? "Active",
      shortDescription: input.shortDescription ?? null,
      parentDepartmentId: input.parentDepartmentId ?? null,
    },
  });
  return toDepartmentDto(department);
}

export async function updateDepartment(
  prisma: PrismaClient,
  id: number,
  input: UpdateDepartmentInput
): Promise<DepartmentDto> {
  const existing = await prisma.department.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Department not found");
  }

  if (input.parentDepartmentId === id) {
    throw ApiError.badRequest("A department cannot be its own parent");
  }

  const department = await prisma.department.update({
    where: { id },
    data: {
      name: input.name,
      status: input.status,
      shortDescription: input.shortDescription,
      parentDepartmentId: input.parentDepartmentId,
    },
  });
  return toDepartmentDto(department);
}

export async function deleteDepartment(prisma: PrismaClient, id: number): Promise<void> {
  const existing = await prisma.department.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Department not found");
  }

  const [employeeCount, childCount] = await Promise.all([
    prisma.employee.count({ where: { departmentId: id } }),
    prisma.department.count({ where: { parentDepartmentId: id } }),
  ]);

  if (employeeCount > 0) {
    throw ApiError.conflict("Department has employees assigned and cannot be deleted");
  }
  if (childCount > 0) {
    throw ApiError.conflict("Department has sub-departments and cannot be deleted");
  }

  await prisma.department.delete({ where: { id } });
}
