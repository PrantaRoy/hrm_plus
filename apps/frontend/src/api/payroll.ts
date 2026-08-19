import {
  CreateEmployeePayRateInput,
  CreatePayCycleInput,
  DecidePayrollRunInput,
  EmployeePayRateDto,
  GenerateDraftPayrollRunInput,
  GenerateWorkReportsInput,
  ListPayrollRunsQuery,
  ListWorkReportsQuery,
  PayCycleDto,
  PayrollRunDto,
  PayrollSettingsDto,
  PayslipDto,
  UpdatePayCycleInput,
  UpdatePayrollSettingsInput,
  WorkReportDto,
} from "@hrm-plus/shared";
import { apiClient } from "./client";

// Pay cycles
export async function listPayCycles(): Promise<PayCycleDto[]> {
  return (await apiClient.get<PayCycleDto[]>("/pay-cycles")).data;
}

export async function createPayCycle(input: CreatePayCycleInput): Promise<PayCycleDto> {
  return (await apiClient.post<PayCycleDto>("/pay-cycles", input)).data;
}

export async function updatePayCycle(id: number, input: UpdatePayCycleInput): Promise<PayCycleDto> {
  return (await apiClient.patch<PayCycleDto>(`/pay-cycles/${id}`, input)).data;
}

export async function assignEmployeesToPayCycle(id: number, employeeIds: number[]): Promise<PayCycleDto> {
  return (await apiClient.post<PayCycleDto>(`/pay-cycles/${id}/assign-employees`, { employeeIds })).data;
}

// Pay rates
export async function listPayRatesForEmployee(employeeId: number): Promise<EmployeePayRateDto[]> {
  return (await apiClient.get<EmployeePayRateDto[]>(`/pay-rates/employees/${employeeId}`)).data;
}

export async function createPayRate(input: CreateEmployeePayRateInput): Promise<EmployeePayRateDto> {
  return (await apiClient.post<EmployeePayRateDto>("/pay-rates", input)).data;
}

// Payroll settings
export async function getPayrollSettings(): Promise<PayrollSettingsDto> {
  return (await apiClient.get<PayrollSettingsDto>("/payroll-settings")).data;
}

export async function updatePayrollSettings(input: UpdatePayrollSettingsInput): Promise<PayrollSettingsDto> {
  return (await apiClient.patch<PayrollSettingsDto>("/payroll-settings", input)).data;
}

// Work reports
export async function listWorkReports(query: ListWorkReportsQuery = {}): Promise<WorkReportDto[]> {
  return (await apiClient.get<WorkReportDto[]>("/work-reports", { params: query })).data;
}

export async function generateWorkReports(input: GenerateWorkReportsInput): Promise<WorkReportDto[]> {
  return (await apiClient.post<WorkReportDto[]>("/work-reports/generate", input)).data;
}

export async function approveWorkReport(id: number): Promise<WorkReportDto> {
  return (await apiClient.post<WorkReportDto>(`/work-reports/${id}/approve`)).data;
}

// Payroll runs
export async function listPayrollRuns(query: ListPayrollRunsQuery = {}): Promise<PayrollRunDto[]> {
  return (await apiClient.get<PayrollRunDto[]>("/payroll-runs", { params: query })).data;
}

export async function getPayrollRun(id: number): Promise<PayrollRunDto> {
  return (await apiClient.get<PayrollRunDto>(`/payroll-runs/${id}`)).data;
}

export async function listRunPayslips(id: number): Promise<PayslipDto[]> {
  return (await apiClient.get<PayslipDto[]>(`/payroll-runs/${id}/payslips`)).data;
}

export async function generateDraftPayrollRun(input: GenerateDraftPayrollRunInput): Promise<PayrollRunDto> {
  return (await apiClient.post<PayrollRunDto>("/payroll-runs/generate", input)).data;
}

export async function submitPayrollForPayment(id: number): Promise<PayrollRunDto> {
  return (await apiClient.post<PayrollRunDto>(`/payroll-runs/${id}/submit`)).data;
}

export async function approvePayrollRunPayment(id: number, input: DecidePayrollRunInput = {}): Promise<PayrollRunDto> {
  return (await apiClient.post<PayrollRunDto>(`/payroll-runs/${id}/approve-payment`, input)).data;
}

export async function rejectPayrollRunPayment(id: number, input: DecidePayrollRunInput = {}): Promise<PayrollRunDto> {
  return (await apiClient.post<PayrollRunDto>(`/payroll-runs/${id}/reject-payment`, input)).data;
}

export async function downloadBankExport(id: number, format: "NZ_DIRECT_CREDIT_CSV" | "AU_ABA"): Promise<string> {
  return (await apiClient.get<string>(`/payroll-runs/${id}/bank-export`, { params: { format }, responseType: "text" })).data;
}

export async function getIrdPaydayFiling(id: number): Promise<{ fileUrl: string }> {
  return (await apiClient.get<{ fileUrl: string }>(`/payroll-runs/${id}/ird-payday-filing`)).data;
}

// Payslips (employee self-service)
export async function listMyPayslips(): Promise<PayslipDto[]> {
  return (await apiClient.get<PayslipDto[]>("/payslips/my")).data;
}
