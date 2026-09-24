import crypto from "node:crypto";
import { PrismaClient } from "../../../generated/tenant";
import { AttendanceQrKioskSessionDto, AttendanceQrStaticTokenDto, AttendanceQrTokenDto } from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";
import { env } from "../../config/env";
import { generateQrCodeDataUri } from "../../pdf/qrCode";

const QR_TOKEN_TTL_SECONDS = 25;

// Derived rather than a dedicated env var: this token's trust boundary/lifetime is
// completely different from the JWT access/refresh secrets, but adding a new required
// env var would break every existing deployment/.env until updated, so we key off the
// existing access secret instead.
const QR_SIGNING_KEY = crypto.createHash("sha256").update(`${env.JWT_ACCESS_SECRET}:attendance-qr`).digest();

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", QR_SIGNING_KEY).update(payload).digest("base64url");
}

function generateQrToken(sessionId: number, jti: string, issuedAt: number): string {
  const payload = base64url(JSON.stringify({ sid: sessionId, jti, iat: issuedAt }));
  return `${payload}.${sign(payload)}`;
}

// A "static" token has no jti/expiry: it's meant to be printed and stuck on a wall, so it
// must keep working indefinitely rather than rotating like the live kiosk-screen token.
// Its only safeguard is that the backing session can be deactivated (see deactivateKioskSession)
// if the poster is lost/compromised — there is no per-scan replay protection.
function generateStaticQrToken(sessionId: number): string {
  const payload = base64url(JSON.stringify({ sid: sessionId, static: true }));
  return `${payload}.${sign(payload)}`;
}

function decodeToken(token: string): Record<string, unknown> | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expectedSignature = sign(payload);
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSignature);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

function toKioskSessionDto(session: { id: number; label: string | null; createdAt: Date }): AttendanceQrKioskSessionDto {
  return { id: session.id, label: session.label, createdAt: session.createdAt.toISOString() };
}

export async function createKioskSession(
  prisma: PrismaClient,
  label: string | undefined,
  createdById: number
): Promise<AttendanceQrKioskSessionDto> {
  const session = await prisma.attendanceQrSession.create({
    data: { label: label ?? null, createdById },
  });
  return toKioskSessionDto(session);
}

export async function getOrRotateKioskToken(prisma: PrismaClient, sessionId: number): Promise<AttendanceQrTokenDto> {
  const session = await prisma.attendanceQrSession.findUnique({ where: { id: sessionId } });
  if (!session || !session.isActive) {
    throw ApiError.notFound("Kiosk session not found");
  }

  const now = new Date();
  const stillValid = await prisma.attendanceQrToken.findFirst({
    where: { sessionId, usedAt: null, expiresAt: { gt: now } },
    orderBy: { issuedAt: "desc" },
  });

  const row =
    stillValid ??
    (await prisma.attendanceQrToken.create({
      data: {
        sessionId,
        jti: crypto.randomBytes(18).toString("base64url"),
        expiresAt: new Date(now.getTime() + QR_TOKEN_TTL_SECONDS * 1000),
      },
    }));

  const token = generateQrToken(row.sessionId, row.jti, row.issuedAt.getTime());
  const qrImageDataUri = await generateQrCodeDataUri(token);

  return { token, expiresAt: row.expiresAt.toISOString(), qrImageDataUri };
}

export async function getOrCreateStaticQrImage(prisma: PrismaClient, sessionId: number): Promise<AttendanceQrStaticTokenDto> {
  const session = await prisma.attendanceQrSession.findUnique({ where: { id: sessionId } });
  if (!session || !session.isActive) {
    throw ApiError.notFound("Kiosk session not found");
  }

  const token = generateStaticQrToken(sessionId);
  const qrImageDataUri = await generateQrCodeDataUri(token);
  return { token, qrImageDataUri };
}

export async function assertValidQrToken(
  prisma: PrismaClient,
  rawToken: string | undefined,
  employeeId: number,
  usedForMethod: "CheckIn" | "CheckOut"
): Promise<void> {
  if (!rawToken) {
    throw ApiError.badRequest("Scan the QR code displayed at the kiosk to continue");
  }

  const parsed = decodeToken(rawToken);
  if (!parsed) {
    throw ApiError.forbidden("Invalid QR code");
  }

  if (parsed.static === true) {
    if (typeof parsed.sid !== "number") {
      throw ApiError.forbidden("Invalid QR code");
    }
    const session = await prisma.attendanceQrSession.findUnique({ where: { id: parsed.sid } });
    if (!session || !session.isActive) {
      throw ApiError.forbidden("This QR code is no longer valid");
    }
    return;
  }

  if (typeof parsed.sid !== "number" || typeof parsed.jti !== "string") {
    throw ApiError.forbidden("Invalid QR code");
  }

  const row = await prisma.attendanceQrToken.findUnique({ where: { jti: parsed.jti } });
  if (!row || row.sessionId !== parsed.sid) {
    throw ApiError.forbidden("Invalid QR code");
  }
  if (row.expiresAt.getTime() < Date.now()) {
    throw ApiError.forbidden("This QR code has expired — scan the current code");
  }
  if (row.usedAt) {
    throw ApiError.forbidden("This QR code has already been used — scan the current code");
  }

  // Atomic claim: closes the check-then-act race between the findUnique above and this
  // update, so two near-simultaneous scans of the same code can't both succeed.
  const claimed = await prisma.attendanceQrToken.updateMany({
    where: { id: row.id, usedAt: null },
    data: { usedAt: new Date(), usedByEmployeeId: employeeId, usedForMethod },
  });
  if (claimed.count === 0) {
    throw ApiError.forbidden("This QR code has already been used — scan the current code");
  }
}
