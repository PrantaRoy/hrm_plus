export const PAY_CYCLE_FREQUENCIES = ["WEEKLY", "FORTNIGHTLY", "MONTHLY"] as const;
export type PayCycleFrequency = (typeof PAY_CYCLE_FREQUENCIES)[number];

export const PAY_RATE_TYPES = ["HOURLY", "SALARY"] as const;
export type PayRateType = (typeof PAY_RATE_TYPES)[number];

export const WORK_REPORT_STATUSES = ["DRAFT", "HR_APPROVED", "PAYROLL_PROCESSED"] as const;
export type WorkReportStatus = (typeof WORK_REPORT_STATUSES)[number];

export const PAYROLL_RUN_STATUSES = ["DRAFT", "PENDING_PAYMENT", "PAID", "REJECTED"] as const;
export type PayrollRunStatus = (typeof PAYROLL_RUN_STATUSES)[number];

export const PAYSLIP_STATUSES = ["DRAFT", "PUBLISHED"] as const;
export type PayslipStatus = (typeof PAYSLIP_STATUSES)[number];

export const PAYROLL_REGIONS = ["NZ", "AU"] as const;
export type PayrollRegion = (typeof PAYROLL_REGIONS)[number];

export const BANK_EXPORT_FORMATS = ["NZ_DIRECT_CREDIT_CSV", "AU_ABA"] as const;
export type BankExportFormat = (typeof BANK_EXPORT_FORMATS)[number];

export interface PayCycleDto {
  id: number;
  name: string;
  frequency: PayCycleFrequency;
  status: "Active" | "Inactive";
  employeeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePayCycleInput {
  name: string;
  frequency: PayCycleFrequency;
}

export interface UpdatePayCycleInput {
  name?: string;
  frequency?: PayCycleFrequency;
  status?: "Active" | "Inactive";
}

export interface EmployeePayRateDto {
  id: number;
  employeeId: number;
  employeeName: string;
  rateType: PayRateType;
  baseRate: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeePayRateInput {
  employeeId: number;
  rateType: PayRateType;
  baseRate: number;
  effectiveFrom: string;
  effectiveTo?: string | null;
}

export interface PayrollSettingsDto {
  overtimeMultiplier: number;
  region: PayrollRegion;
  updatedAt: string;
}

export interface UpdatePayrollSettingsInput {
  overtimeMultiplier?: number;
  region?: PayrollRegion;
}

export interface WorkReportDto {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  periodStart: string;
  periodEnd: string;
  totalHours: number;
  regularHours: number;
  extraHours: number;
  status: WorkReportStatus;
  approvedById: number | null;
  approvedByName: string | null;
  approvedAt: string | null;
  payslipId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateWorkReportsInput {
  payCycleId: number;
  periodStart: string;
  periodEnd: string;
}

export interface UpdateWorkReportInput {
  regularHours: number;
  extraHours: number;
}

export interface ListWorkReportsQuery {
  status?: WorkReportStatus;
  employeeId?: number;
  payCycleId?: number;
}

export interface PayslipLineItemDto {
  id: number;
  description: string;
  hours: number;
  rate: number;
  total: number;
}

export interface PayslipDto {
  id: number;
  payrollRunId: number;
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  grossPay: number;
  taxDeductions: number;
  netPay: number;
  status: PayslipStatus;
  pdfUrl: string | null;
  lineItems: PayslipLineItemDto[];
  createdAt: string;
  updatedAt: string;
}

export interface PayrollRunDto {
  id: number;
  payCycleId: number;
  payCycleName: string;
  periodStart: string;
  periodEnd: string;
  paymentDate: string;
  status: PayrollRunStatus;
  totalGrossPay: number;
  totalNetPay: number;
  payslipCount: number;
  processedById: number;
  processedByName: string;
  submittedById: number | null;
  submittedByName: string | null;
  submittedAt: string | null;
  decidedById: number | null;
  decidedByName: string | null;
  decidedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateDraftPayrollRunInput {
  payCycleId: number;
  periodStart: string;
  periodEnd: string;
  paymentDate: string;
}

export interface DecidePayrollRunInput {
  reason?: string;
}

export interface ListPayrollRunsQuery {
  status?: PayrollRunStatus;
  payCycleId?: number;
}
