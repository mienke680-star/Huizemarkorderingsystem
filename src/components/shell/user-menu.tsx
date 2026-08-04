"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { ChevronDown, LogOut, Settings, UserRound } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { ROLE_LABELS, type Role } from "@/lib/constants";

export function UserMenu({
  name,
  initials,
  avatarColor,
  role,
}: {
  name: string;
  initials: string;
  avatarColor: string;
  role: Role;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full py-1 pr-2 pl-1 transition-colors hover:bg-grey-100"
      >
        <Avatar initials={initials} color={avatarColor} size="sm" />
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-sm font-medium text-navy-800">{name}</span>
          <span className="block text-[11px] text-grey-400">{ROLE_LABELS[role]}</span>
        </span>
        <ChevronDown className="hidden size-3.5 text-grey-400 sm:block" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-2xl border border-grey-100 bg-white p-1.5 shadow-soft-lg"
          >
            <div className="px-3 py-2.5">
              <p className="text-sm font-medium text-navy-800">{name}</p>
              <p className="text-xs text-grey-400">{ROLE_LABELS[role]}</p>
            </div>
            <div className="my-1 h-px bg-grey-100" />
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-navy-700 hover:bg-grey-50"
            >
              <Settings className="size-4 text-grey-400" /> Settings
            </Link>
            <Link
              href="/settings#profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-navy-700 hover:bg-grey-50"
            >
              <UserRound className="size-4 text-grey-400" /> Profile
            </Link>
            <div className="my-1 h-px bg-grey-100" />
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="size-4" /> Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
