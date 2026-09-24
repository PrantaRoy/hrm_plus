import { FormEvent, useEffect, useState } from "react";
import { Download } from "lucide-react";
import { BulkImportRowError, DepartmentDto, DesignationDto, RoleDto } from "@hrm-plus/shared";
import { Button, Field, Modal, Select } from "@hrm-plus/ui";
import { bulkImportEmployees, downloadBulkImportTemplate } from "../../api/employees";
import { listDepartments } from "../../api/departments";
import { listDesignations } from "../../api/designations";
import { listRoles } from "../../api/roles";

function triggerDownload(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export interface BulkImportEmployeesModalProps {
  open: boolean;
  onClose: () => void;
  onImported: (createdCount: number) => void;
}

export function BulkImportEmployeesModal({ open, onClose, onImported }: BulkImportEmployeesModalProps) {
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [designations, setDesignations] = useState<DesignationDto[]>([]);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [departmentId, setDepartmentId] = useState("");
  const [designationId, setDesignationId] = useState("");
  const [role, setRole] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<BulkImportRowError[]>([]);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setRowErrors([]);
    setFile(null);
    listDepartments().then(setDepartments).catch(() => setDepartments([]));
    listDesignations().then(setDesignations).catch(() => setDesignations([]));
    listRoles()
      .then((allRoles) => {
        const activeRoles = allRoles.filter((r) => r.status === "Active");
        setRoles(activeRoles);
        setRole((current) => current || activeRoles[0]?.name || "");
      })
      .catch(() => setRoles([]));
  }, [open]);

  async function handleDownloadTemplate() {
    try {
      const content = await downloadBulkImportTemplate();
      triggerDownload(content, "employee-bulk-import-template.csv", "text/csv");
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to download template");
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Please choose a CSV or Excel file to upload");
      return;
    }
    setError(null);
    setRowErrors([]);
    setSubmitting(true);
    try {
      const result = await bulkImportEmployees(file, {
        role,
        departmentId: departmentId ? Number(departmentId) : null,
        designationId: designationId ? Number(designationId) : null,
      });
      onImported(result.createdCount);
      onClose();
    } catch (err: any) {
      const details = err.response?.data?.error?.details;
      if (details?.rowErrors) {
        setRowErrors(details.rowErrors);
        setError(`${details.rowErrors.length} row(s) failed validation. No employees were created.`);
      } else {
        setError(err.response?.data?.error?.message ?? "Failed to import employees");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Bulk Import Employees" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-slate-500">
          Choose the Department, Designation, and Role to apply to everyone in the file, then upload a CSV or
          Excel file. Every row is validated before anything is created — if any row fails, no employees are
          added and the errors are shown below.
        </p>

        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <Field label="Department">
            <Select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
              <option value="">None</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Designation">
            <Select value={designationId} onChange={(e) => setDesignationId(e.target.value)}>
              <option value="">None</option>
              {designations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Role" required>
            <Select value={role} onChange={(e) => setRole(e.target.value)}>
              {roles.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="CSV or Excel file" required>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
          />
        </Field>

        <button
          type="button"
          onClick={handleDownloadTemplate}
          className="inline-flex items-center gap-2 text-sm text-brand-600 hover:underline"
        >
          <Download className="h-4 w-4" />
          Download template
        </button>

        {rowErrors.length > 0 && (
          <div className="max-h-64 overflow-y-auto rounded-md border border-red-200 bg-red-50">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-red-200 text-red-700">
                  <th className="px-3 py-2 font-medium">Row</th>
                  <th className="px-3 py-2 font-medium">Errors</th>
                </tr>
              </thead>
              <tbody>
                {rowErrors.map((rowError) => (
                  <tr key={rowError.row} className="border-b border-red-100 last:border-0">
                    <td className="px-3 py-2 align-top text-red-700">{rowError.row}</td>
                    <td className="px-3 py-2 text-red-700">{rowError.messages.join("; ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={submitting}>
            Import Employees
          </Button>
        </div>
      </form>
    </Modal>
  );
}
