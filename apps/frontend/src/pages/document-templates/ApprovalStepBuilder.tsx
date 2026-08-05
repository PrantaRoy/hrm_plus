import { ApproverType, RoleDto } from "@hrm-plus/shared";
import { Button, Select } from "@hrm-plus/ui";

export interface StepFormRow {
  approverType: ApproverType;
  roleId: string;
}

export function validSteps(steps: StepFormRow[]): boolean {
  return steps.length > 0 && steps.every((s) => s.approverType === "ReportingManager" || s.roleId !== "");
}

export function ApprovalStepBuilder({
  steps,
  roles,
  onChange,
}: {
  steps: StepFormRow[];
  roles: RoleDto[];
  onChange: (steps: StepFormRow[]) => void;
}) {
  function updateStep(index: number, patch: Partial<StepFormRow>) {
    onChange(steps.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function removeStep(index: number) {
    onChange(steps.filter((_, i) => i !== index));
  }

  function moveStep(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= steps.length) return;
    const next = [...steps];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">Approval chain (in order)</label>
      {steps.map((step, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="w-5 text-xs text-slate-400">{index + 1}.</span>
          <Select
            value={step.approverType}
            onChange={(e) => updateStep(index, { approverType: e.target.value as ApproverType, roleId: "" })}
            className="max-w-[180px]"
          >
            <option value="ReportingManager">Reporting Manager</option>
            <option value="Role">Role</option>
          </Select>
          {step.approverType === "Role" && (
            <Select
              value={step.roleId}
              onChange={(e) => updateStep(index, { roleId: e.target.value })}
              className="max-w-[180px]"
            >
              <option value="">Select role…</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>
          )}
          <Button type="button" size="sm" variant="secondary" onClick={() => moveStep(index, -1)} disabled={index === 0}>
            ↑
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => moveStep(index, 1)}
            disabled={index === steps.length - 1}
          >
            ↓
          </Button>
          <Button type="button" size="sm" variant="danger" onClick={() => removeStep(index)}>
            Remove
          </Button>
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        variant="secondary"
        onClick={() => onChange([...steps, { approverType: "ReportingManager", roleId: "" }])}
      >
        Add Step
      </Button>
    </div>
  );
}
