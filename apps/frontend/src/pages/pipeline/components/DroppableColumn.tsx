import { ReactNode } from "react";
import { useDroppable } from "@dnd-kit/core";

interface DroppableColumnProps {
  id: string;
  children: ReactNode;
}

export function DroppableColumn({ id, children }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[200px] flex-col gap-2 rounded-md border border-slate-100 p-2 ${isOver ? "bg-brand-50" : "bg-slate-50"}`}
    >
      {children}
    </div>
  );
}
