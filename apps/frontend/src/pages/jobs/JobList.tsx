import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { JobDto } from "@hrm-plus/shared";
import {
  Badge,
  BadgeColor,
  Button,
  EmptyState,
  PageHeader,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@hrm-plus/ui";
import { closeJob, deleteJob, listJobs, publishJob } from "../../api/jobs";
import { useAuth } from "../../auth/AuthContext";

const statusColor: Record<JobDto["status"], BadgeColor> = {
  Draft: "slate",
  Open: "green",
  Closed: "amber",
  Archived: "red",
};

function applyUrl(tenantSlug: string, jobSlug: string): string {
  return `${window.location.origin}/jobs/${tenantSlug}/${jobSlug}/apply`;
}

export default function JobList() {
  const { tenantSlug } = useAuth();
  const [jobs, setJobs] = useState<JobDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedJobId, setCopiedJobId] = useState<number | null>(null);

  function refresh() {
    setLoading(true);
    listJobs()
      .then(setJobs)
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load jobs"))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  async function handlePublish(id: number) {
    setError(null);
    try {
      await publishJob(id);
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to publish job");
    }
  }

  async function handleClose(id: number) {
    setError(null);
    try {
      await closeJob(id);
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to close job");
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Delete this draft job circular?")) return;
    setError(null);
    try {
      await deleteJob(id);
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to delete job");
    }
  }

  async function handleCopyLink(job: JobDto) {
    if (!tenantSlug) return;
    await navigator.clipboard.writeText(applyUrl(tenantSlug, job.slug));
    setCopiedJobId(job.id);
    setTimeout(() => setCopiedJobId((current) => (current === job.id ? null : current)), 2000);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Job Circulars"
        description="Create and manage job postings, screening questions, and the hiring pipeline."
        actions={
          <Link
            to="/jobs/new"
            className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Create Job
          </Link>
        }
      />

      {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}

      {!loading && jobs.length === 0 ? (
        <EmptyState title="No job circulars yet" description="Create your first job posting to start receiving applications." />
      ) : (
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Title</TableHeaderCell>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell>Vacancies</TableHeaderCell>
              <TableHeaderCell>Applications</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </tr>
          </TableHead>
          <tbody>
            {loading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-slate-400 py-6">
                  Loading...
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>
                    <Link to={`/jobs/${job.id}/edit`} className="font-medium text-brand-600 hover:underline">
                      {job.title}
                    </Link>
                  </TableCell>
                  <TableCell>{job.jobType.replace("_", " ")}</TableCell>
                  <TableCell>{job.vacancyCount}</TableCell>
                  <TableCell>{job.applicationCount}</TableCell>
                  <TableCell>
                    <Badge color={statusColor[job.status]}>{job.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Link to={`/jobs/${job.id}/pipeline`} className="text-sm text-brand-600 hover:underline mr-3">
                      Pipeline
                    </Link>
                    <Link to={`/jobs/${job.id}/assessment`} className="text-sm text-brand-600 hover:underline mr-3">
                      Assessment
                    </Link>
                    {job.status === "Draft" && (
                      <>
                        <Button size="sm" onClick={() => handlePublish(job.id)} className="mr-2">
                          Publish
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleDelete(job.id)}>
                          Delete
                        </Button>
                      </>
                    )}
                    {job.status === "Open" && (
                      <>
                        <Button size="sm" variant="secondary" onClick={() => handleCopyLink(job)} className="mr-2">
                          {copiedJobId === job.id ? "Copied!" : "Copy Application Link"}
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => handleClose(job.id)}>
                          Close
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
