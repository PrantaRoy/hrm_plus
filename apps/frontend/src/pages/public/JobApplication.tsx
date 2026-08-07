import { FormEvent, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { TENANT_HEADER } from "@hrm-plus/shared";
import type { PublicJobDto } from "@hrm-plus/shared";
import { CheckCircle2 } from "lucide-react";
import { Button, Card, Field, Input, Logo, Select, Spinner, Textarea } from "@hrm-plus/ui";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

type AnswerValue = string | string[];

export default function JobApplication() {
  const { tenantSlug, jobSlug } = useParams();
  const [job, setJob] = useState<PublicJobDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [answers, setAnswers] = useState<Record<number, AnswerValue>>({});

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!tenantSlug || !jobSlug) return;
    axios
      .get<PublicJobDto>(`${baseURL}/public/jobs/${jobSlug}`, { headers: { [TENANT_HEADER]: tenantSlug } })
      .then((res) => setJob(res.data))
      .catch(() => setLoadError("This job posting could not be found, or is no longer open."))
      .finally(() => setLoading(false));
  }, [tenantSlug, jobSlug]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!tenantSlug || !jobSlug || !job) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const formData = new FormData();
      formData.append("fullName", fullName);
      formData.append("email", email);
      if (phoneNumber) formData.append("phoneNumber", phoneNumber);
      if (coverLetter) formData.append("coverLetter", coverLetter);
      if (resume) formData.append("resume", resume);
      formData.append(
        "answers",
        JSON.stringify(
          job.screeningQuestions.map((q) => {
            const value = answers[q.jobScreeningQuestionId];
            return {
              jobScreeningQuestionId: q.jobScreeningQuestionId,
              answerText: Array.isArray(value) ? undefined : (value as string | undefined),
              answerOptions: Array.isArray(value) ? value : undefined,
            };
          })
        )
      );

      await axios.post(`${baseURL}/public/applications/${jobSlug}`, formData, {
        headers: { [TENANT_HEADER]: tenantSlug },
      });
      setSubmitted(true);
    } catch (err: any) {
      setSubmitError(err.response?.data?.error?.message ?? "Failed to submit your application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (loadError || !job) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <Card>
          <p className="text-sm text-red-700">{loadError}</p>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <Card>
          <div className="flex flex-col items-center gap-3 text-center max-w-sm">
            <CheckCircle2 className="h-14 w-14 text-green-500" />
            <p className="text-lg font-semibold text-slate-900">Application submitted</p>
            <p className="text-sm text-slate-500">
              Thanks for applying, {fullName}. We've emailed you a link to track your application.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-2xl space-y-5">
        <div className="flex justify-center">
          <Logo size="sm" />
        </div>

        <Card title={job.title} description={`${job.jobType.replace("_", " ")} · ${job.skills.join(", ")}`}>
          <p className="text-sm text-slate-600 whitespace-pre-wrap">{job.description}</p>
        </Card>

        <Card title="Apply for this role">
          <form onSubmit={handleSubmit} className="space-y-4">
            {submitError && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{submitError}</div>}

            <div className="grid grid-cols-2 gap-3">
              <Field label="Full name" required>
                <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </Field>
              <Field label="Email" required>
                <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
            </div>
            <Field label="Phone number">
              <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
            </Field>
            <Field label="Cover letter">
              <Textarea rows={5} value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} />
            </Field>
            <Field label="CV / Resume" helperText="PDF or Word document, up to 10MB">
              <input
                type="file"
                accept="application/pdf,.doc,.docx"
                onChange={(e) => setResume(e.target.files?.[0] ?? null)}
                className="text-sm"
              />
            </Field>

            {job.screeningQuestions.map((q) => (
              <Field key={q.jobScreeningQuestionId} label={q.questionText} required={q.isMandatory}>
                {q.questionType === "YES_NO" && (
                  <Select
                    required={q.isMandatory}
                    value={(answers[q.jobScreeningQuestionId] as string) ?? ""}
                    onChange={(e) => setAnswers((a) => ({ ...a, [q.jobScreeningQuestionId]: e.target.value }))}
                  >
                    <option value="">Select…</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </Select>
                )}
                {q.questionType === "SINGLE_CHOICE" && (
                  <Select
                    required={q.isMandatory}
                    value={(answers[q.jobScreeningQuestionId] as string) ?? ""}
                    onChange={(e) => setAnswers((a) => ({ ...a, [q.jobScreeningQuestionId]: e.target.value }))}
                  >
                    <option value="">Select…</option>
                    {q.questionOptions?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </Select>
                )}
                {q.questionType === "MULTIPLE_CHOICE" && (
                  <div className="space-y-1">
                    {q.questionOptions?.map((opt) => {
                      const current = (answers[q.jobScreeningQuestionId] as string[]) ?? [];
                      const checked = current.includes(opt);
                      return (
                        <label key={opt} className="flex items-center gap-2 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const next = e.target.checked ? [...current, opt] : current.filter((o) => o !== opt);
                              setAnswers((a) => ({ ...a, [q.jobScreeningQuestionId]: next }));
                            }}
                          />
                          {opt}
                        </label>
                      );
                    })}
                  </div>
                )}
                {q.questionType === "SHORT_TEXT" && (
                  <Textarea
                    required={q.isMandatory}
                    rows={2}
                    value={(answers[q.jobScreeningQuestionId] as string) ?? ""}
                    onChange={(e) => setAnswers((a) => ({ ...a, [q.jobScreeningQuestionId]: e.target.value }))}
                  />
                )}
              </Field>
            ))}

            <Button type="submit" isLoading={submitting}>
              Submit Application
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
