"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, Select, HelperText } from "@/components/ui/input";
import { DynamicIcon } from "@/components/domain/dynamic-icon";

const ICON_OPTIONS = [
  "Package", "CreditCard", "SignpostBig", "Sticker", "Tag", "Navigation", "IdCard", "Shirt", "Gift",
  "GlassWater", "FolderOpen", "FileText", "BookOpen", "Presentation", "UserSquare", "Instagram",
  "Camera", "Plane", "Video", "Printer", "Truck", "Sparkles", "Box", "Palette", "Award",
];

const schema = z.object({
  name: z.string().min(2, "Category name is required"),
  description: z.string().optional(),
  icon: z.string(),
});
type FormValues = z.infer<typeof schema>;

export function CategoryFormModal({
  open,
  onClose,
  onSaved,
  category,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  category: { id: string; name: string; description?: string | null; icon: string } | null;
}) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { icon: "Package" } });

  useEffect(() => {
    if (!open) return;
    reset(
      category
        ? { name: category.name, description: category.description ?? "", icon: category.icon }
        : { name: "", description: "", icon: "Package" }
    );
  }, [open, category, reset]);

  const icon = watch("icon");

  async function onSubmit(values: FormValues) {
    const res = await fetch(category ? `/api/categories/${category.id}` : "/api/categories", {
      method: category ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (res.ok) {
      onSaved();
      onClose();
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={category ? "Edit Category" : "Add Category"} size="sm">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label>Category Name</Label>
          <Input invalid={!!errors.name} {...register("name")} />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea {...register("description")} />
        </div>
        <div>
          <Label>Icon</Label>
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <DynamicIcon name={icon} className="size-5" />
            </span>
            <Select {...register("icon")} className="flex-1">
              {ICON_OPTIONS.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </Select>
          </div>
          <HelperText>Used throughout the catalogue and order form.</HelperText>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {category ? "Save Changes" : "Create Category"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
