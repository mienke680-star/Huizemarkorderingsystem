"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ClipboardList, CheckCircle2, Factory, Truck } from "lucide-react";
import { createBrowserStore } from "@/lib/browser-store";

const TOTAL_MS = 3100;
const seenStore = createBrowserStore<boolean>("session", "hm-intro-seen", false);

const ROUTE_ICONS = [
  { Icon: ClipboardList, label: "Order" },
  { Icon: CheckCircle2, label: "Approve" },
  { Icon: Factory, label: "Manufacture" },
  { Icon: Truck, label: "Deliver" },
];

export function IntroExperience({ onFinish }: { onFinish?: () => void }) {
  const seen = useSyncExternalStore(seenStore.subscribe, seenStore.getSnapshot, seenStore.getServerSnapshot);
  const [dismissed, setDismissed] = useState(false);
  const visible = !seen && !dismissed;

  useEffect(() => {
    if (seen) return;
    const t = setTimeout(finish, TOTAL_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seen]);

  useEffect(() => {
    if (seen) onFinish?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seen]);

  function finish() {
    seenStore.set(true);
    setDismissed(true);
    onFinish?.();
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="intro"
          exit={{ opacity: 0, filter: "blur(6px)" }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white"
        >
          <div className="flex flex-col items-center gap-7">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.85, ease: [0.65, 0, 0.35, 1] }}
              className="h-[2px] w-56 origin-left bg-orange-500"
            />

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-3"
            >
              <div className="flex size-11 items-center justify-center rounded-xl bg-orange-500 font-display text-xl font-bold text-white">
                H
              </div>
              <span className="font-display text-3xl font-semibold tracking-tight text-navy-800">
                Huizemark
              </span>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.95, duration: 0.5 }}
              className="text-xs font-medium tracking-[0.2em] text-grey-400 uppercase"
            >
              Agent Ordering Hub
            </motion.p>

            {/* Progress route */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3, duration: 0.4 }}
              className="relative mt-2 h-10 w-72 sm:w-80"
            >
              <div className="absolute top-1/2 right-0 left-0 h-[2px] -translate-y-1/2 bg-grey-100" />
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 1.5, duration: 1.15, ease: [0.65, 0, 0.35, 1] }}
                className="absolute top-1/2 right-0 left-0 h-[2px] origin-left -translate-y-1/2 bg-orange-500"
              />
              <motion.div
                initial={{ left: "0%" }}
                animate={{ left: "100%" }}
                transition={{ delay: 1.5, duration: 1.15, ease: [0.65, 0, 0.35, 1] }}
                className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500 shadow-orange-glow"
              />
              <div className="absolute inset-0 flex items-center justify-between">
                {ROUTE_ICONS.map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 1.55 + i * 0.29, type: "spring", stiffness: 420, damping: 18 }}
                    className="relative z-10 flex size-8 items-center justify-center rounded-full border-2 border-orange-500 bg-white"
                  >
                    <item.Icon className="size-3.5 text-orange-600" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            onClick={finish}
            className="absolute right-6 bottom-6 text-xs font-medium text-grey-400 transition-colors hover:text-orange-600"
          >
            Skip intro
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
