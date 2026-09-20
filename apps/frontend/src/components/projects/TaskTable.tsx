import { Link } from "react-router-dom";
import { TaskDto } from "@hrm-plus/shared";
import { Badge, Table, TableCell, TableHead, TableHeaderCell, TableRow } from "@hrm-plus/ui";
import { PriorityBadge, ProgressBar, TaskStatusBadge } from "./labels";
import { formatDateTime } from "./format";

interface Props {
  items: TaskDto[];
  loading: boolean;
  showProject?: boolean;
  emptyText?: string;
}

export function TaskTable({ items, loading, showProject = true, emptyText = "No tasks found." }: Props) {
  const cols = showProject ? 8 : 7;
  return (
    <Table>
      <TableHead>
        <tr>
          <TableHeaderCell>Task</TableHeaderCell>
          {showProject && <TableHeaderCell>Project</TableHeaderCell>}
          <TableHeaderCell>Priority</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
          <TableHeaderCell>Supervisor</TableHeaderCell>
          <TableHeaderCell>Members</TableHeaderCell>
          <TableHeaderCell>Progress</TableHeaderCell>
          <TableHeaderCell>Due</TableHeaderCell>
        </tr>
      </TableHead>
      <tbody>
        {loading && (
          <TableRow>
            <TableCell colSpan={cols} className="text-center text-slate-400 py-6">
              Loading…
            </TableCell>
          </TableRow>
        )}
        {!loading && items.length === 0 && (
          <TableRow>
            <TableCell colSpan={cols} className="text-center text-slate-400 py-6">
              {emptyText}
            </TableCell>
          </TableRow>
        )}
        {!loading &&
          items.map((t) => (
            <TableRow key={t.id}>
              <TableCell>
                <Link to={`/tasks/${t.id}`} className="font-medium text-brand-700 hover:underline">
                  {t.title}
                </Link>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span>{t.taskNumber}</span>
                  {t.totalCycles > 0 && <Badge color="brand">Repeats · {t.totalCycles} left</Badge>}
                  {t.recurrenceParentId != null && <Badge>Recurring copy</Badge>}
                </div>
              </TableCell>
              {showProject && (
                <TableCell>
                  <Link to={`/projects/${t.projectId}`} className="text-slate-600 hover:underline">
                    {t.projectTitle}
                  </Link>
                </TableCell>
              )}
              <TableCell>
                <PriorityBadge priority={t.priority} />
              </TableCell>
              <TableCell>
                <TaskStatusBadge status={t.status} />
              </TableCell>
              <TableCell>{t.supervisor.name}</TableCell>
              <TableCell>
                {t.members.length === 0 ? (
                  <span className="text-slate-400">—</span>
                ) : (
                  t.members.map((m) => m.name).join(", ")
                )}
              </TableCell>
              <TableCell>
                <ProgressBar value={t.progressPercentage} />
              </TableCell>
              <TableCell className="whitespace-nowrap">{formatDateTime(t.dueDate)}</TableCell>
            </TableRow>
          ))}
      </tbody>
    </Table>
  );
}
