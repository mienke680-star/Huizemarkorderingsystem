"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { navForRole } from "@/lib/nav";
import type { Role } from "@/lib/constants";
import { ROLE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = navForRole(role);

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-grey-100 bg-white lg:flex">
      <div className="flex h-16 items-center gap-2.5 border-b border-grey-100 px-6">
        <div className="flex size-9 items-center justify-center rounded-lg bg-orange-500 font-display text-base font-bold text-white">
          H
        </div>
        <div className="leading-tight">
          <p className="font-display text-sm font-semibold text-navy-800">Huizemark</p>
          <p className="text-[11px] text-grey-400">Ordering Hub</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "text-orange-600" : "text-navy-600 hover:bg-grey-50 hover:text-navy-800"
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl bg-orange-50"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <item.icon className={cn("relative z-10 size-4.5", active && "text-orange-500")} />
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-grey-100 p-4">
        <div className="accent-line-full rounded-full" />
        <p className="mt-3 text-[11px] leading-relaxed text-grey-400">
          Signed in as <span className="font-medium text-grey-600">{ROLE_LABELS[role]}</span>
        </p>
      </div>
    </aside>
  );
}
