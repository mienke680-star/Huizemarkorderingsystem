"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { MobileNav, BottomNav } from "@/components/shell/mobile-nav";
import type { Role } from "@/lib/constants";

export function AppShell({
  children,
  user,
}: {
  children: ReactNode;
  user: { name: string; initials: string; avatarColor: string; role: Role };
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-grey-50/40">
      <Sidebar role={user.role} />
      <MobileNav role={user.role} open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setMobileOpen(true)} user={user} />
        <main className="flex-1 pb-20 lg:pb-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <BottomNav role={user.role} />
    </div>
  );
}
