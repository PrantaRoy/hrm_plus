import * as Icons from "lucide-react";
import { Circle, LucideProps } from "lucide-react";

type IconComponent = React.ComponentType<LucideProps>;

export function LucideIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = (Icons as unknown as Record<string, IconComponent>)[name] ?? Circle;
  return <Icon {...props} />;
}
