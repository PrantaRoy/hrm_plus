import { Prisma } from "../../../generated/tenant";
import { EmployeeDto, isRoleName } from "@hrm-plus/shared";

const employeeWithRelations = Prisma.validator<Prisma.EmployeeDefaultArgs>()({
  include: {
    department: true,
    manager: true,
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
    jobTitle: employee.jobTitle,
    status: employee.status as EmployeeDto["status"],
    startDate: employee.startDate.toISOString(),
    departmentId: employee.departmentId,
    departmentName: employee.department?.name ?? null,
    managerId: employee.managerId,
    managerName: employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : null,
    role: roleName && isRoleName(roleName) ? roleName : null,
  };
}
