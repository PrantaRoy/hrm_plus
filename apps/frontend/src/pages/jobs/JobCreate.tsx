import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DepartmentDto, JOB_TYPES, JobScreeningQuestionInput, SALARY_TYPES, ScreeningQuestionDto } from "@hrm-plus/shared";
import { Button, Card, Field, Input, PageHeader, Select, Textarea } from "@hrm-plus/ui";
import { createJob } from "../../api/jobs";
import { listDepartments } from "../../api/departments";
import { listScreeningQuestions } from "../../api/screeningQuestions";
import { ScreeningQuestionPicker } from "./components/ScreeningQuestionPicker";

export default function JobCreate() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [allQuestions, setAllQuestions] = useState<ScreeningQuestionDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
  const [assessmentDeadlineDays, setAssessmentDeadlineDays] = useState("");
  const [screeningQuestions, setScreeningQuestions] = useState<JobScreeningQuestionInput[]>([]);

  useEffect(() => {
    listDepartments().then(setDepartments).catch(() => setDepartments([]));
    listScreeningQuestions().then(setAllQuestions).catch(() => setAllQuestions([]));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const created = await createJob({
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
        assessmentDeadlineDays: assessmentDeadlineDays ? Number(assessmentDeadlineDays) : undefined,
        screeningQuestions,
      });
      navigate(`/jobs/${created.id}/edit`);
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to create job");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-5">
      <PageHeader title="New Job Circular" description="Create a job posting and attach screening questions." />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}

          <Field label="Title" required>
            <Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Senior Electrician" />
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Vacancies" required>
              <Input
                type="number"
                min={1}
                required
                value={vacancyCount}
                onChange={(e) => setVacancyCount(Number(e.target.value))}
              />
            </Field>
            <Field label="Min experience (years)">
              <Input
                type="number"
                min={0}
                value={minExperienceYears}
                onChange={(e) => setMinExperienceYears(e.target.value)}
              />
            </Field>
            <Field label="Max experience (years)">
              <Input
                type="number"
                min={0}
                value={maxExperienceYears}
                onChange={(e) => setMaxExperienceYears(e.target.value)}
              />
            </Field>
          </div>

          <Field label="Skills" helperText="Comma-separated, e.g. Electrical Wiring, Fault Diagnosis">
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

          <div className="grid grid-cols-2 gap-3">
            <Field label="Closing date">
              <Input type="date" value={closesAt} onChange={(e) => setClosesAt(e.target.value)} />
            </Field>
            <Field
              label="Screening test deadline (days)"
              helperText="Days after applying a candidate has to complete the screening test, if one is attached. Leave blank for no deadline."
            >
              <Input
                type="number"
                min={1}
                value={assessmentDeadlineDays}
                onChange={(e) => setAssessmentDeadlineDays(e.target.value)}
              />
            </Field>
          </div>

          <Field label="Description" required>
            <Textarea rows={8} required value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>

          <Field label="Screening questions">
            <ScreeningQuestionPicker allQuestions={allQuestions} selected={screeningQuestions} onChange={setScreeningQuestions} />
          </Field>

          <Button type="submit" isLoading={submitting}>
            Create Job
          </Button>
        </form>
      </Card>
    </div>
  );
}
