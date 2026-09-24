import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FolderKanban } from "lucide-react";
import { ProjectDto } from "@hrm-plus/shared";
import { Card, EmptyState, Table, TableCell, TableHead, TableHeaderCell, TableRow } from "@hrm-plus/ui";
import { listProjects } from "../../api/projects";
import { formatDate } from "../projects/format";
import { PriorityBadge, ProgressBar } from "../projects/labels";

const PAGE_SIZE = 8;

/** Admin/HR/Manager: every project currently in progress. */
export function InProgressProjectsCard() {
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    listProjects({ status: "in_progress", pageSize: PAGE_SIZE })
      .then((res) => {
        setProjects(res.items);
        setTotal(res.total);
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card
      title="In-progress projects"
      description={
        loading
          ? undefined
          : total > PAGE_SIZE
            ? `Showing ${PAGE_SIZE} of ${total}`
            : `${total} project${total === 1 ? "" : "s"} in progress`
      }
      actions={
        <Link to="/projects?status=in_progress" className="text-sm text-brand-600 hover:underline">
          View all →
        </Link>
      }
    >
      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : failed ? (
        <p className="text-sm text-red-600">Could not load projects.</p>
      ) : projects.length === 0 ? (
        <EmptyState icon={FolderKanban} title="No projects in progress" />
      ) : (
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Project</TableHeaderCell>
              <TableHeaderCell>Client</TableHeaderCell>
              <TableHeaderCell>Supervisor</TableHeaderCell>
              <TableHeaderCell>Priority</TableHeaderCell>
              <TableHeaderCell>Progress</TableHeaderCell>
              <TableHeaderCell>Deadline</TableHeaderCell>
              <TableHeaderCell className="text-right">Tasks</TableHeaderCell>
            </tr>
          </TableHead>
          <tbody>
            {projects.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <Link to={`/projects/${p.id}`} className="font-medium text-brand-700 hover:underline">
                    {p.title}
                  </Link>
                  <div className="text-xs uppercase text-slate-400">{p.code}</div>
                </TableCell>
                <TableCell>{p.clientName ?? <span className="text-slate-400">Internal</span>}</TableCell>
                <TableCell>{p.supervisor.name}</TableCell>
                <TableCell>
                  <PriorityBadge priority={p.priority} />
                </TableCell>
                <TableCell>
                  <ProgressBar value={p.progressPercentage} />
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {p.deadlineType === "casual" ? <span className="text-slate-400">Casual</span> : formatDate(p.targetEndDate)}
                </TableCell>
                <TableCell className="text-right">{p.taskCount}</TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  );
}
