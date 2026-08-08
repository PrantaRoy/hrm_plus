import { AssessmentQuestionType, UpsertAssessmentQuestionInput } from "@hrm-plus/shared";
import { Button, Checkbox, Field, Input, Textarea } from "@hrm-plus/ui";

interface AssessmentQuestionEditorProps {
  questions: UpsertAssessmentQuestionInput[];
  onChange: (next: UpsertAssessmentQuestionInput[]) => void;
}

const QUESTION_TYPE_LABELS: Record<AssessmentQuestionType, string> = {
  MCQ: "Multiple choice (single answer)",
  TRUE_FALSE: "True / False",
  MULTIPLE_SELECT: "Multiple choice (multiple answers)",
  SHORT_TEXT: "Short answer",
};

const emptyMcq: UpsertAssessmentQuestionInput = { type: "MCQ", prompt: "", options: ["", "", "", ""], correctOptionIndex: 0, points: 1 };
const emptyTrueFalse: UpsertAssessmentQuestionInput = { type: "TRUE_FALSE", prompt: "", correctOptionIndex: 0, points: 1 };
const emptyMultipleSelect: UpsertAssessmentQuestionInput = {
  type: "MULTIPLE_SELECT",
  prompt: "",
  options: ["", "", "", ""],
  correctOptionIndexes: [],
  points: 1,
};
const emptyShortText: UpsertAssessmentQuestionInput = { type: "SHORT_TEXT", prompt: "", points: 1 };

export function AssessmentQuestionEditor({ questions, onChange }: AssessmentQuestionEditorProps) {
  function updateQuestion(index: number, next: UpsertAssessmentQuestionInput) {
    onChange(questions.map((q, i) => (i === index ? next : q)));
  }

  function removeQuestion(index: number) {
    onChange(questions.filter((_, i) => i !== index));
  }

  function addOption(index: number, question: UpsertAssessmentQuestionInput & { options?: string[] }) {
    updateQuestion(index, { ...question, options: [...(question.options ?? []), ""] });
  }

  function removeOption(index: number, question: UpsertAssessmentQuestionInput & { options?: string[] }, optIndex: number) {
    const nextOptions = (question.options ?? []).filter((_, i) => i !== optIndex);
    if (question.type === "MCQ") {
      const correctOptionIndex =
        question.correctOptionIndex === optIndex ? 0 : question.correctOptionIndex! > optIndex ? question.correctOptionIndex! - 1 : question.correctOptionIndex;
      updateQuestion(index, { ...question, options: nextOptions, correctOptionIndex });
    } else if (question.type === "MULTIPLE_SELECT") {
      const correctOptionIndexes = (question.correctOptionIndexes ?? [])
        .filter((i) => i !== optIndex)
        .map((i) => (i > optIndex ? i - 1 : i));
      updateQuestion(index, { ...question, options: nextOptions, correctOptionIndexes });
    }
  }

  return (
    <div className="space-y-4">
      {questions.map((question, index) => (
        <div key={index} className="rounded-md border border-slate-200 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
              {QUESTION_TYPE_LABELS[question.type]} · Question {index + 1}
            </span>
            <Button type="button" size="sm" variant="danger" onClick={() => removeQuestion(index)}>
              Remove
            </Button>
          </div>

          <Field label="Prompt" required>
            <Textarea
              required
              rows={2}
              value={question.prompt}
              onChange={(e) => updateQuestion(index, { ...question, prompt: e.target.value })}
            />
          </Field>

          {question.type === "MCQ" && (
            <div className="space-y-2">
              {(question.options ?? []).map((opt, optIndex) => (
                <div key={optIndex} className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={question.correctOptionIndex === optIndex}
                    onChange={() => updateQuestion(index, { ...question, correctOptionIndex: optIndex })}
                  />
                  <Input
                    value={opt}
                    onChange={(e) => {
                      const nextOptions = [...(question.options ?? [])];
                      nextOptions[optIndex] = e.target.value;
                      updateQuestion(index, { ...question, options: nextOptions });
                    }}
                    placeholder={`Option ${optIndex + 1}`}
                  />
                  <Button type="button" size="sm" variant="ghost" onClick={() => removeOption(index, question, optIndex)}>
                    ✕
                  </Button>
                </div>
              ))}
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">Select the radio button next to the one correct answer.</p>
                <Button type="button" size="sm" variant="secondary" onClick={() => addOption(index, question)}>
                  Add Option
                </Button>
              </div>
            </div>
          )}

          {question.type === "TRUE_FALSE" && (
            <div className="space-y-1.5">
              {["True", "False"].map((label, optIndex) => (
                <label key={label} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    checked={question.correctOptionIndex === optIndex}
                    onChange={() => updateQuestion(index, { ...question, correctOptionIndex: optIndex })}
                  />
                  {label}
                </label>
              ))}
              <p className="text-xs text-slate-400">Select the correct answer.</p>
            </div>
          )}

          {question.type === "MULTIPLE_SELECT" && (
            <div className="space-y-2">
              {(question.options ?? []).map((opt, optIndex) => {
                const correctOptionIndexes = question.correctOptionIndexes ?? [];
                const checked = correctOptionIndexes.includes(optIndex);
                return (
                  <div key={optIndex} className="flex items-center gap-2">
                    <Checkbox
                      checked={checked}
                      onChange={() => {
                        const next = checked
                          ? correctOptionIndexes.filter((i) => i !== optIndex)
                          : [...correctOptionIndexes, optIndex];
                        updateQuestion(index, { ...question, correctOptionIndexes: next });
                      }}
                    />
                    <Input
                      value={opt}
                      onChange={(e) => {
                        const nextOptions = [...(question.options ?? [])];
                        nextOptions[optIndex] = e.target.value;
                        updateQuestion(index, { ...question, options: nextOptions });
                      }}
                      placeholder={`Option ${optIndex + 1}`}
                    />
                    <Button type="button" size="sm" variant="ghost" onClick={() => removeOption(index, question, optIndex)}>
                      ✕
                    </Button>
                  </div>
                );
              })}
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">Check every option that is a correct answer.</p>
                <Button type="button" size="sm" variant="secondary" onClick={() => addOption(index, question)}>
                  Add Option
                </Button>
              </div>
            </div>
          )}

          <Field label="Points" required>
            <Input
              type="number"
              min={1}
              max={100}
              required
              value={question.points}
              onChange={(e) => updateQuestion(index, { ...question, points: Number(e.target.value) })}
              className="w-24"
            />
          </Field>
        </div>
      ))}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={() => onChange([...questions, { ...emptyMcq }])}>
          Add MCQ Question
        </Button>
        <Button type="button" variant="secondary" onClick={() => onChange([...questions, { ...emptyTrueFalse }])}>
          Add True/False Question
        </Button>
        <Button type="button" variant="secondary" onClick={() => onChange([...questions, { ...emptyMultipleSelect }])}>
          Add Multiple-Answer Question
        </Button>
        <Button type="button" variant="secondary" onClick={() => onChange([...questions, { ...emptyShortText }])}>
          Add Short Answer Question
        </Button>
      </div>
    </div>
  );
}
