import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import { PrismaClient, Prisma } from "../../../generated/tenant";
import {
  CreateEmployeeInput,
  DEFAULT_RESET_PASSWORD,
  EmployeeDto,
  PaginatedResult,
  ResetEmployeePasswordResponse,
  UpdateEmployeeInput,
} from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";
import { getStorageDriver } from "../../storage";
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
        phoneNumber: input.phoneNumber,
        gender: input.gender,
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
        jobTitle: input.jobTitle,
        joiningDate: new Date(input.joiningDate),
        employmentType: input.employmentType ?? "Full-Time",
        departmentId: input.departmentId ?? null,
        designationId: input.designationId ?? null,
        reportingToId: input.reportingToId ?? null,
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

  if (input.reportingToId === id) {
    throw ApiError.badRequest("An employee cannot report to themselves");
  }

  const employee = await prisma.employee.update({
    where: { id },
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      phoneNumber: input.phoneNumber,
      gender: input.gender,
      dateOfBirth: input.dateOfBirth === undefined ? undefined : input.dateOfBirth ? new Date(input.dateOfBirth) : null,
      jobTitle: input.jobTitle,
      terminationDate:
        input.terminationDate === undefined ? undefined : input.terminationDate ? new Date(input.terminationDate) : null,
      employmentType: input.employmentType,
      departmentId: input.departmentId,
      designationId: input.designationId,
      reportingToId: input.reportingToId,
      status: input.status,
    },
    include: employeeInclude,
  });

  if (input.status === "Inactive" && employee.userId) {
    await prisma.user.update({ where: { id: employee.userId }, data: { isActive: false } });
  }

  return toEmployeeDto(employee);
}

export async function resetEmployeePassword(
  prisma: PrismaClient,
  id: number
): Promise<ResetEmployeePasswordResponse> {
  const employee = await prisma.employee.findUnique({ where: { id } });
  if (!employee) {
    throw ApiError.notFound("Employee not found");
  }
  if (!employee.userId) {
    throw ApiError.badRequest("This employee has no login account");
  }

  const passwordHash = await bcrypt.hash(DEFAULT_RESET_PASSWORD, 10);
  await prisma.user.update({
    where: { id: employee.userId },
    data: { passwordHash, mustChangePassword: true },
  });

  return { newPassword: DEFAULT_RESET_PASSWORD };
}

export async function setEmployeeAvatar(
  prisma: PrismaClient,
  id: number,
  file: { buffer: Buffer; originalName: string; mimeType: string }
): Promise<EmployeeDto> {
  const existing = await prisma.employee.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Employee not found");
  }

  const storage = getStorageDriver();
  const stored = await storage.save({
    buffer: file.buffer,
    originalName: file.originalName,
    mimeType: file.mimeType,
    folder: "avatars",
  });

  if (existing.avatarKey) {
    await storage.delete(existing.avatarKey).catch(() => undefined);
  }

  const employee = await prisma.employee.update({
    where: { id },
    data: { avatarUrl: stored.url, avatarKey: stored.key },
    include: employeeInclude,
  });

  return toEmployeeDto(employee);
}
