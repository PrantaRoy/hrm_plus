import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AssessmentDto, UpsertAssessmentQuestionInput } from "@hrm-plus/shared";
import { Badge, Button, Card, Field, Input, PageHeader, Spinner, Textarea } from "@hrm-plus/ui";
import { generateAssessmentWithAi, getAssessment, publishAssessment, upsertAssessment } from "../../api/assessments";
import { getJob } from "../../api/jobs";
import { AssessmentQuestionEditor } from "./components/AssessmentQuestionEditor";

export default function AssessmentBuilder() {
  const { id } = useParams();
  const jobId = Number(id);

  const [jobTitle, setJobTitle] = useState("");
  const [assessment, setAssessment] = useState<AssessmentDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [title, setTitle] = useState("Assessment");
  const [instructions, setInstructions] = useState("");
  const [passThresholdPercent, setPassThresholdPercent] = useState(60);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState("");
  const [questions, setQuestions] = useState<UpsertAssessmentQuestionInput[]>([]);

  const [generating, setGenerating] = useState(false);
  const [mcqCount, setMcqCount] = useState(4);
  const [trueFalseCount, setTrueFalseCount] = useState(2);
  const [shortTextCount, setShortTextCount] = useState(2);
  const [customPrompt, setCustomPrompt] = useState("");

  function applyAssessment(a: AssessmentDto) {
    setAssessment(a);
    setTitle(a.title);
    setInstructions(a.instructions ?? "");
    setPassThresholdPercent(a.passThresholdPercent);
    setTimeLimitMinutes(a.timeLimitMinutes?.toString() ?? "");
    setQuestions(
      a.questions.map((q) => ({
        type: q.type,
        prompt: q.prompt,
        options: q.options ?? undefined,
        correctOptionIndex: q.correctOptionIndex ?? undefined,
        correctOptionIndexes: q.correctOptionIndexes ?? undefined,
        points: q.points,
        sortOrder: q.sortOrder,
      }))
    );
  }

  useEffect(() => {
    getJob(jobId).then((j) => setJobTitle(j.title)).catch(() => undefined);
    setLoading(true);
    getAssessment(jobId)
      .then(applyAssessment)
      .catch(() => setAssessment(null))
      .finally(() => setLoading(false));
  }, [jobId]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (questions.length === 0) {
      setError("Add at least one question");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const saved = await upsertAssessment(jobId, {
        title,
        instructions: instructions || undefined,
        passThresholdPercent,
        timeLimitMinutes: timeLimitMinutes ? Number(timeLimitMinutes) : null,
        questions,
      });
      applyAssessment(saved);
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to save assessment");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const generated = await generateAssessmentWithAi(jobId, {
        mcqCount,
        trueFalseCount,
        shortTextCount,
        passThresholdPercent,
        customPrompt: customPrompt.trim() || undefined,
      });
      applyAssessment(generated);
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to generate questions with AI");
    } finally {
      setGenerating(false);
    }
  }

  async function handlePublish() {
    if (!window.confirm("Publish this assessment? Candidates moved into AI Assessment will be invited to take it.")) return;
    setPublishing(true);
    setError(null);
    try {
      const published = await publishAssessment(jobId);
      applyAssessment(published);
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to publish assessment");
    } finally {
      setPublishing(false);
    }
  }

  const locked = assessment?.status === "Published";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-5">
      <PageHeader
        title={`${jobTitle || "Job"} · Assessment`}
        description={
          <span className="flex items-center gap-3">
            <Link to="/jobs" className="text-brand-600 hover:underline">
              Back to jobs
            </Link>
            {assessment && <Badge color={assessment.status === "Published" ? "green" : "slate"}>{assessment.status}</Badge>}
          </span>
        }
        actions={
          assessment &&
          assessment.status !== "Published" && (
            <Button isLoading={publishing} onClick={handlePublish}>
              Publish
            </Button>
          )
        }
      />

      {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}

      <Card title="Generate with AI" description="Draft job-specific questions with AI, then review and edit before publishing.">
        <div className="space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <Field label="MCQ count">
              <Input type="number" min={0} max={20} value={mcqCount} onChange={(e) => setMcqCount(Number(e.target.value))} className="w-24" />
            </Field>
            <Field label="True/False count">
              <Input
                type="number"
                min={0}
                max={20}
                value={trueFalseCount}
                onChange={(e) => setTrueFalseCount(Number(e.target.value))}
                className="w-24"
              />
            </Field>
            <Field label="Short answer count">
              <Input
                type="number"
                min={0}
                max={20}
                value={shortTextCount}
                onChange={(e) => setShortTextCount(Number(e.target.value))}
                className="w-24"
              />
            </Field>
          </div>
          <Field label="Custom prompt (optional)" helperText="Steer the AI, e.g. 'focus on React hooks and state management'.">
            <Textarea rows={2} value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} />
          </Field>
          <Button type="button" variant="secondary" isLoading={generating} disabled={locked} onClick={handleGenerate}>
            Generate with AI
          </Button>
        </div>
      </Card>

      <Card>
        <form onSubmit={handleSave} className="space-y-4">
          <fieldset disabled={locked} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <Field label="Title" required>
                <Input required value={title} onChange={(e) => setTitle(e.target.value)} />
              </Field>
              <Field label="Passing threshold (%)" required>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  required
                  value={passThresholdPercent}
                  onChange={(e) => setPassThresholdPercent(Number(e.target.value))}
                />
              </Field>
              <Field label="Time limit (minutes)" helperText="Leave blank for untimed">
                <Input
                  type="number"
                  min={1}
                  max={600}
                  value={timeLimitMinutes}
                  onChange={(e) => setTimeLimitMinutes(e.target.value)}
                />
              </Field>
            </div>
            <Field label="Instructions">
              <Textarea rows={3} value={instructions} onChange={(e) => setInstructions(e.target.value)} />
            </Field>

            <AssessmentQuestionEditor questions={questions} onChange={setQuestions} />

            <Button type="submit" isLoading={submitting}>
              Save Assessment
            </Button>
          </fieldset>
          {locked && <p className="text-xs text-slate-400">Published assessments are locked once candidates may have been invited.</p>}
        </form>
      </Card>
    </div>
  );
}
