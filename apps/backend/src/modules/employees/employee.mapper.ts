import { Prisma } from "../../../generated/tenant";
import { EmployeeDto, isRoleName } from "@hrm-plus/shared";

const employeeWithRelations = Prisma.validator<Prisma.EmployeeDefaultArgs>()({
  include: {
    department: true,
    designation: true,
    reportingTo: true,
    user: { include: { role: true } },
  },
});

export type EmployeeWithRelations = Prisma.EmployeeGetPayload<typeof employeeWithRelations>;

export const employeeInclude = employeeWithRelations.include;

export function toEmployeeDto(employee: EmployeeWithRelations): EmployeeDto {
  const roleName = employee.user?.role.name;
  return {
    id: employee.id,
    employeeCode: employee.employeeCode,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    phoneNumber: employee.phoneNumber,
    gender: employee.gender as EmployeeDto["gender"],
    dateOfBirth: employee.dateOfBirth ? employee.dateOfBirth.toISOString() : null,
    jobTitle: employee.jobTitle,
    status: employee.status as EmployeeDto["status"],
    joiningDate: employee.joiningDate.toISOString(),
    terminationDate: employee.terminationDate ? employee.terminationDate.toISOString() : null,
    employmentType: employee.employmentType as EmployeeDto["employmentType"],
    irdNumber: employee.irdNumber,
    bankName: employee.bankName,
    bankAccountNumber: employee.bankAccountNumber,
    avatarUrl: employee.avatarUrl,
    departmentId: employee.departmentId,
    departmentName: employee.department?.name ?? null,
    designationId: employee.designationId,
    designationName: employee.designation?.name ?? null,
    reportingToId: employee.reportingToId,
    reportingToName: employee.reportingTo
      ? `${employee.reportingTo.firstName} ${employee.reportingTo.lastName}`
      : null,
    role: roleName && isRoleName(roleName) ? roleName : null,
  };
}
