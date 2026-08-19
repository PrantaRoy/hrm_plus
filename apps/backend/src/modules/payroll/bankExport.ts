import { BankExportFormat } from "@hrm-plus/shared";

export interface BankExportLine {
  employeeCode: string;
  employeeName: string;
  netPay: number;
}

// NOTE: Employee has no bank-account fields yet (out of scope for this pass — the
// given Prisma schema doesn't include them), so both formats below are shaped
// correctly per their respective spec but use placeholder account details. Once
// employee bank fields exist, swap the placeholders for the real values without
// changing the format functions' signatures.
const PLACEHOLDER_BSB = "000-000";
const PLACEHOLDER_ACCOUNT = "00000000";

function toNzDirectCreditCsv(lines: BankExportLine[]): string {
  const header = "AccountNumber,Amount,Code,Reference,PayeeName";
  const rows = lines.map(
    (line) =>
      `${PLACEHOLDER_ACCOUNT},${line.netPay.toFixed(2)},PAYROLL,${line.employeeCode},"${line.employeeName}"`
  );
  return [header, ...rows].join("\n");
}

function padRight(value: string, length: number): string {
  return value.slice(0, length).padEnd(length, " ");
}

function padLeftZero(value: string, length: number): string {
  return value.slice(0, length).padStart(length, "0");
}

// Simplified ABA (Australian Bankers' Association) fixed-width format: one 120-char
// detail record per employee, transaction code 50 (standard credit).
function toAbaFile(lines: BankExportLine[]): string {
  const detailRecords = lines.map((line) => {
    const amountCents = padLeftZero(String(Math.round(line.netPay * 100)), 10);
    return [
      "1", // record type: detail
      PLACEHOLDER_BSB.replace("-", "").padEnd(7, " "),
      padLeftZero(PLACEHOLDER_ACCOUNT, 9),
      " ",
      "50", // transaction code: credit
      amountCents,
      padRight(line.employeeName, 32),
      padRight(line.employeeCode, 18),
      "000000",
      padRight("PAYROLL", 16),
    ].join("");
  });

  const totalCents = lines.reduce((sum, line) => sum + Math.round(line.netPay * 100), 0);
  const trailer = ["7", "999-999".replace("-", ""), " ".repeat(9), padLeftZero(String(totalCents), 10), padLeftZero(String(totalCents), 10), "0000000000", " ".repeat(24), padLeftZero(String(lines.length), 6)].join("");

  return [...detailRecords, trailer].join("\n");
}

export function generateBankExportFile(lines: BankExportLine[], format: BankExportFormat): { content: string; mimeType: string; fileName: string } {
  if (format === "NZ_DIRECT_CREDIT_CSV") {
    return { content: toNzDirectCreditCsv(lines), mimeType: "text/csv", fileName: "nz-direct-credit.csv" };
  }
  return { content: toAbaFile(lines), mimeType: "text/plain", fileName: "payroll.aba" };
}
