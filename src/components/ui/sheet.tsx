"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Sheet({
  open,
  onClose,
  title,
  children,
  side = "right",
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  side?: "left" | "right";
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-navy-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: side === "right" ? "100%" : "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: side === "right" ? "100%" : "-100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className={cn(
              "relative z-10 flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-soft-lg",
              side === "right" ? "ml-auto" : "mr-auto",
              className
            )}
          >
            <div className="flex items-center justify-between border-b border-grey-100 px-6 py-5">
              <h3 className="font-display text-lg font-semibold text-navy-800">{title}</h3>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 text-grey-400 transition-colors hover:bg-grey-100 hover:text-navy-700"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="flex-1 p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
