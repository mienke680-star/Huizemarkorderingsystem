"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { navForRole } from "@/lib/nav";
import type { Role } from "@/lib/constants";
import { Sheet } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export function MobileNav({ role, open, onClose }: { role: Role; open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const items = navForRole(role);

  return (
    <Sheet open={open} onClose={onClose} title="Menu" side="left">
      <nav className="-mx-2 space-y-1">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium",
                active ? "bg-orange-50 text-orange-600" : "text-navy-600 hover:bg-grey-50"
              )}
            >
              <item.icon className="size-4.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </Sheet>
  );
}

const PRIMARY_MOBILE_ROUTES = ["/dashboard", "/orders", "/orders/new", "/tracking", "/notifications"];

export function BottomNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = navForRole(role).filter((i) => PRIMARY_MOBILE_ROUTES.includes(i.href)).slice(0, 5);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-grey-100 bg-white/95 backdrop-blur-md lg:hidden">
      {items.map((item) => {
        const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
        return (
          <Link key={item.href} href={item.href} className="relative flex flex-1 flex-col items-center gap-1 py-2.5">
            {active && (
              <motion.span
                layoutId="bottom-nav-active"
                className="absolute top-0 h-0.5 w-8 rounded-full bg-orange-500"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <item.icon className={cn("size-5", active ? "text-orange-500" : "text-grey-400")} />
            <span className={cn("text-[10px] font-medium", active ? "text-orange-600" : "text-grey-400")}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
