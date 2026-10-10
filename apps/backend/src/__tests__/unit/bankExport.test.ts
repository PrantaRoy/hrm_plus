import { BankExportLine, generateBankExportFile } from "../../modules/payroll/bankExport";

const lines: BankExportLine[] = [
  { employeeCode: "EMP-001", employeeName: "Jane Doe", netPay: 1234.5 },
  { employeeCode: "EMP-002", employeeName: "John Smith", netPay: 99.999 },
];

describe("generateBankExportFile — NZ direct credit CSV", () => {
  const out = generateBankExportFile(lines, "NZ_DIRECT_CREDIT_CSV");

  it("returns csv metadata", () => {
    expect(out.mimeType).toBe("text/csv");
    expect(out.fileName).toBe("nz-direct-credit.csv");
  });

  it("emits a header plus one row per employee with 2-decimal amounts", () => {
    const rows = out.content.split("\n");
    expect(rows).toHaveLength(3);
    expect(rows[0]).toBe("AccountNumber,Amount,Code,Reference,PayeeName");
    expect(rows[1]).toBe('00000000,1234.50,PAYROLL,EMP-001,"Jane Doe"');
    expect(rows[2]).toBe('00000000,100.00,PAYROLL,EMP-002,"John Smith"');
  });

  it("emits only the header for no lines", () => {
    expect(generateBankExportFile([], "NZ_DIRECT_CREDIT_CSV").content).toBe("AccountNumber,Amount,Code,Reference,PayeeName");
  });
});

describe("generateBankExportFile — ABA", () => {
  const out = generateBankExportFile(lines, "AU_ABA" as never);

  it("returns aba metadata", () => {
    expect(out.mimeType).toBe("text/plain");
    expect(out.fileName).toBe("payroll.aba");
  });

  it("emits one detail record per employee and a trailer", () => {
    const rows = out.content.split("\n");
    expect(rows).toHaveLength(3);
    expect(rows[0][0]).toBe("1");
    expect(rows[1][0]).toBe("1");
    expect(rows[2][0]).toBe("7");
  });

  it("encodes the amount in cents, zero-padded to 10 digits, after the transaction code", () => {
    const [first, second] = out.content.split("\n");
    // type(1) + bsb(7) + account(9) + indicator(1) + code(2) = 20 chars before the amount
    expect(first.slice(18, 20)).toBe("50");
    expect(first.slice(20, 30)).toBe("0000123450");
    expect(second.slice(20, 30)).toBe("0000010000");
  });

  it("pads/truncates names and references to their fixed widths", () => {
    const long = generateBankExportFile(
      [{ employeeCode: "C".repeat(40), employeeName: "N".repeat(60), netPay: 1 }],
      "AU_ABA" as never
    ).content.split("\n")[0];
    expect(long.slice(30, 62)).toBe("N".repeat(32));
    expect(long.slice(62, 80)).toBe("C".repeat(18));
    const short = out.content.split("\n")[0];
    expect(short.slice(30, 62)).toBe("Jane Doe".padEnd(32, " "));
  });

  it("totals the trailer in cents and counts the records", () => {
    const trailer = out.content.split("\n")[2];
    const totalCents = 123450 + 10000;
    expect(trailer).toContain(String(totalCents).padStart(10, "0").repeat(2));
    expect(trailer.slice(-6)).toBe("000002");
  });

  it("produces a zero-total trailer for no lines", () => {
    const trailer = generateBankExportFile([], "AU_ABA" as never).content;
    expect(trailer[0]).toBe("7");
    expect(trailer.slice(-6)).toBe("000000");
  });
});
