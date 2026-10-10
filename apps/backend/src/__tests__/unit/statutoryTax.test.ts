import { calculateStatutoryDeductions } from "../../modules/payroll/statutoryTax";

describe("calculateStatutoryDeductions — NZ", () => {
  it.each([
    [0, 0],
    [-100, 0],
    [10000, 1050], // 10.5%
    [14000, 1470], // top of bracket 1
    [30000, 4270], // 1470 + 16000*17.5%
    [48000, 7420], // 1470 + 34000*17.5%
    [60000, 11020], // 7420 + 12000*30%
    [100000, 23920], // 7420 + 22000*30% + 30000*33%
    [200000, 58120], // 14020 (to 70k) + 110000*33% + 20000*39%
  ])("gross %d -> tax %d", (gross, tax) => {
    expect(calculateStatutoryDeductions(gross, "NZ")).toBeCloseTo(tax, 2);
  });
});

describe("calculateStatutoryDeductions — AU", () => {
  it.each([
    [0, 0],
    [18200, 0], // tax-free threshold
    [30000, 2242], // 11800 * 19%
    [45000, 5092], // 26800 * 19%
    [100000, 22967], // 5092 + 55000 * 32.5%
    [200000, 60667], // 5092 + 75000*32.5% + 60000*37% + 20000*45%
  ])("gross %d -> tax %d", (gross, tax) => {
    expect(calculateStatutoryDeductions(gross, "AU")).toBeCloseTo(tax, 2);
  });
});

describe("calculateStatutoryDeductions — general behavior", () => {
  it("is monotonically non-decreasing in gross pay", () => {
    for (const region of ["NZ", "AU"] as const) {
      let prev = -1;
      for (let gross = 0; gross <= 250000; gross += 997) {
        const tax = calculateStatutoryDeductions(gross, region);
        expect(tax).toBeGreaterThanOrEqual(prev);
        prev = tax;
      }
    }
  });

  it("never takes more than the gross pay", () => {
    for (const gross of [1, 500, 20000, 90000, 500000]) {
      expect(calculateStatutoryDeductions(gross, "NZ")).toBeLessThan(gross);
      expect(calculateStatutoryDeductions(gross, "AU")).toBeLessThan(gross);
    }
  });

  it("rounds to cents", () => {
    // 1234.567 * 10.5% = 129.62...
    const tax = calculateStatutoryDeductions(1234.567, "NZ");
    expect(Math.round(tax * 100) / 100).toBe(tax);
  });

  it("throws for an unregistered region", () => {
    expect(() => calculateStatutoryDeductions(1000, "US" as never)).toThrow('No statutory tax calculator registered for region "US"');
  });
});
