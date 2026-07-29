import { ReactNode } from "react";
import { useDroppable } from "@dnd-kit/core";

interface DroppableCellProps {
  id: string;
  children: ReactNode;
}

export function DroppableCell({ id, children }: DroppableCellProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[44px] items-center justify-center border-b border-r border-slate-100 p-1 ${
        isOver ? "bg-brand-50" : ""
      }`}
    >
      {children}
    </div>
  );
}
