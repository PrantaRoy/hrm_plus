import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ProjectDto, TaskDto } from "@hrm-plus/shared";
import { Card } from "@hrm-plus/ui";
import { formatDateTime } from "../projects/format";
import { PriorityBadge, ProgressBar, ProjectStatusBadge, TaskStatusBadge } from "../projects/labels";

function isOverdue(task: TaskDto): boolean {
  return (
    task.dueDate != null &&
    task.status !== "completed" &&
    task.status !== "cancelled" &&
    new Date(task.dueDate).getTime() < Date.now()
  );
}

export function DueLabel({ task }: { task: TaskDto }) {
  if (!task.dueDate) return <span className="text-slate-400">No due date</span>;
  return (
    <span className={isOverdue(task) ? "font-medium text-red-600" : undefined}>
      {isOverdue(task) ? "Overdue · " : "Due "}
      {formatDateTime(task.dueDate)}
    </span>
  );
}

export function SubHeading({ children }: { children: ReactNode }) {
  return <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{children}</p>;
}

export function TaskLine({ task, meta, action }: { task: TaskDto; meta: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <div className="min-w-0">
        <Link to={`/tasks/${task.id}`} className="truncate font-medium text-slate-900 hover:underline">
          {task.title}
        </Link>
        <p className="truncate text-xs text-slate-500">
          {task.taskNumber} ·{" "}
          <Link to={`/projects/${task.projectId}`} className="hover:underline">
            {task.projectTitle}
          </Link>{" "}
          · {meta}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <div className="hidden w-28 sm:block">
          <ProgressBar value={task.progressPercentage} />
        </div>
        <PriorityBadge priority={task.priority} />
        {action}
      </div>
    </div>
  );
}

function ProjectLine({ project }: { project: ProjectDto }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <div className="min-w-0">
        <Link to={`/projects/${project.id}`} className="truncate font-medium text-slate-900 hover:underline">
          {project.title}
        </Link>
        <p className="truncate text-xs text-slate-500">
          <span className="uppercase">{project.code}</span> · {project.clientName ?? "Internal"} · {project.taskCount}{" "}
          task{project.taskCount === 1 ? "" : "s"}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <div className="hidden w-28 sm:block">
          <ProgressBar value={project.progressPercentage} />
        </div>
        <ProjectStatusBadge status={project.status} />
      </div>
    </div>
  );
}

function moreLabel(shown: number, total: number): string | null {
  return total > shown ? `Showing ${shown} of ${total}` : null;
}

interface SupervisingProps {
  projects: ProjectDto[];
  tasks: TaskDto[];
  totalProjects: number;
  totalTasks: number;
}

/** Projects and tasks the viewer supervises. Renders nothing when they supervise nothing. */
export function SupervisingCard({ projects, tasks, totalProjects, totalTasks }: SupervisingProps) {
  if (projects.length === 0 && tasks.length === 0) return null;
  return (
    <Card title="Supervising" description="Projects and tasks you are responsible for">
      <div className="space-y-5">
        {projects.length > 0 && (
          <div className="space-y-3">
            <SubHeading>
              Projects{moreLabel(projects.length, totalProjects) ? ` · ${moreLabel(projects.length, totalProjects)}` : ""}
            </SubHeading>
            {projects.map((p) => (
              <ProjectLine key={p.id} project={p} />
            ))}
          </div>
        )}
        {tasks.length > 0 && (
          <div className="space-y-3">
            <SubHeading>
              Tasks{moreLabel(tasks.length, totalTasks) ? ` · ${moreLabel(tasks.length, totalTasks)}` : ""}
            </SubHeading>
            {tasks.map((t) => (
              <TaskLine
                key={t.id}
                task={t}
                meta={
                  <>
                    <TaskStatusBadge status={t.status} /> ·{" "}
                    {t.members.length > 0 ? `Assigned to ${t.members.map((m) => m.name).join(", ")}` : "Unassigned"} ·{" "}
                    <DueLabel task={t} />
                  </>
                }
              />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

interface FollowingProps {
  tasks: TaskDto[];
  total: number;
}

/** Tasks the viewer follows. Renders nothing when they follow nothing. */
export function FollowingCard({ tasks, total }: FollowingProps) {
  if (tasks.length === 0) return null;
  const more = moreLabel(tasks.length, total);
  return (
    <Card title="Following" description={more ?? "Tasks you follow"}>
      <div className="space-y-3">
        {tasks.map((t) => (
          <TaskLine
            key={t.id}
            task={t}
            meta={
              <>
                <TaskStatusBadge status={t.status} /> · Supervisor {t.supervisor.name} · <DueLabel task={t} />
              </>
            }
          />
        ))}
      </div>
    </Card>
  );
}
