import bcrypt from "bcrypt";
import crypto from "node:crypto";
import { PrismaClient } from "../../../generated/tenant";
import { AuthUser, isRoleName, LoginResponse } from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";
import { signAccessToken } from "./jwt";
import { sendPasswordResetEmail } from "../notifications/email.service";

const PASSWORD_RESET_TTL_MS = 5 * 60 * 1000;

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

export async function requestPasswordReset(
  prisma: PrismaClient,
  email: string,
  buildResetUrl: (token: string) => string
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    return;
  }

  const token = crypto.randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
    },
  });

  await sendPasswordResetEmail(user.email, buildResetUrl(token));
}

export async function resetPassword(
  prisma: PrismaClient,
  token: string,
  newPassword: string
): Promise<void> {
  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    throw ApiError.badRequest("This reset link is invalid or has expired");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash, mustChangePassword: false },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
  ]);
}
