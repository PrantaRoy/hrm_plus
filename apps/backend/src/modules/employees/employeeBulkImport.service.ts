import { Readable } from "stream";
import ExcelJS from "exceljs";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import { PrismaClient } from "../../../generated/tenant";
import {
  BulkImportEmployeesResult,
  BulkImportRowError,
  DEFAULT_RESET_PASSWORD,
  Gender,
  GENDER_CODE_MAP,
} from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";
import { employeeInclude, toEmployeeDto } from "./employee.mapper";

const TEMPLATE_HEADERS = [
  "First Name",
  "Last Name",
  "Email",
  "Phone Number",
  "Gender (M/F/O/N)",
  "Joining Date (YYYY-MM-DD)",
];

export function generateBulkImportTemplate(): { content: string; mimeType: string; fileName: string } {
  const exampleRow = ["Jane", "Doe", "jane.doe@example.com", "0211234567", "F", "2026-01-15"];
  const content = [TEMPLATE_HEADERS, exampleRow].map((line) => line.join(",")).join("\n");
  return {
    content,
    mimeType: "text/csv",
    fileName: "employee-bulk-import-template.csv",
  };
}

interface ParsedRow {
  rowNumber: number;
  data: Record<string, string>;
}

function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z]/g, "");
}

const FIELD_KEYS = {
  firstName: "firstname",
  lastName: "lastname",
  email: "email",
  phoneNumber: "phonenumber",
  gender: "gender",
  joiningDate: "joiningdate",
} as const;

function cellToString(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object" && "text" in (value as any)) return String((value as any).text ?? "").trim();
  if (typeof value === "object" && "result" in (value as any)) return String((value as any).result ?? "").trim();
  return String(value).trim();
}

export async function parseBulkImportFile(buffer: Buffer, originalName: string): Promise<ParsedRow[]> {
  const workbook = new ExcelJS.Workbook();
  const isCsv = originalName.toLowerCase().endsWith(".csv");
  if (isCsv) {
    await workbook.csv.read(Readable.from(buffer));
  } else {
    await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  }

  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];

  const headerRow = worksheet.getRow(1);
  const columnKeyByIndex = new Map<number, string>();
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    const normalized = normalizeHeader(cellToString(cell.value));
    const matchedKey = Object.values(FIELD_KEYS).find((key) => key === normalized);
    if (matchedKey) columnKeyByIndex.set(colNumber, matchedKey);
  });

  const rows: ParsedRow[] = [];
  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber);
    const data: Record<string, string> = {};
    let hasValue = false;
    columnKeyByIndex.forEach((key, colNumber) => {
      const value = cellToString(row.getCell(colNumber).value);
      if (value) hasValue = true;
      data[key] = value;
    });
    if (hasValue) rows.push({ rowNumber, data });
  }

  return rows;
}

export interface ValidBulkImportRow {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  gender: Gender | null;
  joiningDate: Date;
}

export function validateRows(
  parsedRows: ParsedRow[],
  existingEmails: Set<string>,
  existingPhones: Set<string>
): { validRows: ValidBulkImportRow[]; errors: BulkImportRowError[] } {
  const validRows: ValidBulkImportRow[] = [];
  const errors: BulkImportRowError[] = [];
  const seenEmails = new Set<string>();
  const seenPhones = new Set<string>();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  for (const { rowNumber, data } of parsedRows) {
    const messages: string[] = [];

    const firstName = data[FIELD_KEYS.firstName] ?? "";
    const lastName = data[FIELD_KEYS.lastName] ?? "";
    const email = (data[FIELD_KEYS.email] ?? "").toLowerCase();
    const phoneNumber = data[FIELD_KEYS.phoneNumber] || "";
    const genderCode = (data[FIELD_KEYS.gender] ?? "").toUpperCase();
    const joiningDateRaw = data[FIELD_KEYS.joiningDate] ?? "";

    if (!firstName) messages.push("First name is required");
    if (!lastName) messages.push("Last name is required");

    if (!email) {
      messages.push("Email is required");
    } else if (!emailPattern.test(email)) {
      messages.push(`Invalid email: ${email}`);
    } else if (seenEmails.has(email)) {
      messages.push(`Duplicate email within file: ${email}`);
    } else if (existingEmails.has(email)) {
      messages.push(`Email already in use: ${email}`);
    }

    if (phoneNumber) {
      if (seenPhones.has(phoneNumber)) {
        messages.push(`Duplicate phone number within file: ${phoneNumber}`);
      } else if (existingPhones.has(phoneNumber)) {
        messages.push(`Phone number already in use: ${phoneNumber}`);
      }
    }

    let gender: Gender | null = null;
    if (genderCode) {
      if (genderCode in GENDER_CODE_MAP) {
        gender = GENDER_CODE_MAP[genderCode as keyof typeof GENDER_CODE_MAP];
      } else {
        messages.push(`Invalid gender code: ${genderCode} (expected M, F, O, or N)`);
      }
    }

    let joiningDate: Date | null = null;
    if (!joiningDateRaw) {
      messages.push("Joining date is required");
    } else {
      const parsed = new Date(joiningDateRaw);
      if (Number.isNaN(parsed.getTime())) {
        messages.push(`Invalid joining date: ${joiningDateRaw}`);
      } else {
        joiningDate = parsed;
      }
    }

    if (messages.length > 0) {
      errors.push({ row: rowNumber, messages });
    } else {
      if (email) seenEmails.add(email);
      if (phoneNumber) seenPhones.add(phoneNumber);
      validRows.push({
        firstName,
        lastName,
        email,
        phoneNumber: phoneNumber || null,
        gender,
        joiningDate: joiningDate!,
      });
    }
  }

  return { validRows, errors };
}

export interface BulkImportEmployeesOptions {
  fileBuffer: Buffer;
  fileName: string;
  role: string;
  departmentId?: number | null;
  designationId?: number | null;
}

export async function bulkImportEmployees(
  prisma: PrismaClient,
  input: BulkImportEmployeesOptions
): Promise<BulkImportEmployeesResult> {
  const role = await prisma.role.findUnique({ where: { name: input.role } });
  if (!role) {
    throw ApiError.badRequest(`Unknown role: ${input.role}`);
  }

  if (input.departmentId != null) {
    const department = await prisma.department.findUnique({ where: { id: input.departmentId } });
    if (!department) throw ApiError.badRequest("Unknown department");
  }

  if (input.designationId != null) {
    const designation = await prisma.designation.findUnique({ where: { id: input.designationId } });
    if (!designation) throw ApiError.badRequest("Unknown designation");
  }

  const parsedRows = await parseBulkImportFile(input.fileBuffer, input.fileName);
  if (parsedRows.length === 0) {
    throw ApiError.badRequest("The uploaded file has no data rows");
  }

  const [existingUsers, existingEmployees] = await Promise.all([
    prisma.user.findMany({ select: { email: true } }),
    prisma.employee.findMany({ select: { phoneNumber: true } }),
  ]);
  const existingEmails = new Set(existingUsers.map((u) => u.email.toLowerCase()));
  const existingPhones = new Set(
    existingEmployees.map((e) => e.phoneNumber).filter((p): p is string => Boolean(p))
  );

  const { validRows, errors } = validateRows(parsedRows, existingEmails, existingPhones);

  if (errors.length > 0) {
    throw ApiError.badRequest("Validation failed", "BULK_IMPORT_VALIDATION_ERROR", {
      rowErrors: errors,
      totalRows: parsedRows.length,
    });
  }

  const passwordHash = await bcrypt.hash(DEFAULT_RESET_PASSWORD, 10);

  const employees = await prisma.$transaction(async (tx) => {
    const created = [];
    for (const row of validRows) {
      const employeeCode = `EMP-${nanoid(6).toUpperCase()}`;
      const user = await tx.user.create({
        data: { email: row.email, passwordHash, roleId: role.id, mustChangePassword: true },
      });
      const employee = await tx.employee.create({
        data: {
          employeeCode,
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.email,
          phoneNumber: row.phoneNumber,
          gender: row.gender,
          joiningDate: row.joiningDate,
          departmentId: input.departmentId ?? null,
          designationId: input.designationId ?? null,
          userId: user.id,
        },
        include: employeeInclude,
      });
      created.push(toEmployeeDto(employee));
    }
    return created;
  });

  return { createdCount: employees.length, employees };
}
