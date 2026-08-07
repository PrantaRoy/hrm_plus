import { JobScreeningQuestionInput, ScreeningQuestionDto } from "@hrm-plus/shared";
import { Checkbox } from "@hrm-plus/ui";

interface ScreeningQuestionPickerProps {
  allQuestions: ScreeningQuestionDto[];
  selected: JobScreeningQuestionInput[];
  onChange: (next: JobScreeningQuestionInput[]) => void;
}

export function ScreeningQuestionPicker({ allQuestions, selected, onChange }: ScreeningQuestionPickerProps) {
  const selectedByQuestionId = new Map(selected.map((s) => [s.questionId, s]));

  function toggle(questionId: number) {
    if (selectedByQuestionId.has(questionId)) {
      onChange(selected.filter((s) => s.questionId !== questionId));
    } else {
      onChange([...selected, { questionId, isMandatory: true, sortOrder: selected.length }]);
    }
  }

  function toggleMandatory(questionId: number) {
    onChange(selected.map((s) => (s.questionId === questionId ? { ...s, isMandatory: !s.isMandatory } : s)));
  }

  return (
    <div className="space-y-2 max-h-80 overflow-y-auto rounded-md border border-slate-200 p-3">
      {allQuestions.length === 0 && <p className="text-sm text-slate-400">No screening questions in the bank yet.</p>}
      {allQuestions.map((question) => {
        const sel = selectedByQuestionId.get(question.id);
        return (
          <div key={question.id} className="flex items-start gap-3 border-b border-slate-100 pb-2 last:border-0 last:pb-0">
            <Checkbox checked={Boolean(sel)} onChange={() => toggle(question.id)} className="mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-slate-800">{question.text}</p>
              <p className="text-xs text-slate-400">
                {question.type}
                {question.category === "LegalCompliance" && " · Legal/Compliance"}
              </p>
            </div>
            {sel && (
              <label className="flex items-center gap-1.5 text-xs text-slate-500 whitespace-nowrap">
                <Checkbox checked={sel.isMandatory} onChange={() => toggleMandatory(question.id)} />
                Mandatory
              </label>
            )}
          </div>
        );
      })}
    </div>
  );
}
