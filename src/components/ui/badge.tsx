import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export type BadgeTone = "grey" | "orange" | "navy" | "green" | "red" | "amber" | "blue";

const toneClasses: Record<BadgeTone, string> = {
  grey: "bg-grey-100 text-grey-700",
  orange: "bg-orange-100 text-orange-700",
  navy: "bg-navy-100 text-navy-700",
  green: "bg-emerald-100 text-emerald-700",
  red: "bg-red-100 text-red-700",
  amber: "bg-amber-100 text-amber-800",
  blue: "bg-sky-100 text-sky-700",
};

export function Badge({
  className,
  tone = "grey",
  dot,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone; dot?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        toneClasses[tone],
        className
      )}
      {...props}
    >
      {dot && <span className={cn("size-1.5 rounded-full", toneClasses[tone].split(" ")[1])} style={{ background: "currentColor" }} />}
      {props.children}
    </span>
  );
}
