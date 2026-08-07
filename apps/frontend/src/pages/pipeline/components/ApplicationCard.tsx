import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { ApplicationDto } from "@hrm-plus/shared";
import { Badge } from "@hrm-plus/ui";

interface ApplicationCardProps {
  application: ApplicationDto;
  onClick: () => void;
  disabled?: boolean;
}

export function ApplicationCard({ application, onClick, disabled }: ApplicationCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: String(application.id),
    disabled,
  });

  const style = transform ? { transform: CSS.Translate.toString(transform), zIndex: 20 } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`rounded-md border border-slate-200 bg-white p-2.5 text-left shadow-sm ${
        disabled ? "cursor-default" : "cursor-grab active:cursor-grabbing"
      } ${isDragging ? "opacity-50" : ""}`}
    >
      <p className="text-sm font-medium text-slate-900">{application.candidateName}</p>
      <p className="text-xs text-slate-400">{application.candidateEmail}</p>
      {application.assessmentOutcome && (
        <Badge
          color={
            application.assessmentOutcome === "PASSED"
              ? "green"
              : application.assessmentOutcome === "PASSED_PENDING_REVIEW"
                ? "amber"
                : "red"
          }
          className="mt-1.5"
        >
          {application.assessmentOutcome.replace(/_/g, " ")}
        </Badge>
      )}
    </div>
  );
}
