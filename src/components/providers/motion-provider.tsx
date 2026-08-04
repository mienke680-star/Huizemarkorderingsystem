"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { MotionConfig } from "framer-motion";

type MotionContextValue = {
  reduceMotion: boolean;
  setReduceMotion: (value: boolean) => void;
};

const MotionSettingsContext = createContext<MotionContextValue | null>(null);

const STORAGE_KEY = "hm-reduce-motion";

export function MotionSettingsProvider({ children }: { children: ReactNode }) {
  const [reduceMotion, setReduceMotionState] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    setReduceMotionState(stored === "true");
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.dataset.motion = reduceMotion ? "reduced" : "full";
    window.localStorage.setItem(STORAGE_KEY, String(reduceMotion));
  }, [reduceMotion, hydrated]);

  const setReduceMotion = (value: boolean) => setReduceMotionState(value);

  return (
    <MotionSettingsContext.Provider value={{ reduceMotion, setReduceMotion }}>
      <MotionConfig reducedMotion={reduceMotion ? "always" : "user"}>{children}</MotionConfig>
    </MotionSettingsContext.Provider>
  );
}

export function useMotionSettings() {
  const ctx = useContext(MotionSettingsContext);
  if (!ctx) throw new Error("useMotionSettings must be used within MotionSettingsProvider");
  return ctx;
}
