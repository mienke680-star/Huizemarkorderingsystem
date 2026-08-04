"use client";

import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import { createBrowserStore } from "@/lib/browser-store";

type MotionContextValue = {
  reduceMotion: boolean;
  setReduceMotion: (value: boolean) => void;
};

const MotionSettingsContext = createContext<MotionContextValue | null>(null);

const store = createBrowserStore<boolean>("local", "hm-reduce-motion", false);

export function MotionSettingsProvider({ children }: { children: ReactNode }) {
  const reduceMotion = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);

  // Sync React state -> the DOM (an external system), per the effect's
  // intended purpose — this doesn't call setState, so it's not affected by
  // the "no setState in an effect" rule that governs the read path above.
  useEffect(() => {
    document.documentElement.dataset.motion = reduceMotion ? "reduced" : "full";
  }, [reduceMotion]);

  return (
    <MotionSettingsContext.Provider value={{ reduceMotion, setReduceMotion: store.set }}>
      <MotionConfig reducedMotion={reduceMotion ? "always" : "user"}>{children}</MotionConfig>
    </MotionSettingsContext.Provider>
  );
}

export function useMotionSettings() {
  const ctx = useContext(MotionSettingsContext);
  if (!ctx) throw new Error("useMotionSettings must be used within MotionSettingsProvider");
  return ctx;
}
