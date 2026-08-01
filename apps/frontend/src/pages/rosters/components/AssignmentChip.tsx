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
    : assignment.isLeave || assignment.status === "OnLeave"
      ? "Leave"
      : assignment.isHoliday
        ? "Holiday"
        : assignment.status === "Cancelled"
          ? "Cancelled"
          : (assignment.dutyScheduleName ?? "Unassigned");

  const statusSuffix =
    assignment.status === "CheckedIn"
      ? " · Checked In"
      : assignment.status === "Completed"
        ? " · Completed"
        : assignment.status === "Incomplete"
          ? " · Incomplete"
          : "";

  const tone =
    assignment.isWeekend || assignment.isHoliday || assignment.status === "Cancelled"
      ? "bg-slate-100 text-slate-500 border-slate-200"
      : assignment.isLeave || assignment.status === "OnLeave"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : assignment.status === "Completed"
          ? "bg-green-50 text-green-700 border-green-200"
          : assignment.status === "Incomplete"
            ? "bg-red-50 text-red-700 border-red-200"
            : assignment.status === "CheckedIn" || assignment.dutyScheduleId
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
      {statusSuffix}
    </div>
  );
}
