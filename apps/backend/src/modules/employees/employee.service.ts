import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import { PrismaClient, Prisma } from "../../../generated/tenant";
import { CreateEmployeeInput, EmployeeDto, PaginatedResult, UpdateEmployeeInput } from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";
import { employeeInclude, toEmployeeDto } from "./employee.mapper";

export interface ListEmployeesOptions {
  page: number;
  pageSize: number;
  search?: string;
  departmentId?: number;
}

export async function listEmployees(
  prisma: PrismaClient,
  options: ListEmployeesOptions
): Promise<PaginatedResult<EmployeeDto>> {
  const where: Prisma.EmployeeWhereInput = {
    ...(options.departmentId ? { departmentId: options.departmentId } : {}),
    ...(options.search
      ? {
          OR: [
            { firstName: { contains: options.search } },
            { lastName: { contains: options.search } },
            { email: { contains: options.search } },
            { employeeCode: { contains: options.search } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      include: employeeInclude,
      orderBy: { createdAt: "desc" },
      skip: (options.page - 1) * options.pageSize,
      take: options.pageSize,
    }),
    prisma.employee.count({ where }),
  ]);

  return {
    items: items.map(toEmployeeDto),
    total,
    page: options.page,
    pageSize: options.pageSize,
  };
}

export async function getEmployeeById(prisma: PrismaClient, id: number): Promise<EmployeeDto> {
  const employee = await prisma.employee.findUnique({ where: { id }, include: employeeInclude });
  if (!employee) {
    throw ApiError.notFound("Employee not found");
  }
  return toEmployeeDto(employee);
}

export async function createEmployee(
  prisma: PrismaClient,
  input: CreateEmployeeInput
): Promise<EmployeeDto> {
  const role = await prisma.role.findUnique({ where: { name: input.role } });
  if (!role) {
    throw ApiError.badRequest(`Unknown role: ${input.role}`);
  }

  const existingUser = await prisma.user.findUnique({ where: { email: input.email } });
  if (existingUser) {
    throw ApiError.conflict("A user with this email already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const employeeCode = `EMP-${nanoid(6).toUpperCase()}`;

  const employee = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email: input.email, passwordHash, roleId: role.id },
    });

    return tx.employee.create({
      data: {
        employeeCode,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        jobTitle: input.jobTitle,
        startDate: new Date(input.startDate),
        departmentId: input.departmentId ?? null,
        managerId: input.managerId ?? null,
        userId: user.id,
      },
      include: employeeInclude,
    });
  });

  return toEmployeeDto(employee);
}

export async function updateEmployee(
  prisma: PrismaClient,
  id: number,
  input: UpdateEmployeeInput
): Promise<EmployeeDto> {
  const existing = await prisma.employee.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Employee not found");
  }

  if (input.managerId === id) {
    throw ApiError.badRequest("An employee cannot be their own manager");
  }

  const employee = await prisma.employee.update({
    where: { id },
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      jobTitle: input.jobTitle,
      departmentId: input.departmentId,
      managerId: input.managerId,
      status: input.status,
    },
    include: employeeInclude,
  });

  if (input.status === "Inactive" && employee.userId) {
    await prisma.user.update({ where: { id: employee.userId }, data: { isActive: false } });
  }

  return toEmployeeDto(employee);
}
