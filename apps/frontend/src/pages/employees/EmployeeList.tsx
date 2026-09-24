import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Upload, UserPlus } from "lucide-react";
import { DEFAULT_RESET_PASSWORD, DepartmentDto, EmployeeDto, PaginatedResult } from "@hrm-plus/shared";
import {
  Avatar,
  Button,
  EmptyState,
  Input,
  PageHeader,
  Select,
  Spinner,
  StatusPill,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@hrm-plus/ui";
import { listEmployees, resetEmployeePassword } from "../../api/employees";
import { listDepartments } from "../../api/departments";
import { resolveFileUrl } from "../../utils/fileUrl";
import { BulkImportEmployeesModal } from "../../components/employees/BulkImportEmployeesModal";

const PAGE_SIZE = 10;

export default function EmployeeList() {
  const [result, setResult] = useState<PaginatedResult<EmployeeDto> | null>(null);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [resettingId, setResettingId] = useState<number | null>(null);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    listDepartments().then(setDepartments).catch(() => setDepartments([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listEmployees({
      page,
      pageSize: PAGE_SIZE,
      search: search || undefined,
      departmentId: departmentId ? Number(departmentId) : undefined,
    })
      .then((res) => {
        if (!cancelled) setResult(res);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [search, departmentId, page, refreshKey]);

  const totalPages = result ? Math.max(1, Math.ceil(result.total / PAGE_SIZE)) : 1;

  async function handleResetPassword(employee: EmployeeDto) {
    const confirmed = window.confirm(
      `Reset password for ${employee.firstName} ${employee.lastName}?\n\n` +
        `Their new password will be "${DEFAULT_RESET_PASSWORD}". They will be asked to change it the next time they sign in.`
    );
    if (!confirmed) return;

    setResettingId(employee.id);
    try {
      const { newPassword } = await resetEmployeePassword(employee.id);
      window.alert(`Password reset. New password: ${newPassword}`);
    } catch (err: any) {
      window.alert(err.response?.data?.error?.message ?? "Failed to reset password");
    } finally {
      setResettingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Employee Directory"
        description="Browse and manage everyone in your organisation."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" className="gap-2" onClick={() => setBulkImportOpen(true)}>
              <Upload className="h-4 w-4" />
              Bulk Import
            </Button>
            <Link
              to="/employees/new"
              className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              <UserPlus className="h-4 w-4" />
              New Employee
            </Link>
          </div>
        }
      />

      <div className="flex flex-wrap gap-3">
        <div className="relative w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder="Search by name, email, or code..."
            className="pl-9"
          />
        </div>
        <Select
          value={departmentId}
          onChange={(e) => {
            setPage(1);
            setDepartmentId(e.target.value);
          }}
          className="w-56"
        >
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </Select>
      </div>

      <Table>
        <TableHead>
          <tr>
            <TableHeaderCell>Name</TableHeaderCell>
            <TableHeaderCell>Email</TableHeaderCell>
            <TableHeaderCell>Department</TableHeaderCell>
            <TableHeaderCell>Role</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Action</TableHeaderCell>
          </tr>
        </TableHead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={6} className="py-12">
                <div className="flex justify-center">
                  <Spinner />
                </div>
              </td>
            </tr>
          )}
          {!loading && result?.items.length === 0 && (
            <tr>
              <td colSpan={6}>
                <EmptyState title="No employees found" description="Try adjusting your search or filters." />
              </td>
            </tr>
          )}
          {!loading &&
            result?.items.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell>
                  <Link to={`/employees/${employee.id}`} className="flex items-center gap-3 group">
                    <Avatar
                      name={`${employee.firstName} ${employee.lastName}`}
                      src={resolveFileUrl(employee.avatarUrl)}
                      size="sm"
                    />
                    <div>
                      <div className="font-medium text-slate-900 group-hover:text-brand-600">
                        {employee.firstName} {employee.lastName}
                      </div>
                      <div className="text-xs text-slate-400">{employee.employeeCode}</div>
                    </div>
                  </Link>
                </TableCell>
                <TableCell>{employee.email}</TableCell>
                <TableCell>{employee.departmentName ?? "—"}</TableCell>
                <TableCell>{employee.role ?? "—"}</TableCell>
                <TableCell>
                  <StatusPill status={employee.status} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Link
                      to={`/employees/${employee.id}?edit=true`}
                      className="text-sm text-brand-600 hover:underline"
                    >
                      Edit
                    </Link>
                    <Button
                      variant="secondary"
                      size="sm"
                      isLoading={resettingId === employee.id}
                      onClick={() => handleResetPassword(employee)}
                    >
                      Reset Password
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
        </tbody>
      </Table>

      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>{result?.total ?? 0} total employees</span>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span>
            Page {page} of {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <BulkImportEmployeesModal
        open={bulkImportOpen}
        onClose={() => setBulkImportOpen(false)}
        onImported={(createdCount) => {
          window.alert(`${createdCount} employee(s) imported successfully.`);
          setPage(1);
          setRefreshKey((k) => k + 1);
        }}
      />
    </div>
  );
}
