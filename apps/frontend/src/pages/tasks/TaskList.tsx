import { useEffect, useState } from "react";
import { TASK_PRIORITIES, TASK_STATUSES, TaskDto } from "@hrm-plus/shared";
import { Card, Field, Input, PageHeader, Select } from "@hrm-plus/ui";
import { listMyTasks, listTasks } from "../../api/tasks";
import { apiErrorMessage } from "../../utils/apiError";
import { TaskTable } from "../../components/projects/TaskTable";
import { humanize } from "../../components/projects/format";

interface Props {
  /** "my" lists tasks you supervise or are a member of; "all" lists everything you can see. */
  mode: "my" | "all";
}

export default function TaskList({ mode }: Props) {
  const [items, setItems] = useState<TaskDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pageSize = 20;

  // Reset paging when switching between "My tasks" and "All tasks".
  useEffect(() => {
    setPage(1);
  }, [mode]);

  useEffect(() => {
    setLoading(true);
    const query = {
      page,
      pageSize,
      status: (status || undefined) as TaskDto["status"] | undefined,
      priority: (priority || undefined) as TaskDto["priority"] | undefined,
      search: search.trim() || undefined,
    };
    (mode === "my" ? listMyTasks(query) : listTasks(query))
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
        setError(null);
      })
      .catch((err) => setError(apiErrorMessage(err, "Failed to load tasks")))
      .finally(() => setLoading(false));
  }, [mode, page, status, priority, search]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-5">
      <PageHeader
        title={mode === "my" ? "My Tasks" : "Tasks"}
        description={
          mode === "my"
            ? "Tasks you supervise or are assigned to."
            : "Every task you have access to, across projects. Create tasks from a project."
        }
      />

      <Card>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Field label="Search">
            <Input
              value={search}
              placeholder="Title or task number"
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
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {humanize(s)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Priority">
            <Select
              value={priority}
              onChange={(e) => {
                setPage(1);
                setPriority(e.target.value);
              }}
            >
              <option value="">All</option>
              {TASK_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {humanize(p)}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
        )}

        <TaskTable
          items={items}
          loading={loading}
          emptyText={mode === "my" ? "No tasks are assigned to you." : "No tasks found."}
        />

        <div className="flex items-center justify-between pt-3 text-sm text-slate-500">
          <span>{total} task(s)</span>
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
    </div>
  );
}
