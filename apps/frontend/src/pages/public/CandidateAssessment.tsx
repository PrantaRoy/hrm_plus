import { FormEvent, useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import { TENANT_HEADER } from "@hrm-plus/shared";
import type { PublicAssessmentDto } from "@hrm-plus/shared";
import { CheckCircle2 } from "lucide-react";
import { Button, Card, Field, Logo, Spinner, Textarea } from "@hrm-plus/ui";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

type AnswerValue = { selectedOptionIndex?: number; textAnswer?: string };

export default function CandidateAssessment() {
  const { tenantSlug } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [assessment, setAssessment] = useState<PublicAssessmentDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, AnswerValue>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function headers() {
    return { [TENANT_HEADER]: tenantSlug ?? "", "X-Candidate-Token": token ?? "" };
  }

  useEffect(() => {
    if (!tenantSlug || !token) return;
    axios
      .get<PublicAssessmentDto>(`${baseURL}/public/assessment`, { headers: headers() })
      .then((res) => setAssessment(res.data))
      .catch(() => setLoadError("This assessment link is invalid or has expired."))
      .finally(() => setLoading(false));
  }, [tenantSlug, token]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!assessment) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await axios.post(
        `${baseURL}/public/assessment/submit`,
        {
          answers: assessment.questions.map((q) => ({
            questionId: q.id,
            selectedOptionIndex: answers[q.id]?.selectedOptionIndex,
            textAnswer: answers[q.id]?.textAnswer,
          })),
        },
        { headers: headers() }
      );
      setSubmitted(true);
    } catch (err: any) {
      setSubmitError(err.response?.data?.error?.message ?? "Failed to submit your assessment. Please try again.");
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

  if (loadError || !assessment) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <Card>
          <p className="text-sm text-red-700">{loadError}</p>
        </Card>
      </div>
    );
  }

  const alreadyDone = assessment.status === "SUBMITTED" || assessment.status === "GRADING" || assessment.status === "GRADED";

  if (submitted || alreadyDone) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <Card>
          <div className="flex flex-col items-center gap-3 text-center max-w-sm">
            <CheckCircle2 className="h-14 w-14 text-green-500" />
            <p className="text-lg font-semibold text-slate-900">Assessment submitted</p>
            <p className="text-sm text-slate-500">
              Thanks for completing your assessment. We'll be in touch about next steps via your application portal.
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

        <Card title={assessment.title} description={assessment.instructions ?? undefined}>
          <form onSubmit={handleSubmit} className="space-y-5">
            {submitError && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{submitError}</div>}

            {assessment.questions.map((q, index) => (
              <Field key={q.id} label={`${index + 1}. ${q.prompt}`} required>
                {q.type === "MCQ" ? (
                  <div className="space-y-1.5">
                    {q.options?.map((opt, optIndex) => (
                      <label key={opt} className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="radio"
                          required
                          name={`question-${q.id}`}
                          checked={answers[q.id]?.selectedOptionIndex === optIndex}
                          onChange={() => setAnswers((a) => ({ ...a, [q.id]: { selectedOptionIndex: optIndex } }))}
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                ) : (
                  <Textarea
                    required
                    rows={3}
                    value={answers[q.id]?.textAnswer ?? ""}
                    onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: { textAnswer: e.target.value } }))}
                  />
                )}
              </Field>
            ))}

            <Button type="submit" isLoading={submitting}>
              Submit Assessment
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
