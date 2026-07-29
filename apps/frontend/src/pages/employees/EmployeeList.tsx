import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, UserPlus } from "lucide-react";
import { DepartmentDto, EmployeeDto, PaginatedResult } from "@hrm-plus/shared";
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
import { listEmployees } from "../../api/employees";
import { listDepartments } from "../../api/departments";
import { resolveFileUrl } from "../../utils/fileUrl";

const PAGE_SIZE = 10;

export default function EmployeeList() {
  const [result, setResult] = useState<PaginatedResult<EmployeeDto> | null>(null);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

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
  }, [search, departmentId, page]);

  const totalPages = result ? Math.max(1, Math.ceil(result.total / PAGE_SIZE)) : 1;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Employee Directory"
        description="Browse and manage everyone in your organisation."
        actions={
          <Link
            to="/employees/new"
            className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            <UserPlus className="h-4 w-4" />
            New Employee
          </Link>
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
          </tr>
        </TableHead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={5} className="py-12">
                <div className="flex justify-center">
                  <Spinner />
                </div>
              </td>
            </tr>
          )}
          {!loading && result?.items.length === 0 && (
            <tr>
              <td colSpan={5}>
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
    </div>
  );
}
