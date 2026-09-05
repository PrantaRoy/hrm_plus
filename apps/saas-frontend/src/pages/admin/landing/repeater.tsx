import { ReactNode } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@hrm-plus/ui";

interface RepeaterListProps<T> {
  items: T[];
  onChange: (items: T[]) => void;
  makeEmpty: () => T;
  renderRow: (item: T, update: (patch: Partial<T>) => void, index: number) => ReactNode;
  addLabel?: string;
  reorderable?: boolean;
}

export function RepeaterList<T>({
  items,
  onChange,
  makeEmpty,
  renderRow,
  addLabel = "Add row",
  reorderable = true,
}: RepeaterListProps<T>) {
  function replace(index: number, next: T) {
    onChange(items.map((item, i) => (i === index ? next : item)));
  }
  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          key={index}
          className="rounded-lg border border-slate-200 bg-slate-50/60 p-3"
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              {renderRow(item, (patch) => replace(index, { ...item, ...patch }), index)}
            </div>
            <div className="flex shrink-0 flex-col gap-1">
              {reorderable && (
                <>
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    className="rounded p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                    aria-label="Move up"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === items.length - 1}
                    className="rounded p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                    aria-label="Move down"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => onChange(items.filter((_, i) => i !== index))}
                className="rounded p-1 text-red-400 hover:text-red-600"
                aria-label="Remove"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="gap-1.5"
        onClick={() => onChange([...items, makeEmpty()])}
      >
        <Plus className="h-4 w-4" />
        {addLabel}
      </Button>
    </div>
  );
}
