import { useEffect, useState } from "react";
import { PayslipDto } from "@hrm-plus/shared";
import { Card, PageHeader, Table, TableCell, TableHead, TableHeaderCell, TableRow } from "@hrm-plus/ui";
import { formatCurrency } from "../../utils/currency";
import { resolveFileUrl } from "../../utils/fileUrl";
import { listMyPayslips } from "../../api/payroll";

export default function MyPayslips() {
  const [payslips, setPayslips] = useState<PayslipDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listMyPayslips()
      .then(setPayslips)
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load payslips"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <PageHeader title="My Payslips" description="Published payslips for your recent pay periods." />

      <Card>
        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
        )}
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Gross</TableHeaderCell>
              <TableHeaderCell>Tax</TableHeaderCell>
              <TableHeaderCell>Net</TableHeaderCell>
              <TableHeaderCell>Payslip</TableHeaderCell>
            </tr>
          </TableHead>
          <tbody>
            {loading && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-slate-400 py-6">
                  Loading...
                </TableCell>
              </TableRow>
            )}
            {!loading && payslips.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-slate-400 py-6">
                  No published payslips yet.
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              payslips.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{formatCurrency(p.grossPay)}</TableCell>
                  <TableCell>{formatCurrency(p.taxDeductions)}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(p.netPay)}</TableCell>
                  <TableCell>
                    {p.pdfUrl ? (
                      <a
                        href={resolveFileUrl(p.pdfUrl) ?? undefined}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-700 hover:underline"
                      >
                        Download PDF
                      </a>
                    ) : (
                      <span className="text-slate-400">Generating...</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
