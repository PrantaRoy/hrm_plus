import { PrismaClient, Prisma } from "../../../generated/tenant";
import {
  CreateHolidayInput,
  HolidayDto,
  ImportHolidaysResult,
  PublishYearResult,
  UpdateHolidayInput,
} from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";
import { holidayInclude, toHolidayDto } from "./holiday.mapper";

export interface ListHolidaysOptions {
  year?: number;
  status?: string;
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function listHolidays(prisma: PrismaClient, options: ListHolidaysOptions): Promise<HolidayDto[]> {
  const where: Prisma.HolidayWhereInput = {
    ...(options.year ? { year: options.year } : {}),
    ...(options.status ? { status: options.status } : {}),
  };

  const holidays = await prisma.holiday.findMany({
    where,
    include: holidayInclude,
    orderBy: { date: "asc" },
  });

  return holidays.map(toHolidayDto);
}

export async function getHolidayById(prisma: PrismaClient, id: number): Promise<HolidayDto> {
  const holiday = await prisma.holiday.findUnique({ where: { id }, include: holidayInclude });
  if (!holiday) {
    throw ApiError.notFound("Holiday not found");
  }
  return toHolidayDto(holiday);
}

export async function createHoliday(
  prisma: PrismaClient,
  input: CreateHolidayInput,
  createdById: number
): Promise<HolidayDto> {
  const date = new Date(input.date);
  try {
    const holiday = await prisma.holiday.create({
      data: {
        name: input.name,
        date,
        year: date.getUTCFullYear(),
        source: "Manual",
        status: "Draft",
        notes: input.notes ?? null,
        createdById,
      },
      include: holidayInclude,
    });
    return toHolidayDto(holiday);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw ApiError.conflict("A holiday already exists on this date");
    }
    throw err;
  }
}

export async function updateHoliday(
  prisma: PrismaClient,
  id: number,
  input: UpdateHolidayInput,
  updatedById: number
): Promise<HolidayDto> {
  const existing = await prisma.holiday.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Holiday not found");
  }
  if (existing.status !== "Draft") {
    throw ApiError.conflict("Only draft holidays can be edited");
  }

  const date = input.date ? new Date(input.date) : undefined;

  try {
    const holiday = await prisma.holiday.update({
      where: { id },
      data: {
        name: input.name,
        date,
        year: date ? date.getUTCFullYear() : undefined,
        notes: input.notes,
        updatedById,
      },
      include: holidayInclude,
    });
    return toHolidayDto(holiday);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw ApiError.conflict("A holiday already exists on this date");
    }
    throw err;
  }
}

export async function deleteHoliday(prisma: PrismaClient, id: number): Promise<void> {
  const existing = await prisma.holiday.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Holiday not found");
  }
  if (existing.status !== "Draft") {
    throw ApiError.conflict("Only draft holidays can be deleted");
  }
  await prisma.holiday.delete({ where: { id } });
}

export async function publishHoliday(
  prisma: PrismaClient,
  id: number,
  publishedById: number
): Promise<HolidayDto> {
  const existing = await prisma.holiday.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Holiday not found");
  }
  if (existing.status === "Published") {
    throw ApiError.conflict("Holiday is already published");
  }

  const holiday = await prisma.holiday.update({
    where: { id },
    data: { status: "Published", publishedById, publishedAt: new Date() },
    include: holidayInclude,
  });
  return toHolidayDto(holiday);
}

export async function unpublishHoliday(
  prisma: PrismaClient,
  id: number,
  updatedById: number
): Promise<HolidayDto> {
  const existing = await prisma.holiday.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Holiday not found");
  }
  if (existing.status === "Draft") {
    throw ApiError.conflict("Holiday is already a draft");
  }

  const holiday = await prisma.holiday.update({
    where: { id },
    data: { status: "Draft", publishedById: null, publishedAt: null, updatedById },
    include: holidayInclude,
  });
  return toHolidayDto(holiday);
}

export async function publishYear(
  prisma: PrismaClient,
  year: number,
  publishedById: number
): Promise<PublishYearResult> {
  const result = await prisma.holiday.updateMany({
    where: { year, status: "Draft" },
    data: { status: "Published", publishedById, publishedAt: new Date() },
  });
  return { published: result.count };
}

interface NagerHoliday {
  date: string;
  name: string;
  localName?: string;
}

export async function importHolidays(
  prisma: PrismaClient,
  country: "NZ" | "AU",
  year: number,
  createdById: number
): Promise<ImportHolidaysResult> {
  let response: Response;
  try {
    response = await fetch(`https://nagerholidays.com/api/v4/Holidays/${country}/${year}`);
  } catch {
    throw new ApiError(502, "Could not reach the holiday data provider. Please try again later.", "UPSTREAM_ERROR");
  }

  if (!response.ok) {
    throw new ApiError(502, "Could not reach the holiday data provider. Please try again later.", "UPSTREAM_ERROR");
  }

  const items = (await response.json()) as NagerHoliday[];

  let imported = 0;
  let skipped = 0;
  const holidays: HolidayDto[] = [];

  for (const item of items) {
    const date = new Date(item.date);
    try {
      const holiday = await prisma.holiday.create({
        data: {
          name: item.name,
          date,
          year: date.getUTCFullYear(),
          source: country,
          status: "Draft",
          createdById,
        },
        include: holidayInclude,
      });
      holidays.push(toHolidayDto(holiday));
      imported += 1;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        skipped += 1;
        continue;
      }
      throw err;
    }
  }

  return { imported, skipped, holidays };
}

export async function getCalendar(
  prisma: PrismaClient,
  startDate?: string,
  endDate?: string
): Promise<HolidayDto[]> {
  const holidays = await prisma.holiday.findMany({
    where: {
      status: "Published",
      ...(startDate || endDate
        ? {
            date: {
              ...(startDate ? { gte: new Date(startDate) } : {}),
              ...(endDate ? { lte: new Date(endDate) } : {}),
            },
          }
        : {}),
    },
    include: holidayInclude,
    orderBy: { date: "asc" },
  });
  return holidays.map(toHolidayDto);
}

export async function getPublishedHolidaysInRange(
  prisma: PrismaClient,
  startDate: Date,
  endDate: Date
): Promise<Map<string, { id: number; name: string }>> {
  const holidays = await prisma.holiday.findMany({
    where: { status: "Published", date: { gte: startDate, lte: endDate } },
  });
  const map = new Map<string, { id: number; name: string }>();
  for (const holiday of holidays) {
    map.set(toDateKey(holiday.date), { id: holiday.id, name: holiday.name });
  }
  return map;
}

export async function getPublishedHolidayForDate(
  prisma: PrismaClient,
  date: Date
): Promise<{ id: number; name: string } | null> {
  const dayStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayEnd = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));
  const holiday = await prisma.holiday.findFirst({
    where: { status: "Published", date: { gte: dayStart, lte: dayEnd } },
  });
  return holiday ? { id: holiday.id, name: holiday.name } : null;
}
