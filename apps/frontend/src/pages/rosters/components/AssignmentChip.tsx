import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { DutyScheduleAssignmentDto } from "@hrm-plus/shared";

interface AssignmentChipProps {
  assignment: DutyScheduleAssignmentDto;
  disabled?: boolean;
}

export function AssignmentChip({ assignment, disabled }: AssignmentChipProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: String(assignment.id),
    disabled,
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform), zIndex: 20 }
    : undefined;

  const label = assignment.isWeekend
    ? "Off"
    : assignment.isLeave
      ? "Leave"
      : assignment.isHoliday
        ? "Holiday"
        : (assignment.dutyScheduleName ?? "Unassigned");

  const tone = assignment.isWeekend || assignment.isLeave || assignment.isHoliday
    ? "bg-slate-100 text-slate-500 border-slate-200"
    : assignment.dutyScheduleId
      ? "bg-brand-50 text-brand-700 border-brand-200"
      : "bg-amber-50 text-amber-700 border-amber-200";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`rounded-md border px-2 py-1 text-xs font-medium ${tone} ${
        disabled ? "cursor-default" : "cursor-grab active:cursor-grabbing"
      } ${isDragging ? "opacity-50" : ""}`}
      title={assignment.comment ?? undefined}
    >
      {label}
    </div>
  );
}
