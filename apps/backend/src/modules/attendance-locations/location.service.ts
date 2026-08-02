import { PrismaClient } from "../../../generated/tenant";
import { AttendanceLocationDto, CreateAttendanceLocationInput, UpdateAttendanceLocationInput } from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";

function toLocationDto(location: {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  status: string;
}): AttendanceLocationDto {
  return {
    id: location.id,
    name: location.name,
    latitude: location.latitude,
    longitude: location.longitude,
    radiusMeters: location.radiusMeters,
    status: location.status as AttendanceLocationDto["status"],
  };
}

export async function listLocations(prisma: PrismaClient): Promise<AttendanceLocationDto[]> {
  const locations = await prisma.attendanceLocation.findMany({ orderBy: { name: "asc" } });
  return locations.map(toLocationDto);
}

export async function createLocation(
  prisma: PrismaClient,
  input: CreateAttendanceLocationInput
): Promise<AttendanceLocationDto> {
  const location = await prisma.attendanceLocation.create({
    data: {
      name: input.name,
      latitude: input.latitude,
      longitude: input.longitude,
      radiusMeters: input.radiusMeters,
      status: input.status ?? "Active",
    },
  });
  return toLocationDto(location);
}

export async function updateLocation(
  prisma: PrismaClient,
  id: number,
  input: UpdateAttendanceLocationInput
): Promise<AttendanceLocationDto> {
  const existing = await prisma.attendanceLocation.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Location not found");
  }

  const location = await prisma.attendanceLocation.update({
    where: { id },
    data: {
      name: input.name,
      latitude: input.latitude,
      longitude: input.longitude,
      radiusMeters: input.radiusMeters,
      status: input.status,
    },
  });
  return toLocationDto(location);
}

export async function deleteLocation(prisma: PrismaClient, id: number): Promise<void> {
  const existing = await prisma.attendanceLocation.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Location not found");
  }
  await prisma.attendanceLocation.delete({ where: { id } });
}
