"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Building2, Moon, Plus, Sparkles, UserRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useMotionSettings } from "@/components/providers/motion-provider";
import { ROLE_LABELS, isAdmin, type Role } from "@/lib/constants";

export default function SettingsPage() {
  const { data: session } = useSession();
  const { reduceMotion, setReduceMotion } = useMotionSettings();
  const [branches, setBranches] = useState<{ id: string; name: string; address: string | null }[]>([]);
  const [newBranch, setNewBranch] = useState("");
  const admin = session?.user?.role ? isAdmin(session.user.role) : false;

  async function loadBranches() {
    const res = await fetch("/api/branches");
    if (res.ok) setBranches((await res.json()).branches);
  }

  useEffect(() => {
    loadBranches();
  }, []);

  async function addBranch() {
    if (!newBranch.trim()) return;
    const res = await fetch("/api/branches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newBranch.trim() }),
    });
    if (res.ok) {
      setNewBranch("");
      toast.success("Branch added");
      loadBranches();
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-medium text-orange-600">Settings</p>
        <h1 className="font-display text-2xl font-semibold text-navy-800 sm:text-3xl">Account & Preferences</h1>
      </div>

      <Card id="profile">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRound className="size-4 text-orange-500" /> Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar initials={session?.user?.initials ?? ""} color={session?.user?.avatarColor ?? "#142244"} size="lg" />
            <div>
              <p className="font-display text-lg font-semibold text-navy-800">{session?.user?.name}</p>
              <p className="text-sm text-grey-500">{session?.user?.email}</p>
              <p className="text-xs text-grey-400">{session?.user?.role ? ROLE_LABELS[session.user.role as Role] : ""}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-orange-500" /> Accessibility & Motion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <label className="flex items-center justify-between gap-4 rounded-xl border border-grey-100 p-4">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-navy-50 text-navy-600">
                <Moon className="size-4" />
              </span>
              <div>
                <p className="text-sm font-medium text-navy-800">Reduce motion</p>
                <p className="text-xs text-grey-500">Turns off animated transitions, counters and effects throughout the app.</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={reduceMotion}
              onChange={(e) => setReduceMotion(e.target.checked)}
              className="size-5 rounded border-grey-300 text-orange-500 focus:ring-orange-300"
            />
          </label>
        </CardContent>
      </Card>

      {admin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="size-4 text-orange-500" /> Branches & Offices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex flex-wrap gap-2">
              {branches.map((b) => (
                <span key={b.id} className="rounded-full bg-grey-100 px-3 py-1.5 text-xs font-medium text-navy-700">
                  {b.name}
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={newBranch} onChange={(e) => setNewBranch(e.target.value)} placeholder="New branch name…" className="max-w-xs" />
              <Button variant="outline" onClick={addBranch}>
                <Plus className="size-4" /> Add Branch
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
