"use client";

import { Menu } from "lucide-react";
import { GlobalSearch } from "@/components/shell/global-search";
import { NotificationBell } from "@/components/shell/notification-bell";
import { UserMenu } from "@/components/shell/user-menu";
import type { Role } from "@/lib/constants";

export function Topbar({
  onMenuClick,
  user,
}: {
  onMenuClick: () => void;
  user: { name: string; initials: string; avatarColor: string; role: Role };
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-grey-100 bg-white/90 px-4 backdrop-blur-md sm:px-6">
      <button
        onClick={onMenuClick}
        className="flex size-10 items-center justify-center rounded-full text-navy-600 hover:bg-grey-100 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </button>

      <div className="flex-1">
        <GlobalSearch />
      </div>

      <NotificationBell />
      <div className="hidden h-8 w-px bg-grey-100 sm:block" />
      <UserMenu name={user.name} initials={user.initials} avatarColor={user.avatarColor} role={user.role} />
    </header>
  );
}
