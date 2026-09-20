import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ProjectDto, TaskDto } from "@hrm-plus/shared";
import { Badge, Button, Card, PageHeader, Spinner } from "@hrm-plus/ui";
import { deleteProject, getProject } from "../../api/projects";
import { listTasks } from "../../api/tasks";
import { apiErrorMessage } from "../../utils/apiError";
import { AttachmentsPanel } from "../../components/projects/AttachmentsPanel";
import { CommentsPanel } from "../../components/projects/CommentsPanel";
import { ProjectFormModal } from "../../components/projects/ProjectFormModal";
import { TaskFormModal } from "../../components/projects/TaskFormModal";
import { TaskTable } from "../../components/projects/TaskTable";
import { PriorityBadge, ProgressBar, ProjectStatusBadge } from "../../components/projects/labels";
import { formatDate, humanize } from "../../components/projects/format";

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-800">{children}</dd>
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const projectId = Number(id);
  const navigate = useNavigate();

  const [project, setProject] = useState<ProjectDto | null>(null);
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [addingTask, setAddingTask] = useState(false);

  const loadTasks = useCallback(() => {
    setTasksLoading(true);
    listTasks({ projectId, pageSize: 100 })
      .then((res) => setTasks(res.items))
      .catch((err) => setError(apiErrorMessage(err, "Failed to load tasks")))
      .finally(() => setTasksLoading(false));
  }, [projectId]);

  useEffect(() => {
    setLoading(true);
    getProject(projectId)
      .then(setProject)
      .catch((err) => setError(apiErrorMessage(err, "Failed to load project")))
      .finally(() => setLoading(false));
    loadTasks();
  }, [projectId, loadTasks]);

  async function remove() {
    if (!project || !window.confirm(`Delete project "${project.title}"?`)) return;
    try {
      await deleteProject(project.id);
      navigate("/projects");
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to delete project"));
    }
  }

  // Task creation changes project progress/task count, so reload the project too.
  async function onTaskCreated(task: TaskDto) {
    loadTasks();
    getProject(projectId).then(setProject).catch(() => undefined);
    navigate(`/tasks/${task.id}`);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }
  if (!project) {
    return (
      <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
        {error ?? "Project not found"}
      </div>
    );
  }

  const viewer = project.viewer ?? { canManage: false, canCreateTasks: false };

  return (
    <div className="space-y-5">
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            {project.title}
            <ProjectStatusBadge status={project.status} />
          </span>
        }
        description={
          <span>
            <Link to="/projects" className="hover:underline">
              Projects
            </Link>{" "}
            / <span className="uppercase">{project.code}</span>
          </span>
        }
        actions={
          <>
            {viewer.canCreateTasks && <Button onClick={() => setAddingTask(true)}>New task</Button>}
            {viewer.canManage && (
              <Button variant="secondary" onClick={() => setEditing(true)}>
                Edit
              </Button>
            )}
            {viewer.canManage && (
              <Button variant="danger" onClick={remove}>
                Delete
              </Button>
            )}
          </>
        }
      />

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
      )}

      <Card title="Overview">
        <dl className="grid grid-cols-4 gap-x-6 gap-y-4">
          <Detail label="Client">{project.clientName ?? "Internal"}</Detail>
          <Detail label="Supervisor">{project.supervisor.name}</Detail>
          <Detail label="Priority">
            <PriorityBadge priority={project.priority} />
          </Detail>
          <Detail label="Contract">{humanize(project.contractType)}</Detail>
          <Detail label="Total amount">{project.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Detail>
          <Detail label="Estimated hours">{project.estimatedHours}</Detail>
          <Detail label="Start date">{formatDate(project.startDate)}</Detail>
          <Detail label="Target end">
            {project.deadlineType === "casual" ? "Casual (no fixed date)" : formatDate(project.targetEndDate)}
          </Detail>
          <Detail label="Progress">
            <ProgressBar value={project.progressPercentage} />
          </Detail>
          <Detail label="Members">
            {project.members.length === 0 ? "—" : project.members.map((m) => m.name).join(", ")}
          </Detail>
          <Detail label="Tags">
            {project.tags.length === 0 ? (
              "—"
            ) : (
              <span className="flex flex-wrap gap-1">
                {project.tags.map((t) => (
                  <Badge key={t}>{t}</Badge>
                ))}
              </span>
            )}
          </Detail>
        </dl>
        {project.description && (
          <p className="mt-5 pt-4 border-t border-slate-100 text-sm text-slate-700 whitespace-pre-wrap">
            {project.description}
          </p>
        )}
      </Card>

      <Card title="Tasks" description={`${tasks.length} task(s)`} noPadding>
        <div className="p-6">
          <TaskTable items={tasks} loading={tasksLoading} showProject={false} emptyText="No tasks in this project yet." />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-5 items-start">
        <CommentsPanel kind="project" ownerId={project.id} canModerate={viewer.canManage || viewer.canCreateTasks} />
        <AttachmentsPanel kind="project" ownerId={project.id} canModerate={viewer.canManage || viewer.canCreateTasks} />
      </div>

      <ProjectFormModal open={editing} onClose={() => setEditing(false)} project={project} onSaved={setProject} />
      <TaskFormModal
        open={addingTask}
        onClose={() => setAddingTask(false)}
        projectId={project.id}
        defaultSupervisorId={project.supervisor.id}
        onSaved={onTaskCreated}
      />
    </div>
  );
}
