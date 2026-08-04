"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import type { ReactNode } from "react";

const PARTICLE_COLORS = ["#ff6b00", "#ffa35f", "#142244", "#4c6094", "#10b981"];

// Deterministic per-particle jitter (not Math.random()) so the burst stays
// pure across renders while still reading as organic rather than a perfect
// circle — variation comes from the golden-angle-derived offsets below.
const PARTICLES = Array.from({ length: 16 }, (_, i) => {
  const angle = (i / 16) * Math.PI * 2;
  const jitterA = ((i * 47) % 40) - 0; // 0–39
  const jitterB = ((i * 83) % 15) / 100; // 0–0.14
  return {
    x: Math.cos(angle) * (70 + jitterA),
    y: Math.sin(angle) * (70 + jitterA),
    color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
    delay: jitterB,
  };
});

export function SuccessCelebration({
  open,
  title,
  description,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  const particles = PARTICLES;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-navy-900/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className="relative flex w-full max-w-sm flex-col items-center rounded-3xl bg-white p-10 text-center shadow-soft-lg"
          >
            <div className="relative flex size-20 items-center justify-center">
              {particles.map((p, i) => (
                <motion.span
                  key={i}
                  className="absolute size-1.5 rounded-full"
                  style={{ background: p.color }}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{ x: p.x, y: p.y, opacity: 0, scale: 0 }}
                  transition={{ duration: 0.9, delay: 0.25 + p.delay, ease: "easeOut" }}
                />
              ))}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 16, delay: 0.1 }}
                className="flex size-20 items-center justify-center rounded-full bg-emerald-500 shadow-orange-glow"
              >
                <motion.div
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.35 }}
                >
                  <Check className="size-9 text-white" strokeWidth={3} />
                </motion.div>
              </motion.div>
            </div>
            <motion.h3
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-5 font-display text-xl font-semibold text-navy-800"
            >
              {title}
            </motion.h3>
            {description && (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.48 }}
                className="mt-1.5 text-sm text-grey-500"
              >
                {description}
              </motion.p>
            )}
            {children && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="mt-6 w-full">
                {children}
              </motion.div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
