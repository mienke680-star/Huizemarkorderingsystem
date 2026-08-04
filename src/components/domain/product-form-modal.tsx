"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, Select, HelperText } from "@/components/ui/input";
import { STOCK_STATUSES, STOCK_STATUS_LABELS } from "@/lib/constants";
import type { CatalogueProduct } from "@/components/domain/product-card";

const schema = z.object({
  name: z.string().min(2, "Product name is required"),
  categoryId: z.string().min(1, "Choose a category"),
  description: z.string().optional(),
  priceOnRequest: z.boolean(),
  price: z.coerce.number().min(0).optional(),
  productionTimeDays: z.coerce.number().min(0),
  minOrderQty: z.coerce.number().min(1),
  sizes: z.string().optional(),
  finishes: z.string().optional(),
  personalisation: z.string().optional(),
  supplierId: z.string().optional(),
  stockStatus: z.string(),
  imageUrl: z.string().optional(),
  active: z.boolean(),
});
type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

function toCsv(arr?: string[]) {
  return (arr ?? []).join(", ");
}
function fromCsv(str?: string) {
  return (str ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function ProductFormModal({
  open,
  onClose,
  onSaved,
  categories,
  suppliers,
  product,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  categories: { id: string; name: string }[];
  suppliers: { id: string; name: string }[];
  product: CatalogueProduct | null;
}) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      priceOnRequest: false,
      productionTimeDays: 5,
      minOrderQty: 1,
      stockStatus: "MADE_TO_ORDER",
      active: true,
    },
  });

  useEffect(() => {
    if (!open) return;
    if (product) {
      reset({
        name: product.name,
        categoryId: product.category.id,
        description: product.description ?? "",
        priceOnRequest: product.priceOnRequest,
        price: product.price ?? undefined,
        productionTimeDays: product.productionTimeDays,
        minOrderQty: product.minOrderQty,
        sizes: toCsv(JSON.parse(product.sizesJson || "[]")),
        finishes: toCsv(JSON.parse(product.finishesJson || "[]")),
        personalisation: toCsv(JSON.parse(product.personalisationOptions || "[]")),
        supplierId: product.supplier?.id ?? "",
        stockStatus: product.stockStatus,
        imageUrl: product.imageUrl ?? "",
        active: product.active,
      });
    } else {
      reset({
        name: "",
        categoryId: categories[0]?.id ?? "",
        description: "",
        priceOnRequest: false,
        price: undefined,
        productionTimeDays: 5,
        minOrderQty: 1,
        sizes: "",
        finishes: "",
        personalisation: "",
        supplierId: "",
        stockStatus: "MADE_TO_ORDER",
        imageUrl: "",
        active: true,
      });
    }
  }, [open, product, reset, categories]);

  const priceOnRequest = watch("priceOnRequest");

  async function onSubmit(values: FormValues) {
    const payload = {
      ...values,
      sizes: fromCsv(values.sizes),
      finishes: fromCsv(values.finishes),
      personalisation: fromCsv(values.personalisation),
    };
    const res = await fetch(product ? `/api/products/${product.id}` : "/api/products", {
      method: product ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      onSaved();
      onClose();
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={product ? "Edit Product" : "Add Product"} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Product Name</Label>
            <Input invalid={!!errors.name} {...register("name")} />
          </div>
          <div>
            <Label>Category</Label>
            <Select invalid={!!errors.categoryId} {...register("categoryId")}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <Label>Description</Label>
          <Textarea {...register("description")} />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="col-span-2 flex items-center gap-2 sm:col-span-4">
            <Controller
              control={control}
              name="priceOnRequest"
              render={({ field }) => (
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="size-4 rounded border-grey-300 text-orange-500 focus:ring-orange-300"
                  id="priceOnRequest"
                />
              )}
            />
            <label htmlFor="priceOnRequest" className="text-sm text-navy-700">
              Price on Request
            </label>
          </div>
          {!priceOnRequest && (
            <div>
              <Label>Price (ZAR)</Label>
              <Input type="number" step="0.01" {...register("price")} />
            </div>
          )}
          <div>
            <Label>Production Days</Label>
            <Input type="number" {...register("productionTimeDays")} />
          </div>
          <div>
            <Label>Min Order Qty</Label>
            <Input type="number" {...register("minOrderQty")} />
          </div>
          <div>
            <Label>Stock Status</Label>
            <Select {...register("stockStatus")}>
              {STOCK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STOCK_STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label>Available Sizes</Label>
            <Input placeholder="S, M, L" {...register("sizes")} />
            <HelperText>Comma-separated</HelperText>
          </div>
          <div>
            <Label>Available Finishes</Label>
            <Input placeholder="Matte, Gloss" {...register("finishes")} />
            <HelperText>Comma-separated</HelperText>
          </div>
          <div>
            <Label>Personalisation Options</Label>
            <Input placeholder="Name, Title" {...register("personalisation")} />
            <HelperText>Comma-separated</HelperText>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Supplier</Label>
            <Select {...register("supplierId")}>
              <option value="">No supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Image URL (optional)</Label>
            <Input placeholder="https://…" {...register("imageUrl")} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Controller
            control={control}
            name="active"
            render={({ field }) => (
              <input
                type="checkbox"
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
                className="size-4 rounded border-grey-300 text-orange-500 focus:ring-orange-300"
                id="active"
              />
            )}
          />
          <label htmlFor="active" className="text-sm text-navy-700">
            Active (visible in catalogue)
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {product ? "Save Changes" : "Create Product"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
