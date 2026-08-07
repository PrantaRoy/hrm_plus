import { UpsertAssessmentQuestionInput } from "@hrm-plus/shared";
import { Button, Field, Input, Select, Textarea } from "@hrm-plus/ui";

interface AssessmentQuestionEditorProps {
  questions: UpsertAssessmentQuestionInput[];
  onChange: (next: UpsertAssessmentQuestionInput[]) => void;
}

const emptyMcq: UpsertAssessmentQuestionInput = { type: "MCQ", prompt: "", options: ["", "", "", ""], correctOptionIndex: 0, points: 1 };
const emptyShortText: UpsertAssessmentQuestionInput = { type: "SHORT_TEXT", prompt: "", points: 1 };

export function AssessmentQuestionEditor({ questions, onChange }: AssessmentQuestionEditorProps) {
  function updateQuestion(index: number, next: UpsertAssessmentQuestionInput) {
    onChange(questions.map((q, i) => (i === index ? next : q)));
  }

  function removeQuestion(index: number) {
    onChange(questions.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      {questions.map((question, index) => (
        <div key={index} className="rounded-md border border-slate-200 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
              {question.type === "MCQ" ? "Multiple choice" : "Short answer"} · Question {index + 1}
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
                </div>
              ))}
              <p className="text-xs text-slate-400">Select the radio button next to the correct answer.</p>
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

      <div className="flex gap-2">
        <Button type="button" variant="secondary" onClick={() => onChange([...questions, { ...emptyMcq }])}>
          Add MCQ Question
        </Button>
        <Button type="button" variant="secondary" onClick={() => onChange([...questions, { ...emptyShortText }])}>
          Add Short Answer Question
        </Button>
      </div>
    </div>
  );
}
