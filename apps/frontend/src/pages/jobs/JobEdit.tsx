import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { DepartmentDto, JOB_TYPES, JobDto, JobScreeningQuestionInput, SALARY_TYPES, ScreeningQuestionDto } from "@hrm-plus/shared";
import { Button, Card, Field, Input, PageHeader, Select, Spinner, Textarea } from "@hrm-plus/ui";
import { getJob, updateJob } from "../../api/jobs";
import { listDepartments } from "../../api/departments";
import { listScreeningQuestions } from "../../api/screeningQuestions";
import { ScreeningQuestionPicker } from "./components/ScreeningQuestionPicker";
import { useAuth } from "../../auth/AuthContext";

function applyUrl(tenantSlug: string, jobSlug: string): string {
  return `${window.location.origin}/jobs/${tenantSlug}/${jobSlug}/apply`;
}

export default function JobEdit() {
  const { id } = useParams();
  const jobId = Number(id);
  const navigate = useNavigate();
  const { tenantSlug } = useAuth();

  const [job, setJob] = useState<JobDto | null>(null);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [allQuestions, setAllQuestions] = useState<ScreeningQuestionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const [title, setTitle] = useState("");
  const [vacancyCount, setVacancyCount] = useState(1);
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState("");
  const [minExperienceYears, setMinExperienceYears] = useState("");
  const [maxExperienceYears, setMaxExperienceYears] = useState("");
  const [jobType, setJobType] = useState<(typeof JOB_TYPES)[number]>("FULL_TIME");
  const [salaryType, setSalaryType] = useState<(typeof SALARY_TYPES)[number]>("ANNUAL");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [description, setDescription] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [closesAt, setClosesAt] = useState("");
  const [screeningQuestions, setScreeningQuestions] = useState<JobScreeningQuestionInput[]>([]);

  useEffect(() => {
    listDepartments().then(setDepartments).catch(() => setDepartments([]));
    listScreeningQuestions().then(setAllQuestions).catch(() => setAllQuestions([]));
    setLoading(true);
    getJob(jobId)
      .then((j) => {
        setJob(j);
        setTitle(j.title);
        setVacancyCount(j.vacancyCount);
        setLocation(j.location ?? "");
        setSkills(j.skills.join(", "));
        setMinExperienceYears(j.minExperienceYears?.toString() ?? "");
        setMaxExperienceYears(j.maxExperienceYears?.toString() ?? "");
        setJobType(j.jobType);
        setSalaryType(j.salaryType);
        setSalaryMin(j.salaryMin?.toString() ?? "");
        setSalaryMax(j.salaryMax?.toString() ?? "");
        setDescription(j.description);
        setDepartmentId(j.departmentId?.toString() ?? "");
        setClosesAt(j.closesAt?.slice(0, 10) ?? "");
        setScreeningQuestions(j.screeningQuestions.map((q) => ({ questionId: q.questionId, isMandatory: q.isMandatory, sortOrder: q.sortOrder })));
      })
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load job"))
      .finally(() => setLoading(false));
  }, [jobId]);

  const screeningQuestionsLocked = (job?.applicationCount ?? 0) > 0;

  async function handleCopyLink() {
    if (!tenantSlug || !job) return;
    await navigator.clipboard.writeText(applyUrl(tenantSlug, job.slug));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const updated = await updateJob(jobId, {
        title,
        vacancyCount,
        location: location || undefined,
        skills: skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        minExperienceYears: minExperienceYears ? Number(minExperienceYears) : undefined,
        maxExperienceYears: maxExperienceYears ? Number(maxExperienceYears) : undefined,
        jobType,
        salaryType,
        salaryMin: salaryMin ? Number(salaryMin) : undefined,
        salaryMax: salaryMax ? Number(salaryMax) : undefined,
        description,
        departmentId: departmentId ? Number(departmentId) : undefined,
        closesAt: closesAt || undefined,
        screeningQuestions: screeningQuestionsLocked ? undefined : screeningQuestions,
      });
      setJob(updated);
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to update job");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !job) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-5">
      <PageHeader
        title={job.title}
        description={
          <span className="flex items-center gap-3">
            <Link to="/jobs" className="text-brand-600 hover:underline">
              Back to jobs
            </Link>
            <Link to={`/jobs/${job.id}/pipeline`} className="text-brand-600 hover:underline">
              Pipeline
            </Link>
            <Link to={`/jobs/${job.id}/assessment`} className="text-brand-600 hover:underline">
              Assessment
            </Link>
          </span>
        }
      />

      <Card title="Candidate application link">
        {job.status === "Open" && tenantSlug ? (
          <div className="flex items-center gap-2">
            <Input readOnly value={applyUrl(tenantSlug, job.slug)} className="font-mono text-xs" />
            <Button type="button" variant="secondary" onClick={handleCopyLink}>
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Publish this job to get a shareable application link.</p>
        )}
      </Card>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}

          <Field label="Title" required>
            <Input required value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Vacancies" required>
              <Input type="number" min={1} required value={vacancyCount} onChange={(e) => setVacancyCount(Number(e.target.value))} />
            </Field>
            <Field label="Min experience (years)">
              <Input type="number" min={0} value={minExperienceYears} onChange={(e) => setMinExperienceYears(e.target.value)} />
            </Field>
            <Field label="Max experience (years)">
              <Input type="number" min={0} value={maxExperienceYears} onChange={(e) => setMaxExperienceYears(e.target.value)} />
            </Field>
          </div>

          <Field label="Skills" helperText="Comma-separated">
            <Input value={skills} onChange={(e) => setSkills(e.target.value)} />
          </Field>

          <Field label="Location" helperText="City/region, or 'Remote'">
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Auckland, or Remote" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Job type" required>
              <Select value={jobType} onChange={(e) => setJobType(e.target.value as typeof jobType)}>
                {JOB_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace("_", " ")}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Department">
              <Select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
                <option value="">None</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Salary type" required>
              <Select value={salaryType} onChange={(e) => setSalaryType(e.target.value as typeof salaryType)}>
                {SALARY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Salary min">
              <Input type="number" min={0} value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} />
            </Field>
            <Field label="Salary max">
              <Input type="number" min={0} value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} />
            </Field>
          </div>

          <Field label="Closing date">
            <Input type="date" value={closesAt} onChange={(e) => setClosesAt(e.target.value)} />
          </Field>

          <Field label="Description" required>
            <Textarea rows={8} required value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>

          <Field
            label="Screening questions"
            helperText={screeningQuestionsLocked ? "Locked — this job already has applications." : undefined}
          >
            {screeningQuestionsLocked ? (
              <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
                {job.screeningQuestions.map((q) => (
                  <li key={q.id}>
                    {q.questionText} {q.isMandatory && <span className="text-xs text-slate-400">(mandatory)</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <ScreeningQuestionPicker allQuestions={allQuestions} selected={screeningQuestions} onChange={setScreeningQuestions} />
            )}
          </Field>

          <Button type="submit" isLoading={submitting}>
            Save Changes
          </Button>
        </form>
      </Card>
    </div>
  );
}
