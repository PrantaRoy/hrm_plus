import ipaddr from "ipaddr.js";
import { PrismaClient } from "../../../generated/tenant";
import { AttendanceIpRuleDto, CreateAttendanceIpRuleInput, UpdateAttendanceIpRuleInput } from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";

// Accepts a bare IP ("203.0.113.5") or CIDR notation ("203.0.113.0/24") and
// normalizes to CIDR so matching at check-in time always uses ipaddr.parseCIDR.
export function normalizeCidr(value: string): string {
  const trimmed = value.trim();
  if (trimmed.includes("/")) {
    try {
      ipaddr.parseCIDR(trimmed);
      return trimmed;
    } catch {
      throw ApiError.badRequest(`Invalid CIDR: "${value}"`);
    }
  }
  if (!ipaddr.isValid(trimmed)) {
    throw ApiError.badRequest(`Invalid IP address: "${value}"`);
  }
  const kind = ipaddr.parse(trimmed).kind();
  return `${trimmed}/${kind === "ipv6" ? 128 : 32}`;
}

function toIpRuleDto(rule: { id: number; label: string; cidr: string; status: string }): AttendanceIpRuleDto {
  return {
    id: rule.id,
    label: rule.label,
    cidr: rule.cidr,
    status: rule.status as AttendanceIpRuleDto["status"],
  };
}

export async function listIpRules(prisma: PrismaClient): Promise<AttendanceIpRuleDto[]> {
  const rules = await prisma.attendanceIpRule.findMany({ orderBy: { label: "asc" } });
  return rules.map(toIpRuleDto);
}

export async function createIpRule(prisma: PrismaClient, input: CreateAttendanceIpRuleInput): Promise<AttendanceIpRuleDto> {
  const rule = await prisma.attendanceIpRule.create({
    data: {
      label: input.label,
      cidr: normalizeCidr(input.cidr),
      status: input.status ?? "Active",
    },
  });
  return toIpRuleDto(rule);
}

export async function updateIpRule(
  prisma: PrismaClient,
  id: number,
  input: UpdateAttendanceIpRuleInput
): Promise<AttendanceIpRuleDto> {
  const existing = await prisma.attendanceIpRule.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("IP rule not found");
  }

  const rule = await prisma.attendanceIpRule.update({
    where: { id },
    data: {
      label: input.label,
      cidr: input.cidr !== undefined ? normalizeCidr(input.cidr) : undefined,
      status: input.status,
    },
  });
  return toIpRuleDto(rule);
}

export async function deleteIpRule(prisma: PrismaClient, id: number): Promise<void> {
  const existing = await prisma.attendanceIpRule.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("IP rule not found");
  }
  await prisma.attendanceIpRule.delete({ where: { id } });
}
