"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionCard({
  title,
  description,
  icon: Icon,
  defaultOpen = true,
  children,
  badge,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  defaultOpen?: boolean;
  children: ReactNode;
  badge?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-2xl border border-grey-100 bg-white shadow-soft">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          {Icon && (
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <Icon className="size-4.5" />
            </span>
          )}
          <div>
            <h3 className="font-display text-base font-semibold text-navy-800">{title}</h3>
            {description && <p className="text-xs text-grey-500">{description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {badge}
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
            <ChevronDown className="size-4 text-grey-400" />
          </motion.span>
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className={cn("overflow-hidden")}
          >
            <div className="border-t border-grey-100 p-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
