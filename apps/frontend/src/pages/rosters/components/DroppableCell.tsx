import { ReactNode } from "react";
import { useDroppable } from "@dnd-kit/core";

interface DroppableCellProps {
  id: string;
  children: ReactNode;
  onClick?: () => void;
}

export function DroppableCell({ id, children, onClick }: DroppableCellProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className={`flex min-h-[44px] items-center justify-center border-b border-r border-slate-100 p-1 ${
        isOver ? "bg-brand-50" : ""
      } ${onClick ? "cursor-pointer hover:bg-slate-50" : ""}`}
    >
      {children}
    </div>
  );
}
