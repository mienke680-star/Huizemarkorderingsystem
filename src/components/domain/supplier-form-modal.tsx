"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";

const schema = z.object({
  name: z.string().min(2, "Supplier name is required"),
  contactPerson: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  address: z.string().optional(),
  avgTurnaroundDays: z.coerce.number().min(0),
  rating: z.coerce.number().min(0).max(5),
  notes: z.string().optional(),
  active: z.boolean(),
});
type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

export type SupplierRecord = {
  id: string;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  avgTurnaroundDays: number;
  rating: number;
  notes: string | null;
  active: boolean;
};

export function SupplierFormModal({
  open,
  onClose,
  onSaved,
  supplier,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  supplier: SupplierRecord | null;
}) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { avgTurnaroundDays: 5, rating: 4.5, active: true },
  });

  useEffect(() => {
    if (!open) return;
    reset(
      supplier
        ? {
            name: supplier.name,
            contactPerson: supplier.contactPerson ?? "",
            email: supplier.email ?? "",
            phone: supplier.phone ?? "",
            whatsapp: supplier.whatsapp ?? "",
            address: supplier.address ?? "",
            avgTurnaroundDays: supplier.avgTurnaroundDays,
            rating: supplier.rating,
            notes: supplier.notes ?? "",
            active: supplier.active,
          }
        : { name: "", contactPerson: "", email: "", phone: "", whatsapp: "", address: "", avgTurnaroundDays: 5, rating: 4.5, notes: "", active: true }
    );
  }, [open, supplier, reset]);

  async function onSubmit(values: FormValues) {
    const res = await fetch(supplier ? `/api/suppliers/${supplier.id}` : "/api/suppliers", {
      method: supplier ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (res.ok) {
      onSaved();
      onClose();
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={supplier ? "Edit Supplier" : "Add Supplier"} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Supplier Name</Label>
            <Input invalid={!!errors.name} {...register("name")} />
          </div>
          <div>
            <Label>Contact Person</Label>
            <Input {...register("contactPerson")} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label>Email</Label>
            <Input type="email" {...register("email")} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input {...register("phone")} />
          </div>
          <div>
            <Label>WhatsApp</Label>
            <Input {...register("whatsapp")} />
          </div>
        </div>
        <div>
          <Label>Address</Label>
          <Textarea {...register("address")} />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <Label>Avg Turnaround (days)</Label>
            <Input type="number" {...register("avgTurnaroundDays")} />
          </div>
          <div>
            <Label>Rating (0–5)</Label>
            <Input type="number" step="0.1" {...register("rating")} />
          </div>
          <div className="flex items-end gap-2 pb-2">
            <Controller
              control={control}
              name="active"
              render={({ field }) => (
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="size-4 rounded border-grey-300 text-orange-500 focus:ring-orange-300"
                  id="supplier-active"
                />
              )}
            />
            <label htmlFor="supplier-active" className="text-sm text-navy-700">
              Active
            </label>
          </div>
        </div>
        <div>
          <Label>Notes</Label>
          <Textarea {...register("notes")} />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {supplier ? "Save Changes" : "Create Supplier"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
