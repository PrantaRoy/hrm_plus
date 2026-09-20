import { Checkbox } from "@hrm-plus/ui";
import { EmployeeOption } from "./useEmployeeOptions";

interface Props {
  options: EmployeeOption[];
  value: number[];
  onChange: (ids: number[]) => void;
}

/** Scrollable checkbox list; small enough for the modal forms it is used in. */
export function EmployeeMultiSelect({ options, value, onChange }: Props) {
  function toggle(id: number) {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  }
  if (options.length === 0) {
    return <p className="text-xs text-slate-400">No employees available.</p>;
  }
  return (
    <div className="max-h-36 overflow-y-auto rounded-md border border-slate-200 divide-y divide-slate-100">
      {options.map((o) => (
        <label key={o.id} className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 cursor-pointer hover:bg-slate-50">
          <Checkbox checked={value.includes(o.id)} onChange={() => toggle(o.id)} />
          {o.name}
        </label>
      ))}
    </div>
  );
}
