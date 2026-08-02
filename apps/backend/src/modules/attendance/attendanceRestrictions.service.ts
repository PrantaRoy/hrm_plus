import ipaddr from "ipaddr.js";
import { PrismaClient } from "../../../generated/tenant";
import {
  EmployeeAttendanceDeviceDto,
  EmployeeAttendanceRulesDto,
  SetEmployeeAttendanceRulesInput,
} from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";
import { toEmployeeAttendanceDeviceDto, toEmployeeAttendanceRulesDto } from "./attendance.mapper";

const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

// Great-circle distance between two lat/lng points, in meters.
function haversineDistanceMeters(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLng = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
}

function ipMatchesCidr(ip: string, cidr: string): boolean {
  try {
    const parsedIp = ipaddr.process(ip);
    const [rangeAddr, bits] = ipaddr.parseCIDR(cidr);
    if (parsedIp instanceof ipaddr.IPv4 && rangeAddr instanceof ipaddr.IPv4) {
      return parsedIp.match(rangeAddr, bits);
    }
    if (parsedIp instanceof ipaddr.IPv6 && rangeAddr instanceof ipaddr.IPv6) {
      return parsedIp.match(rangeAddr, bits);
    }
    return false;
  } catch {
    return false;
  }
}

export async function getEmployeeRules(prisma: PrismaClient, employeeId: number): Promise<EmployeeAttendanceRulesDto> {
  const [rules, ipRules, locations] = await Promise.all([
    prisma.employeeAttendanceRules.findUnique({ where: { employeeId } }),
    prisma.employeeAttendanceIpRule.findMany({ where: { employeeId } }),
    prisma.employeeAttendanceLocation.findMany({ where: { employeeId } }),
  ]);
  return toEmployeeAttendanceRulesDto(
    employeeId,
    rules,
    ipRules.map((r) => r.ipRuleId),
    locations.map((l) => l.locationId)
  );
}

export async function setEmployeeRules(
  prisma: PrismaClient,
  employeeId: number,
  input: SetEmployeeAttendanceRulesInput
): Promise<EmployeeAttendanceRulesDto> {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) {
    throw ApiError.notFound("Employee not found");
  }

  await prisma.$transaction([
    prisma.employeeAttendanceRules.upsert({
      where: { employeeId },
      create: {
        employeeId,
        ipBindingEnabled: input.ipBindingEnabled,
        locationBindingEnabled: input.locationBindingEnabled,
        deviceBindingEnabled: input.deviceBindingEnabled,
      },
      update: {
        ipBindingEnabled: input.ipBindingEnabled,
        locationBindingEnabled: input.locationBindingEnabled,
        deviceBindingEnabled: input.deviceBindingEnabled,
      },
    }),
    prisma.employeeAttendanceIpRule.deleteMany({ where: { employeeId } }),
    prisma.employeeAttendanceIpRule.createMany({
      data: input.ipRuleIds.map((ipRuleId) => ({ employeeId, ipRuleId })),
    }),
    prisma.employeeAttendanceLocation.deleteMany({ where: { employeeId } }),
    prisma.employeeAttendanceLocation.createMany({
      data: input.locationIds.map((locationId) => ({ employeeId, locationId })),
    }),
  ]);

  return getEmployeeRules(prisma, employeeId);
}

export async function listEmployeeDevices(prisma: PrismaClient, employeeId: number): Promise<EmployeeAttendanceDeviceDto[]> {
  const devices = await prisma.employeeAttendanceDevice.findMany({
    where: { employeeId },
    orderBy: { requestedAt: "desc" },
  });
  return devices.map(toEmployeeAttendanceDeviceDto);
}

export async function approveDevice(
  prisma: PrismaClient,
  employeeId: number,
  deviceId: number,
  approvedById: number
): Promise<EmployeeAttendanceDeviceDto> {
  const device = await prisma.employeeAttendanceDevice.findUnique({ where: { id: deviceId } });
  if (!device || device.employeeId !== employeeId) {
    throw ApiError.notFound("Device not found");
  }
  const updated = await prisma.employeeAttendanceDevice.update({
    where: { id: deviceId },
    data: { status: "Approved", approvedById, approvedAt: new Date() },
  });
  return toEmployeeAttendanceDeviceDto(updated);
}

export async function rejectDevice(
  prisma: PrismaClient,
  employeeId: number,
  deviceId: number
): Promise<EmployeeAttendanceDeviceDto> {
  const device = await prisma.employeeAttendanceDevice.findUnique({ where: { id: deviceId } });
  if (!device || device.employeeId !== employeeId) {
    throw ApiError.notFound("Device not found");
  }
  const updated = await prisma.employeeAttendanceDevice.update({
    where: { id: deviceId },
    data: { status: "Rejected", approvedById: null, approvedAt: null },
  });
  return toEmployeeAttendanceDeviceDto(updated);
}

export interface RestrictionCheckInput {
  ip: string | null;
  deviceToken?: string;
  latitude?: number;
  longitude?: number;
}

// Called from both checkIn() and checkOut() right after method validation.
// Throws ApiError on the first failing rule.
export async function enforceAttendanceRestrictions(
  prisma: PrismaClient,
  employeeId: number,
  input: RestrictionCheckInput
): Promise<void> {
  const rules = await prisma.employeeAttendanceRules.findUnique({ where: { employeeId } });
  if (!rules) return;

  if (rules.ipBindingEnabled) {
    const assigned = await prisma.employeeAttendanceIpRule.findMany({
      where: { employeeId },
      include: { ipRule: true },
    });
    const activeRules = assigned.map((a) => a.ipRule).filter((r) => r.status === "Active");
    if (activeRules.length === 0) {
      throw ApiError.conflict("IP binding is enabled for you but no networks are configured; contact HR");
    }
    if (!input.ip) {
      throw ApiError.forbidden("Could not determine your network address");
    }
    const matches = activeRules.some((rule) => ipMatchesCidr(input.ip!, rule.cidr));
    if (!matches) {
      throw ApiError.forbidden("You must check in from an approved network");
    }
  }

  if (rules.locationBindingEnabled) {
    const assigned = await prisma.employeeAttendanceLocation.findMany({
      where: { employeeId },
      include: { location: true },
    });
    const activeLocations = assigned.map((a) => a.location).filter((l) => l.status === "Active");
    if (activeLocations.length === 0) {
      throw ApiError.conflict("Location binding is enabled for you but no locations are configured; contact HR");
    }
    if (input.latitude === undefined || input.longitude === undefined) {
      throw ApiError.badRequest("Location is required to check in. Please allow location access.");
    }
    const here = { latitude: input.latitude, longitude: input.longitude };
    let nearest = activeLocations[0];
    let nearestDistance = Infinity;
    let withinAny = false;
    for (const location of activeLocations) {
      const distance = haversineDistanceMeters(here, location);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = location;
      }
      if (distance <= location.radiusMeters) {
        withinAny = true;
      }
    }
    if (!withinAny) {
      throw ApiError.forbidden(
        `You are outside the allowed check-in location (must be within ${nearest.radiusMeters}m of ${nearest.name})`
      );
    }
  }

  if (rules.deviceBindingEnabled) {
    if (!input.deviceToken) {
      throw ApiError.badRequest("Device verification is required. Please reload the app and try again.");
    }
    const fingerprint = input.deviceToken.slice(-4).toUpperCase();
    const existing = await prisma.employeeAttendanceDevice.findUnique({ where: { deviceToken: input.deviceToken } });

    if (!existing) {
      await prisma.employeeAttendanceDevice.create({
        data: {
          employeeId,
          deviceToken: input.deviceToken,
          status: "Pending",
          lastSeenAt: new Date(),
          lastSeenIp: input.ip,
        },
      });
      throw ApiError.forbidden(`This device is not yet approved (device ending in ${fingerprint}). Ask HR to approve it.`);
    }

    if (existing.employeeId !== employeeId) {
      throw ApiError.forbidden("This device is registered to a different account");
    }

    await prisma.employeeAttendanceDevice.update({
      where: { id: existing.id },
      data: { lastSeenAt: new Date(), lastSeenIp: input.ip },
    });

    if (existing.status === "Pending") {
      throw ApiError.forbidden(`This device is not yet approved (device ending in ${fingerprint}). Ask HR to approve it.`);
    }
    if (existing.status === "Rejected") {
      throw ApiError.forbidden("This device has been blocked for attendance. Contact HR.");
    }
  }
}
