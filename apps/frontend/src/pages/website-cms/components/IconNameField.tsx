import { Field, Input } from "@hrm-plus/ui";
import { CURATED_ICON_NAMES } from "./iconNames";

export function IconNameField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <Field label="Icon" required helperText="Any lucide-react icon name, e.g. Rocket">
      <Input required list="icon-names" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Rocket" />
      <datalist id="icon-names">
        {CURATED_ICON_NAMES.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
    </Field>
  );
}
