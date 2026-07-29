import { DutyScheduleAssignmentDto } from "@hrm-plus/shared";
import { AssignmentChip } from "./AssignmentChip";
import { DroppableCell } from "./DroppableCell";

export interface CalendarEmployee {
  id: number;
  name: string;
  code: string;
}

interface CalendarGridProps {
  employees: CalendarEmployee[];
  dates: string[];
  assignmentsByKey: Map<string, DutyScheduleAssignmentDto>;
  readOnly?: boolean;
}

function formatDateHeader(dateStr: string): { weekday: string; day: string } {
  const date = new Date(`${dateStr}T00:00:00Z`);
  return {
    weekday: date.toLocaleDateString(undefined, { weekday: "short", timeZone: "UTC" }),
    day: date.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" }),
  };
}

export function cellId(employeeId: number, date: string): string {
  return `cell:${employeeId}:${date}`;
}

export function CalendarGrid({ employees, dates, assignmentsByKey, readOnly }: CalendarGridProps) {
  return (
    <div className="overflow-x-auto rounded-md border border-slate-200">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-slate-50 border-b border-r border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-600">
              Employee
            </th>
            {dates.map((date) => {
              const { weekday, day } = formatDateHeader(date);
              return (
                <th
                  key={date}
                  className="border-b border-r border-slate-200 bg-slate-50 px-2 py-2 text-center text-xs font-semibold text-slate-600 whitespace-nowrap"
                >
                  <div>{weekday}</div>
                  <div className="text-slate-400 font-normal">{day}</div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => (
            <tr key={employee.id}>
              <td className="sticky left-0 z-10 bg-white border-b border-r border-slate-100 px-3 py-2 whitespace-nowrap">
                <div className="font-medium text-slate-900">{employee.name}</div>
                <div className="text-xs text-slate-400">{employee.code}</div>
              </td>
              {dates.map((date) => {
                const assignment = assignmentsByKey.get(`${employee.id}|${date}`);
                return (
                  <td key={date} className="p-0">
                    <DroppableCell id={cellId(employee.id, date)}>
                      {assignment && <AssignmentChip assignment={assignment} disabled={readOnly} />}
                    </DroppableCell>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
