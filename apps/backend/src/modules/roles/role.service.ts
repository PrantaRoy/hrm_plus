import { ROLES, CreateRoleInput, RoleDto, UpdateRoleInput } from "@hrm-plus/shared";
import { PrismaClient } from "../../../generated/tenant";
import { ApiError } from "../../utils/ApiError";

const SYSTEM_ROLES: readonly string[] = ROLES;

function isSystemRole(name: string): boolean {
  return SYSTEM_ROLES.includes(name);
}

function toRoleDto(role: {
  id: number;
  name: string;
  status: string;
  shortDescription: string | null;
}): RoleDto {
  return {
    id: role.id,
    name: role.name,
    status: role.status as RoleDto["status"],
    shortDescription: role.shortDescription,
    isSystem: isSystemRole(role.name),
  };
}

export async function listRoles(prisma: PrismaClient): Promise<RoleDto[]> {
  const roles = await prisma.role.findMany({ orderBy: { name: "asc" } });
  return roles.map(toRoleDto);
}

export async function getRoleById(prisma: PrismaClient, id: number): Promise<RoleDto> {
  const role = await prisma.role.findUnique({ where: { id } });
  if (!role) {
    throw ApiError.notFound("Role not found");
  }
  return toRoleDto(role);
}

export async function createRole(prisma: PrismaClient, input: CreateRoleInput): Promise<RoleDto> {
  const existing = await prisma.role.findUnique({ where: { name: input.name } });
  if (existing) {
    throw ApiError.conflict("A role with this name already exists");
  }

  const role = await prisma.role.create({
    data: {
      name: input.name,
      status: input.status ?? "Active",
      shortDescription: input.shortDescription ?? null,
    },
  });
  return toRoleDto(role);
}

export async function updateRole(
  prisma: PrismaClient,
  id: number,
  input: UpdateRoleInput
): Promise<RoleDto> {
  const existing = await prisma.role.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Role not found");
  }

  if (isSystemRole(existing.name) && input.name && input.name !== existing.name) {
    throw ApiError.forbidden("Cannot rename a built-in role");
  }

  const role = await prisma.role.update({
    where: { id },
    data: {
      name: input.name,
      status: input.status,
      shortDescription: input.shortDescription,
    },
  });
  return toRoleDto(role);
}

export async function deleteRole(prisma: PrismaClient, id: number): Promise<void> {
  const existing = await prisma.role.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Role not found");
  }

  if (isSystemRole(existing.name)) {
    throw ApiError.forbidden("Cannot delete a built-in role");
  }

  const usersWithRole = await prisma.user.count({ where: { roleId: id } });
  if (usersWithRole > 0) {
    throw ApiError.conflict("Role is assigned to existing users and cannot be deleted");
  }

  await prisma.role.delete({ where: { id } });
}
