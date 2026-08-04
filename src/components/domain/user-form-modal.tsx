"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, HelperText } from "@/components/ui/input";
import { ROLES, ROLE_LABELS, type Role } from "@/lib/constants";

const createSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().optional(),
  role: z.string(),
  branchId: z.string().optional(),
  phone: z.string().optional(),
});
type FormValues = z.infer<typeof createSchema>;

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  role: string;
  branchId: string | null;
  phone: string | null;
  active: boolean;
};

export function UserFormModal({
  open,
  onClose,
  onSaved,
  user,
  branches,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  user: UserRecord | null;
  branches: { id: string; name: string }[];
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(createSchema) });

  useEffect(() => {
    if (!open) return;
    reset(
      user
        ? { name: user.name, email: user.email, role: user.role, branchId: user.branchId ?? "", phone: user.phone ?? "", password: "" }
        : { name: "", email: "", role: "AGENT", branchId: "", phone: "", password: "" }
    );
  }, [open, user, reset]);

  async function onSubmit(values: FormValues) {
    const res = await fetch(user ? `/api/users/${user.id}` : "/api/users", {
      method: user ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (res.ok) {
      onSaved();
      onClose();
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={user ? "Edit User" : "Add User"} size="sm">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label>Full Name</Label>
          <Input invalid={!!errors.name} {...register("name")} />
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" invalid={!!errors.email} disabled={!!user} {...register("email")} />
        </div>
        {!user && (
          <div>
            <Label>Password</Label>
            <Input type="password" placeholder="Defaults to Huizemark2026!" {...register("password")} />
            <HelperText>Leave blank to use the standard demo password.</HelperText>
          </div>
        )}
        <div>
          <Label>Role</Label>
          <Select {...register("role")}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r as Role]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Branch / Office</Label>
          <Select {...register("branchId")}>
            <option value="">No branch assigned</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Phone</Label>
          <Input {...register("phone")} />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {user ? "Save Changes" : "Create User"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
