import bcrypt from "bcrypt";
import { PrismaClient } from "../../../generated/tenant";
import { AuthUser, isRoleName, LoginResponse } from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";
import { signAccessToken } from "./jwt";

export async function checkEmailExists(prisma: PrismaClient, email: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, isActive: true } });
  return Boolean(user && user.isActive);
}

export async function login(
  prisma: PrismaClient,
  tenantSlug: string,
  email: string,
  password: string
): Promise<LoginResponse> {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  });

  if (!user || !user.isActive) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  if (!isRoleName(user.role.name)) {
    throw ApiError.forbidden("User has an unrecognised role");
  }

  const employee = await prisma.employee.findUnique({ where: { userId: user.id } });

  const authUser: AuthUser = {
    id: user.id,
    email: user.email,
    firstName: employee?.firstName ?? "",
    lastName: employee?.lastName ?? "",
    role: user.role.name,
  };

  const accessToken = signAccessToken({
    sub: user.id,
    tenantSlug,
    role: user.role.name,
    email: user.email,
  });

  return { accessToken, user: authUser, tenantSlug, mustChangePassword: user.mustChangePassword };
}

export async function changePassword(
  prisma: PrismaClient,
  userId: number,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw ApiError.unauthorized();
  }

  const matches = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!matches) {
    throw ApiError.unauthorized("Current password is incorrect");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, mustChangePassword: false },
  });
}
