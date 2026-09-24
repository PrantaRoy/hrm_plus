import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { PROJECT_STATUSES, ProjectDto } from "@hrm-plus/shared";
import {
  Button,
  Card,
  Field,
  Input,
  PageHeader,
  Select,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@hrm-plus/ui";
import { useAuth } from "../../auth/AuthContext";
import { listProjects } from "../../api/projects";
import { apiErrorMessage } from "../../utils/apiError";
import { ProjectFormModal } from "../../components/projects/ProjectFormModal";
import { PriorityBadge, ProgressBar, ProjectStatusBadge } from "../../components/projects/labels";
import { formatDate, humanize } from "../../components/projects/format";

export default function ProjectList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  // Only an Admin creates projects; HR and Manager see all of them, everyone else just their own.
  const canCreate = user?.role === "Admin";
  const seesAll = canCreate || user?.role === "HR" || user?.role === "Manager";

  const [items, setItems] = useState<ProjectDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  // The dashboard links here with ?status=in_progress.
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState(() => {
    const fromUrl = searchParams.get("status") ?? "";
    return (PROJECT_STATUSES as readonly string[]).includes(fromUrl) ? fromUrl : "";
  });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const pageSize = 20;

  useEffect(() => {
    setLoading(true);
    listProjects({
      page,
      pageSize,
      status: (status || undefined) as ProjectDto["status"] | undefined,
      search: search.trim() || undefined,
    })
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
        setError(null);
      })
      .catch((err) => setError(apiErrorMessage(err, "Failed to load projects")))
      .finally(() => setLoading(false));
  }, [page, status, search]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Projects"
        description={seesAll ? "All projects across the organisation." : "Projects you supervise, belong to or follow through a task."}
        actions={canCreate ? <Button onClick={() => setCreating(true)}>New project</Button> : undefined}
      />

      <Card>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Field label="Search">
            <Input
              value={search}
              placeholder="Title or code"
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
            />
          </Field>
          <Field label="Status">
            <Select
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value);
              }}
            >
              <option value="">All</option>
              {PROJECT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {humanize(s)}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
        )}

        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Project</TableHeaderCell>
              <TableHeaderCell>Client</TableHeaderCell>
              <TableHeaderCell>Supervisor</TableHeaderCell>
              <TableHeaderCell>Priority</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Progress</TableHeaderCell>
              <TableHeaderCell>Deadline</TableHeaderCell>
              <TableHeaderCell className="text-right">Tasks</TableHeaderCell>
            </tr>
          </TableHead>
          <tbody>
            {loading && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-slate-400 py-6">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!loading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-slate-400 py-6">
                  No projects found.
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link to={`/projects/${p.id}`} className="font-medium text-brand-700 hover:underline">
                      {p.title}
                    </Link>
                    <div className="text-xs text-slate-400 uppercase">{p.code}</div>
                  </TableCell>
                  <TableCell>{p.clientName ?? <span className="text-slate-400">Internal</span>}</TableCell>
                  <TableCell>{p.supervisor.name}</TableCell>
                  <TableCell>
                    <PriorityBadge priority={p.priority} />
                  </TableCell>
                  <TableCell>
                    <ProjectStatusBadge status={p.status} />
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

        <div className="flex items-center justify-between pt-3 text-sm text-slate-500">
          <span>{total} project(s)</span>
          <span className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="disabled:opacity-40">
              Prev
            </button>
            <span>
              {page} / {totalPages}
            </span>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="disabled:opacity-40">
              Next
            </button>
          </span>
        </div>
      </Card>

      <ProjectFormModal
        open={creating}
        onClose={() => setCreating(false)}
        onSaved={(project) => navigate(`/projects/${project.id}`)}
      />
    </div>
  );
}
