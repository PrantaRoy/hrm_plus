import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ListTodo, Play, Square, Timer } from "lucide-react";
import { MyWorkDashboardDto, TaskDto } from "@hrm-plus/shared";
import { Button, Card, EmptyState } from "@hrm-plus/ui";
import { getMyWorkDashboard, startTimer, stopTimer } from "../../api/tasks";
import { apiErrorMessage } from "../../utils/apiError";
import { DueLabel, FollowingCard, SubHeading, SupervisingCard, TaskLine } from "./MyWorkCards";

function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
}

function Elapsed({ since }: { since: string }) {
  const start = new Date(since).getTime();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return <span className="font-mono tabular-nums">{formatElapsed(now - start)}</span>;
}

/**
 * The staff dashboard's project/task area: what I work on (with a timer), what I supervise
 * and what I follow. One request feeds all of it; every timer action refreshes it.
 */
export function MyWorkSection() {
  const [data, setData] = useState<MyWorkDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyTaskId, setBusyTaskId] = useState<number | null>(null);

  const refresh = useCallback(() => {
    return getMyWorkDashboard()
      .then(setData)
      .catch((err) => setError(apiErrorMessage(err, "Failed to load your projects and tasks")))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function toggleTimer(taskId: number, running: boolean) {
    setBusyTaskId(taskId);
    setError(null);
    try {
      await (running ? stopTimer(taskId) : startTimer(taskId));
    } catch (err) {
      setError(apiErrorMessage(err, running ? "Failed to stop the timer" : "Failed to start the timer"));
    } finally {
      // Refresh even on failure: the server state is the truth (e.g. a timer started elsewhere).
      await refresh();
      setBusyTaskId(null);
    }
  }

  if (loading) {
    return (
      <Card title="My Tasks">
        <p className="text-sm text-slate-400">Loading…</p>
      </Card>
    );
  }
  if (!data) {
    return error ? (
      <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
    ) : null;
  }

  const running = data.runningTimer;

  function timerButton(task: TaskDto) {
    const isRunning = running?.taskId === task.id;
    if (isRunning) {
      return (
        <Button size="sm" variant="danger" isLoading={busyTaskId === task.id} onClick={() => toggleTimer(task.id, true)}>
          <Square className="h-3.5 w-3.5" />
          Stop
        </Button>
      );
    }
    return (
      <Button
        size="sm"
        variant="secondary"
        isLoading={busyTaskId === task.id}
        disabled={running != null}
        title={running ? "Stop the running timer first" : "Start the timer"}
        onClick={() => toggleTimer(task.id, false)}
      >
        <Play className="h-3.5 w-3.5" />
        Start
      </Button>
    );
  }

  function group(label: string, tasks: TaskDto[], total: number) {
    if (tasks.length === 0) return null;
    return (
      <div className="space-y-3">
        <SubHeading>
          {label} · {total > tasks.length ? `showing ${tasks.length} of ${total}` : total}
        </SubHeading>
        {tasks.map((t) => (
          <TaskLine key={t.id} task={t} meta={<DueLabel task={t} />} action={timerButton(t)} />
        ))}
      </div>
    );
  }

  const hasWork = data.inProgressTasks.length > 0 || data.upcomingTasks.length > 0;

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      {running && (
        <div className="flex items-center justify-between gap-4 rounded-card border border-brand-200 bg-brand-50 px-5 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Timer className="h-5 w-5 shrink-0 text-brand-600" />
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-brand-700">Timer running</p>
              <Link to={`/tasks/${running.taskId}`} className="block truncate text-sm font-medium text-slate-900 hover:underline">
                {running.taskNumber} · {running.taskTitle}
              </Link>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <span className="text-lg text-slate-900">
              <Elapsed since={running.startTime} />
            </span>
            <Button variant="danger" size="sm" isLoading={busyTaskId === running.taskId} onClick={() => toggleTimer(running.taskId, true)}>
              <Square className="h-3.5 w-3.5" />
              Stop
            </Button>
          </div>
        </div>
      )}

      <Card
        title="My Tasks"
        description="In progress and coming up next"
        actions={
          <Link to="/tasks/my" className="text-sm text-brand-600 hover:underline">
            View all →
          </Link>
        }
      >
        {!hasWork ? (
          <EmptyState icon={ListTodo} title="No open tasks assigned to you" />
        ) : (
          <div className="space-y-5">
            {group("In progress", data.inProgressTasks, data.totals.inProgressTasks)}
            {group("Upcoming", data.upcomingTasks, data.totals.upcomingTasks)}
          </div>
        )}
      </Card>

      <SupervisingCard
        projects={data.supervisedProjects}
        tasks={data.supervisedTasks}
        totalProjects={data.totals.supervisedProjects}
        totalTasks={data.totals.supervisedTasks}
      />
      <FollowingCard tasks={data.followedTasks} total={data.totals.followedTasks} />
    </div>
  );
}
