import * as Icons from "lucide-react";
import { Package, type LucideProps } from "lucide-react";

export function DynamicIcon({ name, ...props }: { name: string } & LucideProps) {
  const IconComponent = (Icons as unknown as Record<string, React.ComponentType<LucideProps>>)[name];
  const Cmp = IconComponent ?? Package;
  return <Cmp {...props} />;
}
