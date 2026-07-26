import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DepartmentDto, EmployeeDto, PaginatedResult } from "@hrm-plus/shared";
import { listEmployees } from "../../api/employees";
import { listDepartments } from "../../api/departments";

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Employee Directory</h1>
        <Link
          to="/employees/new"
          className="bg-slate-900 text-white rounded px-4 py-2 text-sm font-medium"
        >
          New Employee
        </Link>
      </div>

      <div className="flex gap-3">
        <input
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Search by name, email, or code..."
          className="border border-slate-300 rounded px-3 py-2 text-sm w-72"
        />
        <select
          value={departmentId}
          onChange={(e) => {
            setPage(1);
            setDepartmentId(e.target.value);
          }}
          className="border border-slate-300 rounded px-3 py-2 text-sm"
        >
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Department</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && result?.items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  No employees found.
                </td>
              </tr>
            )}
            {!loading &&
              result?.items.map((employee) => (
                <tr key={employee.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-2">
                    <Link to={`/employees/${employee.id}`} className="text-slate-900 font-medium">
                      {employee.firstName} {employee.lastName}
                    </Link>
                    <div className="text-xs text-slate-400">{employee.employeeCode}</div>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{employee.email}</td>
                  <td className="px-4 py-2 text-slate-600">{employee.departmentName ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-600">{employee.role ?? "—"}</td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        employee.status === "Active"
                          ? "text-green-700 bg-green-50 px-2 py-0.5 rounded text-xs"
                          : "text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-xs"
                      }
                    >
                      {employee.status}
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>{result?.total ?? 0} total employees</span>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 border border-slate-300 rounded disabled:opacity-40"
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 border border-slate-300 rounded disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
