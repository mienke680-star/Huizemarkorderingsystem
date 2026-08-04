import { cn } from "@/lib/utils";

export function Avatar({
  initials,
  color = "#142244",
  size = "md",
  className,
}: {
  initials: string;
  color?: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    xs: "size-6 text-[10px]",
    sm: "size-8 text-xs",
    md: "size-10 text-sm",
    lg: "size-14 text-lg",
  };
  return (
    <div
      className={cn("flex shrink-0 items-center justify-center rounded-full font-semibold text-white", sizes[size], className)}
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
}
