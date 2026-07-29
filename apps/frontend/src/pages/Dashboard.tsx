import { useEffect, useState } from "react";
import { Building2, UserCheck, Users } from "lucide-react";
import { Card, PageHeader, Spinner, StatCard } from "@hrm-plus/ui";
import { DepartmentDto, EmployeeDto } from "@hrm-plus/shared";
import { listEmployees } from "../api/employees";
import { listDepartments } from "../api/departments";
import { useAuth } from "../auth/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<EmployeeDto[] | null>(null);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);

  useEffect(() => {
    listEmployees({ page: 1, pageSize: 1000 }).then((res) => setEmployees(res.items));
    listDepartments().then(setDepartments).catch(() => setDepartments([]));
  }, []);

  if (!employees) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner />
      </div>
    );
  }

  const activeCount = employees.filter((e) => e.status === "Active").length;

  const byDepartment = departments.map((dept) => ({
    name: dept.name,
    count: employees.filter((e) => e.departmentId === dept.id).length,
  }));
  const unassigned = employees.filter((e) => e.departmentId === null).length;
  if (unassigned > 0) byDepartment.push({ name: "Unassigned", count: unassigned });
  const maxCount = Math.max(1, ...byDepartment.map((d) => d.count));

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.firstName ?? ""}`}
        description="Here's what's happening across your organisation."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total employees" value={employees.length} icon={Users} />
        <StatCard label="Active employees" value={activeCount} icon={UserCheck} />
        <StatCard label="Departments" value={departments.length} icon={Building2} />
      </div>

      <Card title="Employees by department">
        {byDepartment.length === 0 ? (
          <p className="text-sm text-slate-400">No department data yet.</p>
        ) : (
          <div className="space-y-3">
            {byDepartment.map((dept) => (
              <div key={dept.name} className="flex items-center gap-3">
                <span className="w-36 shrink-0 truncate text-sm text-slate-600">{dept.name}</span>
                <div className="h-2 flex-1 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-brand-500"
                    style={{ width: `${(dept.count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right text-sm font-medium text-slate-900">{dept.count}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
