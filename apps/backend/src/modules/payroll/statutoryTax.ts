import { PayrollRegion } from "@hrm-plus/shared";

// Simplified progressive-bracket approximations of NZ (IRD) and AU (ATO) individual
// income tax, applied per pay-period gross pay (not annualized/pro-rated to actual
// pay frequency) — adequate for computing a payslip's taxDeductions line, not a
// substitute for full PAYE/withholding-table compliance. Extend this dispatch table
// (rather than branching at call sites) to add a new region.
interface TaxBracket {
  upTo: number; // exclusive upper bound of this bracket's gross pay, Infinity for the top bracket
  rate: number;
}

const NZ_BRACKETS: TaxBracket[] = [
  { upTo: 14000, rate: 0.105 },
  { upTo: 48000, rate: 0.175 },
  { upTo: 70000, rate: 0.3 },
  { upTo: 180000, rate: 0.33 },
  { upTo: Infinity, rate: 0.39 },
];

const AU_BRACKETS: TaxBracket[] = [
  { upTo: 18200, rate: 0 },
  { upTo: 45000, rate: 0.19 },
  { upTo: 120000, rate: 0.325 },
  { upTo: 180000, rate: 0.37 },
  { upTo: Infinity, rate: 0.45 },
];

function applyProgressiveBrackets(grossPay: number, brackets: TaxBracket[]): number {
  let tax = 0;
  let lowerBound = 0;
  for (const bracket of brackets) {
    if (grossPay <= lowerBound) break;
    const taxableInBracket = Math.min(grossPay, bracket.upTo) - lowerBound;
    tax += taxableInBracket * bracket.rate;
    lowerBound = bracket.upTo;
  }
  return tax;
}

const CALCULATORS: Record<PayrollRegion, (grossPay: number) => number> = {
  NZ: (grossPay) => applyProgressiveBrackets(grossPay, NZ_BRACKETS),
  AU: (grossPay) => applyProgressiveBrackets(grossPay, AU_BRACKETS),
};

export function calculateStatutoryDeductions(grossPay: number, region: PayrollRegion): number {
  const calculator = CALCULATORS[region];
  if (!calculator) throw new Error(`No statutory tax calculator registered for region "${region}"`);
  return Math.round(calculator(grossPay) * 100) / 100;
}
