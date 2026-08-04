"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "navy",
  prefix,
  suffix,
  decimals,
  delay = 0,
  hint,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: "navy" | "orange" | "green" | "red" | "amber" | "blue";
  prefix?: string;
  suffix?: string;
  decimals?: number;
  delay?: number;
  hint?: string;
}) {
  const toneClasses: Record<string, string> = {
    navy: "bg-navy-50 text-navy-600",
    orange: "bg-orange-50 text-orange-600",
    green: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-600",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-sky-50 text-sky-600",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4 }}
      className="rounded-2xl border border-grey-100 bg-white p-5 shadow-soft transition-shadow hover:shadow-soft-lg"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-grey-500">{label}</p>
          <p className="mt-2 font-display text-2xl font-semibold text-navy-800">
            <AnimatedCounter value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
          </p>
          {hint && <p className="mt-1 text-[11px] text-grey-400">{hint}</p>}
        </div>
        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", toneClasses[tone])}>
          <Icon className="size-5" />
        </span>
      </div>
    </motion.div>
  );
}
