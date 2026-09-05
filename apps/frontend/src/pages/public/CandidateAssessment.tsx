import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import { TENANT_HEADER } from "@hrm-plus/shared";
import type { PublicAssessmentMetaDto, PublicCurrentQuestionDto } from "@hrm-plus/shared";
import { CheckCircle2, Clock } from "lucide-react";
import { Button, Card, Field, Logo, Spinner, Textarea } from "@hrm-plus/ui";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

type AnswerValue = { selectedOptionIndex?: number; selectedOptionIndexes?: number[]; textAnswer?: string };

const TERMINAL_STATUSES = new Set(["SUBMITTED", "GRADING", "GRADED", "EXPIRED"]);

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function CandidateAssessment() {
  const { tenantSlug } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [meta, setMeta] = useState<PublicAssessmentMetaDto | null>(null);
  const [current, setCurrent] = useState<PublicCurrentQuestionDto | null>(null);
  const [answer, setAnswer] = useState<AnswerValue>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  // Clock offset lets the client countdown track the server clock rather than its
  // own (possibly wrong/tampered) one. It's UX only — actual enforcement of the
  // deadline/timer always happens server-side, on every answer/question request.
  const clockOffsetMsRef = useRef(0);

  function headers() {
    return { [TENANT_HEADER]: tenantSlug ?? "", "X-Candidate-Token": token ?? "" };
  }

  const loadTerminalOrCurrentQuestion = useCallback(
    async (metaDto: PublicAssessmentMetaDto) => {
      if (TERMINAL_STATUSES.has(metaDto.status)) {
        setDone(true);
        return;
      }
      const res = await axios.get<PublicCurrentQuestionDto>(`${baseURL}/public/assessment/current-question`, { headers: headers() });
      setCurrent(res.data);
      setAnswer({});
    },
    [tenantSlug, token]
  );

  useEffect(() => {
    if (!tenantSlug || !token) return;
    axios
      .get<PublicAssessmentMetaDto>(`${baseURL}/public/assessment`, { headers: headers() })
      .then(async (res) => {
        setMeta(res.data);
        clockOffsetMsRef.current = new Date(res.data.serverNow).getTime() - Date.now();
        await loadTerminalOrCurrentQuestion(res.data);
      })
      .catch(() => setLoadError("This assessment link is invalid or has expired."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantSlug, token]);

  useEffect(() => {
    const examExpiresAt = current?.examExpiresAt ?? meta?.examExpiresAt;
    if (!examExpiresAt || done) {
      setRemainingMs(null);
      return;
    }
    const expiresAtMs = new Date(examExpiresAt).getTime();
    const tick = () => {
      const now = Date.now() + clockOffsetMsRef.current;
      const remaining = expiresAtMs - now;
      setRemainingMs(remaining);
      if (remaining <= 0) {
        setTimedOut(true);
        setDone(true);
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [current?.examExpiresAt, meta?.examExpiresAt, done]);

  // Deterrents only — trivially bypassable (devtools, browser extensions). There is
  // no server-side way to actually detect copy/paste; the real integrity control is
  // the server-authoritative one-question-at-a-time flow + timer enforcement.
  function blockClipboardEvent(e: React.SyntheticEvent) {
    e.preventDefault();
  }

  async function handleSubmitAnswer() {
    if (!current) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await axios.post(
        `${baseURL}/public/assessment/answer`,
        {
          questionId: current.question.id,
          selectedOptionIndex: answer.selectedOptionIndex,
          selectedOptionIndexes: answer.selectedOptionIndexes,
          textAnswer: answer.textAnswer,
        },
        { headers: headers() }
      );
      if (res.data.isComplete) {
        setDone(true);
        setCurrent(null);
      } else {
        setCurrent(res.data.nextQuestion);
        setAnswer({});
      }
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 409 || status === 410) {
        setTimedOut(status === 410);
        setDone(true);
        setCurrent(null);
      } else {
        setSubmitError(err.response?.data?.error?.message ?? "Failed to submit your answer. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit =
    !!current &&
    ((current.question.type === "MCQ" || current.question.type === "TRUE_FALSE") && answer.selectedOptionIndex != null
      ? true
      : current.question.type === "MULTIPLE_SELECT" && (answer.selectedOptionIndexes?.length ?? 0) > 0
        ? true
        : current.question.type === "SHORT_TEXT" && !!answer.textAnswer?.trim());

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (loadError || !meta) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <Card>
          <p className="text-sm text-red-700">{loadError}</p>
        </Card>
      </div>
    );
  }

  if (done || !current) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <Card>
          <div className="flex flex-col items-center gap-3 text-center max-w-sm">
            <CheckCircle2 className="h-14 w-14 text-green-500" />
            <p className="text-lg font-semibold text-slate-900">
              {timedOut ? "Time's up" : "Assessment submitted"}
            </p>
            <p className="text-sm text-slate-500">
              {timedOut
                ? "Your time ran out, so your assessment was submitted automatically with the answers you gave."
                : "Thanks for completing your assessment. We'll be in touch about next steps via your application portal."}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-slate-50 px-4 py-10 select-none"
      onContextMenu={blockClipboardEvent}
      onCopy={blockClipboardEvent}
      onCut={blockClipboardEvent}
      onPaste={blockClipboardEvent}
    >
      <div className="mx-auto w-full max-w-2xl space-y-5">
        <div className="flex justify-center">
          <Logo size="sm" />
        </div>

        <Card
          title={meta.title}
          description={
            <span className="flex items-center justify-between gap-3">
              <span>
                Question {current.questionNumber} of {current.totalQuestions}
              </span>
              {remainingMs != null && (
                <span className={`flex items-center gap-1 font-medium ${remainingMs < 60_000 ? "text-red-600" : "text-slate-600"}`}>
                  <Clock className="h-4 w-4" />
                  {formatCountdown(remainingMs)}
                </span>
              )}
            </span>
          }
        >
          <div className="space-y-5">
            {submitError && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{submitError}</div>}

            <Field label={current.question.prompt} required>
              {(current.question.type === "MCQ" || current.question.type === "TRUE_FALSE") && (
                <div className="space-y-1.5">
                  {current.question.options?.map((opt, optIndex) => (
                    <label key={opt} className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="radio"
                        name={`question-${current.question.id}`}
                        checked={answer.selectedOptionIndex === optIndex}
                        onChange={() => setAnswer({ selectedOptionIndex: optIndex })}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              )}
              {current.question.type === "MULTIPLE_SELECT" && (
                <div className="space-y-1.5">
                  {current.question.options?.map((opt, optIndex) => {
                    const selected = answer.selectedOptionIndexes ?? [];
                    const checked = selected.includes(optIndex);
                    return (
                      <label key={opt} className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const next = e.target.checked ? [...selected, optIndex] : selected.filter((i) => i !== optIndex);
                            setAnswer({ selectedOptionIndexes: next });
                          }}
                        />
                        {opt}
                      </label>
                    );
                  })}
                </div>
              )}
              {current.question.type === "SHORT_TEXT" && (
                <Textarea rows={4} value={answer.textAnswer ?? ""} onChange={(e) => setAnswer({ textAnswer: e.target.value })} />
              )}
            </Field>

            <p className="text-xs text-slate-400">
              Once you submit this answer you'll move to the next question — there's no going back or skipping.
            </p>

            <Button onClick={handleSubmitAnswer} isLoading={submitting} disabled={!canSubmit}>
              {current.questionNumber === current.totalQuestions ? "Submit" : "Next"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
