import { icons, LucideProps, Circle } from "lucide-react";

interface DynamicIconProps extends Omit<LucideProps, "name"> {
  name: string | null | undefined;
}

/**
 * Renders a lucide-react icon by its name (as stored in the CMS). Falls back to a
 * neutral circle when the name is missing or unknown.
 */
export function DynamicIcon({ name, ...props }: DynamicIconProps) {
  const Icon = (name && (icons as Record<string, typeof Circle>)[name]) || Circle;
  return <Icon {...props} />;
}
