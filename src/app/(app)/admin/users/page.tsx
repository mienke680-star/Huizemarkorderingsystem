"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { UserPlus, Pencil, Power } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { UserFormModal, type UserRecord } from "@/components/domain/user-form-modal";
import { ROLE_LABELS, type Role } from "@/lib/constants";
import { cn } from "@/lib/utils";

type FullUser = UserRecord & { initials: string; avatarColor: string; branch: { name: string } | null; _count: { ordersCreated: number } };

export default function UserManagementPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<FullUser[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; user: UserRecord | null }>({ open: false, user: null });

  async function load() {
    setLoading(true);
    const [u, b] = await Promise.all([fetch("/api/users").then((r) => r.json()), fetch("/api/branches").then((r) => r.json())]);
    setUsers(u.users);
    setBranches(b.branches);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleActive(u: FullUser) {
    if (u.id === session?.user?.id) {
      toast.error("You can't deactivate your own account.");
      return;
    }
    const res = await fetch(`/api/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !u.active }),
    });
    if (res.ok) {
      toast.success(u.active ? `${u.name} deactivated` : `${u.name} reactivated`);
      load();
    }
  }

  const grouped = users.reduce<Record<string, FullUser[]>>((acc, u) => {
    (acc[u.role] ??= []).push(u);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-orange-600">Administration</p>
          <h1 className="font-display text-2xl font-semibold text-navy-800 sm:text-3xl">User Management</h1>
          <p className="mt-1 text-sm text-grey-500">Manage accounts, roles and branch assignments.</p>
        </div>
        <Button onClick={() => setModal({ open: true, user: null })}>
          <UserPlus className="size-4" /> Add User
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-2xl" />
          ))}
        </div>
      ) : (
        Object.entries(grouped).map(([role, roleUsers]) => (
          <div key={role}>
            <p className="mb-2 text-xs font-semibold tracking-wide text-grey-400 uppercase">{ROLE_LABELS[role as Role]}</p>
            <Card>
              <CardContent className="divide-y divide-grey-50 p-0">
                {roleUsers.map((u, i) => (
                  <motion.div
                    key={u.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.03, 0.3) }}
                    className="flex flex-wrap items-center gap-3 p-4"
                  >
                    <Avatar initials={u.initials} color={u.avatarColor} />
                    <div className="min-w-[160px] flex-1">
                      <p className="text-sm font-semibold text-navy-800">{u.name}</p>
                      <p className="text-xs text-grey-400">{u.email}</p>
                    </div>
                    <span className="text-xs text-grey-500">{u.branch?.name ?? "No branch"}</span>
                    <span className="text-xs text-grey-500">{u._count.ordersCreated} orders</span>
                    <Badge tone={u.active ? "green" : "grey"}>{u.active ? "Active" : "Inactive"}</Badge>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setModal({ open: true, user: u })}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActive(u)}
                        className={cn(u.active ? "text-red-600 hover:bg-red-50" : "text-emerald-600 hover:bg-emerald-50")}
                      >
                        <Power className="size-3.5" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </div>
        ))
      )}

      <UserFormModal
        open={modal.open}
        onClose={() => setModal({ open: false, user: null })}
        onSaved={load}
        user={modal.user}
        branches={branches}
      />
    </div>
  );
}
