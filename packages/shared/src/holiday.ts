export const HOLIDAY_SOURCES = ["Manual", "NZ", "AU"] as const;
export type HolidaySource = (typeof HOLIDAY_SOURCES)[number];

export const HOLIDAY_STATUSES = ["Draft", "Published"] as const;
export type HolidayStatus = (typeof HOLIDAY_STATUSES)[number];

export interface HolidayDto {
  id: number;
  name: string;
  date: string;
  year: number;
  source: HolidaySource;
  status: HolidayStatus;
  notes: string | null;
  createdById: number;
  createdByName: string | null;
  publishedById: number | null;
  publishedByName: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHolidayInput {
  name: string;
  date: string;
  notes?: string | null;
}

export type UpdateHolidayInput = Partial<CreateHolidayInput>;

export interface ImportHolidaysInput {
  country: "NZ" | "AU";
  year: number;
}

export interface ImportHolidaysResult {
  imported: number;
  skipped: number;
  holidays: HolidayDto[];
}

export interface PublishYearInput {
  year: number;
}

export interface PublishYearResult {
  published: number;
}

export interface ListHolidaysQuery {
  year?: number;
  status?: HolidayStatus;
}
