"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Package,
  Truck,
  ShieldCheck,
  FileEdit as FileEditIcon,
  Paperclip,
  Plus,
  Trash2,
  Save,
  Send,
  Sparkles,
} from "lucide-react";
import { SectionCard } from "@/components/ui/section-card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, Select, HelperText } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileDropzone, type PendingFile } from "@/components/domain/file-dropzone";
import { SuccessCelebration } from "@/components/domain/success-celebration";
import { useOrderDraft } from "@/components/providers/order-draft-provider";
import { formatCurrency } from "@/lib/utils";
import {
  DELIVERY_METHODS,
  DELIVERY_METHOD_LABELS,
  URGENCY_LEVELS,
  URGENCY_LABELS,
  MANAGER_ROLES,
  ROLE_LABELS,
  isAdmin,
  type Role,
} from "@/lib/constants";

type Product = {
  id: string;
  name: string;
  price: number | null;
  priceOnRequest: boolean;
  minOrderQty: number;
  sizesJson: string;
  finishesJson: string;
  category: { id: string; name: string };
};
type Supplier = { id: string; name: string };
type Branch = { id: string; name: string };
type Agent = { id: string; name: string; branchId: string | null };

type ItemForm = {
  productId: string | null;
  name: string;
  quantity: number;
  size?: string;
  colour?: string;
  material?: string;
  finish?: string;
  customWording?: string;
  unitPrice?: number;
  priceOnRequest?: boolean;
};

type FormValues = {
  branchId: string;
  agentId: string;
  agentContact: string;
  deliveryMethod: string;
  deliveryAddress: string;
  requiredDate: string;
  urgency: string;
  supplierId: string;
  motivation: string;
  costCentre: string;
  notes: string;
  items: ItemForm[];
};

function parseArr(json?: string): string[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export default function NewOrderPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { items: draftItems, clear: clearDraft } = useOrderDraft();
  const seededRef = useRef(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [requiredApprovals, setRequiredApprovals] = useState<Role[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");

  const [artwork, setArtwork] = useState<PendingFile[]>([]);
  const [logo, setLogo] = useState<PendingFile[]>([]);
  const [documents, setDocuments] = useState<PendingFile[]>([]);
  const [reference, setReference] = useState<PendingFile[]>([]);

  const [submitting, setSubmitting] = useState<"draft" | "submit" | null>(null);
  const [success, setSuccess] = useState<{ orderNumber: string; orderId: string } | null>(null);

  const admin = session?.user?.role ? isAdmin(session.user.role) : false;

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      branchId: "",
      agentId: session?.user?.id ?? "",
      agentContact: "",
      deliveryMethod: "COLLECT_FROM_OFFICE",
      deliveryAddress: "",
      requiredDate: "",
      urgency: "NORMAL",
      supplierId: "",
      motivation: "",
      costCentre: "",
      notes: "",
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const deliveryMethod = watch("deliveryMethod");
  const watchedItems = watch("items");

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/suppliers").then((r) => r.json()),
      fetch("/api/branches").then((r) => r.json()),
      admin ? fetch("/api/agents").then((r) => r.json()) : Promise.resolve({ agents: [] }),
    ]).then(([p, s, b, a]) => {
      setProducts(p.products);
      setSuppliers(s.suppliers);
      setBranches(b.branches);
      setAgents(a.agents);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin]);

  useEffect(() => {
    if (seededRef.current || draftItems.length === 0) return;
    seededRef.current = true;
    for (const d of draftItems) {
      append({
        productId: d.productId,
        name: d.name,
        quantity: d.quantity,
        size: d.size,
        colour: d.colour,
        material: d.material,
        finish: d.finish,
        customWording: d.customWording,
        unitPrice: d.unitPrice ?? undefined,
        priceOnRequest: d.priceOnRequest,
      });
    }
    clearDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftItems]);

  function addProductToOrder() {
    if (!selectedProductId) return;
    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;
    append({
      productId: product.id,
      name: product.name,
      quantity: product.minOrderQty,
      unitPrice: product.price ?? undefined,
      priceOnRequest: product.priceOnRequest,
    });
    setSelectedProductId("");
  }

  function addCustomItem() {
    append({ productId: null, name: "", quantity: 1, unitPrice: 0, priceOnRequest: false });
  }

  const estimatedTotal = useMemo(
    () =>
      (watchedItems ?? []).reduce((sum, it) => {
        if (it?.priceOnRequest) return sum;
        return sum + (Number(it?.unitPrice) || 0) * (Number(it?.quantity) || 0);
      }, 0),
    [watchedItems]
  );

  function toggleApprover(role: Role) {
    setRequiredApprovals((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
  }

  async function uploadAll(): Promise<{ url: string; name: string; kind: string }[]> {
    const groups: [PendingFile[], string][] = [
      [artwork, "ARTWORK"],
      [logo, "LOGO"],
      [documents, "DOCUMENT"],
      [reference, "REFERENCE_IMAGE"],
    ];
    const results: { url: string; name: string; kind: string }[] = [];
    for (const [group, kind] of groups) {
      for (const pf of group) {
        const fd = new FormData();
        fd.append("file", pf.file);
        const res = await fetch("/api/uploads", { method: "POST", body: fd });
        if (res.ok) {
          const data = await res.json();
          results.push({ url: data.url, name: data.name, kind });
        }
      }
    }
    return results;
  }

  async function onSubmit(values: FormValues, action: "draft" | "submit") {
    if (action === "submit") {
      if (!values.items || values.items.length === 0) {
        toast.error("Add at least one product before submitting.");
        return;
      }
      if (!values.motivation || values.motivation.trim().length < 5) {
        toast.error("Please provide a motivation or reason for the order.");
        return;
      }
      if (requiredApprovals.length === 0) {
        toast.error("Select at least one required approver.");
        return;
      }
      if (deliveryMethod !== "COLLECT_FROM_OFFICE" && !values.deliveryAddress) {
        toast.error("A delivery address is required for this delivery method.");
        return;
      }
    }

    setSubmitting(action);
    try {
      const uploaded = await uploadAll();
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, requiredApprovals, files: uploaded, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Something went wrong.");
        setSubmitting(null);
        return;
      }
      if (action === "submit") {
        setSuccess({ orderNumber: data.order.orderNumber, orderId: data.order.id });
      } else {
        toast.success(`Draft saved as ${data.order.orderNumber}`);
        router.push(`/orders/${data.order.id}`);
      }
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">
        <div>
          <p className="text-sm font-medium text-orange-600">New Order</p>
          <h1 className="font-display text-2xl font-semibold text-navy-800 sm:text-3xl">Create an Order</h1>
          <p className="mt-1 text-sm text-grey-500">Add products, choose delivery details, and submit for approval.</p>
        </div>

        <form className="space-y-5">
          <SectionCard title="Order Items" description="Add one or more products or services" icon={Package}>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row">
              <Select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} className="flex-1">
                <option value="">Select a product to add…</option>
                {Object.entries(
                  products.reduce<Record<string, Product[]>>((acc, p) => {
                    (acc[p.category.name] ??= []).push(p);
                    return acc;
                  }, {})
                ).map(([cat, prods]) => (
                  <optgroup key={cat} label={cat}>
                    {prods.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.priceOnRequest ? "Price on Request" : formatCurrency(p.price)}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </Select>
              <Button type="button" variant="outline" onClick={addProductToOrder} disabled={!selectedProductId}>
                <Plus className="size-4" /> Add
              </Button>
              <Button type="button" variant="ghost" onClick={addCustomItem}>
                Custom item
              </Button>
            </div>

            {fields.length === 0 ? (
              <p className="rounded-xl border border-dashed border-grey-200 py-8 text-center text-sm text-grey-400">
                No items yet. Add a product above, or browse the{" "}
                <a href="/products" className="font-medium text-orange-600">
                  catalogue
                </a>
                .
              </p>
            ) : (
              <div className="space-y-3">
                {fields.map((field, index) => {
                  const product = products.find((p) => p.id === watchedItems?.[index]?.productId);
                  const sizes = parseArr(product?.sizesJson);
                  const finishes = parseArr(product?.finishesJson);
                  return (
                    <motion.div
                      key={field.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl border border-grey-100 bg-grey-50/60 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        {field.productId ? (
                          <p className="font-medium text-navy-800">{watchedItems?.[index]?.name}</p>
                        ) : (
                          <Input
                            placeholder="Item name / description"
                            {...register(`items.${index}.name` as const, { required: true })}
                            className="mr-3"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="shrink-0 text-grey-400 hover:text-red-500"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div>
                          <Label className="text-xs">Quantity</Label>
                          <Input type="number" min={1} {...register(`items.${index}.quantity` as const, { valueAsNumber: true, min: 1 })} />
                        </div>
                        {sizes.length > 0 ? (
                          <div>
                            <Label className="text-xs">Size</Label>
                            <Select {...register(`items.${index}.size` as const)}>
                              <option value="">—</option>
                              {sizes.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </Select>
                          </div>
                        ) : (
                          <div>
                            <Label className="text-xs">Size</Label>
                            <Input {...register(`items.${index}.size` as const)} />
                          </div>
                        )}
                        <div>
                          <Label className="text-xs">Colour</Label>
                          <Input {...register(`items.${index}.colour` as const)} />
                        </div>
                        {finishes.length > 0 ? (
                          <div>
                            <Label className="text-xs">Finish</Label>
                            <Select {...register(`items.${index}.finish` as const)}>
                              <option value="">—</option>
                              {finishes.map((f) => (
                                <option key={f} value={f}>
                                  {f}
                                </option>
                              ))}
                            </Select>
                          </div>
                        ) : (
                          <div>
                            <Label className="text-xs">Finish</Label>
                            <Input {...register(`items.${index}.finish` as const)} />
                          </div>
                        )}
                      </div>
                      <div className="mt-3">
                        <Label className="text-xs">Custom wording / personalisation</Label>
                        <Input placeholder="e.g. Agent name, mobile number…" {...register(`items.${index}.customWording` as const)} />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-grey-500">
                        <span>Material: </span>
                        <Input className="mr-auto ml-2 h-8 flex-1" {...register(`items.${index}.material` as const)} />
                        <span className="ml-4 font-medium text-navy-700">
                          {watchedItems?.[index]?.priceOnRequest
                            ? "Price on Request"
                            : formatCurrency((watchedItems?.[index]?.unitPrice || 0) * (watchedItems?.[index]?.quantity || 0))}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Delivery & Timing" description="How and when should this be fulfilled" icon={Truck}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Delivery Method</Label>
                <Select {...register("deliveryMethod")}>
                  {DELIVERY_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {DELIVERY_METHOD_LABELS[m]}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Urgency</Label>
                <Select {...register("urgency")}>
                  {URGENCY_LEVELS.map((u) => (
                    <option key={u} value={u}>
                      {URGENCY_LABELS[u]}
                    </option>
                  ))}
                </Select>
              </div>
              {deliveryMethod !== "COLLECT_FROM_OFFICE" && (
                <div className="sm:col-span-2">
                  <Label>Delivery Address</Label>
                  <Textarea {...register("deliveryAddress")} />
                </div>
              )}
              <div>
                <Label>Required Date</Label>
                <Input type="date" {...register("requiredDate")} />
              </div>
              <div>
                <Label>Supplier Preference (optional)</Label>
                <Select {...register("supplierId")}>
                  <option value="">No preference</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Approvals Required"
            description="Choose which managers must approve this order"
            icon={ShieldCheck}
            badge={
              <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-700">
                {requiredApprovals.length} of {MANAGER_ROLES.length} selected
              </span>
            }
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {MANAGER_ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleApprover(role)}
                  className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition-colors ${
                    requiredApprovals.includes(role)
                      ? "border-orange-500 bg-orange-50 text-orange-700"
                      : "border-grey-200 text-grey-500 hover:border-grey-300"
                  }`}
                >
                  {ROLE_LABELS[role]}
                </button>
              ))}
            </div>
            <HelperText className="mt-3">
              The order will move to &ldquo;Ordered from Supplier&rdquo; only once every selected manager has approved.
            </HelperText>
          </SectionCard>

          <SectionCard title="Additional Details" description="Motivation, cost centre and notes" icon={FileEditIcon}>
            <div className="space-y-4">
              {admin && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Agent</Label>
                    <Select {...register("agentId")}>
                      {agents.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label>Branch / Office</Label>
                    <Select {...register("branchId")}>
                      <option value="">Use agent&apos;s default branch</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
              )}
              <div>
                <Label>Motivation / Reason for the Order</Label>
                <Textarea
                  invalid={!!errors.motivation}
                  placeholder="Why is this order needed?"
                  {...register("motivation")}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label>Agent Contact Details</Label>
                  <Input placeholder="Mobile number or email" {...register("agentContact")} />
                </div>
                <div>
                  <Label>Internal Cost Centre</Label>
                  <Input {...register("costCentre")} />
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea {...register("notes")} />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Attachments" description="Artwork, logos, documents and reference images" icon={Paperclip} defaultOpen={false}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FileDropzone label="Artwork" files={artwork} onChange={setArtwork} />
              <FileDropzone label="Logo" files={logo} onChange={setLogo} />
              <FileDropzone label="Supporting Documents" files={documents} onChange={setDocuments} />
              <FileDropzone label="Reference Images" files={reference} onChange={setReference} />
            </div>
          </SectionCard>
        </form>
      </div>

      {/* Live order summary */}
      <div className="lg:col-span-1">
        <div className="sticky top-20 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="size-4 text-orange-500" /> Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(!watchedItems || watchedItems.length === 0) && (
                <p className="text-sm text-grey-400">Your order is empty.</p>
              )}
              {watchedItems?.map((it, i) => (
                <div key={i} className="flex items-start justify-between gap-2 text-sm">
                  <span className="text-navy-700">
                    {it.quantity}× {it.name || "Untitled item"}
                  </span>
                  <span className="shrink-0 font-medium text-navy-800">
                    {it.priceOnRequest ? "POR" : formatCurrency((it.unitPrice || 0) * (it.quantity || 0))}
                  </span>
                </div>
              ))}
              <div className="border-t border-grey-100 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-navy-700">Estimated Total</span>
                  <motion.span
                    key={estimatedTotal}
                    initial={{ scale: 1.1, color: "#ff6b00" }}
                    animate={{ scale: 1, color: "#142244" }}
                    className="font-display text-lg font-semibold"
                  >
                    {formatCurrency(estimatedTotal)}
                  </motion.span>
                </div>
                <p className="mt-1 text-[11px] text-grey-400">Final pricing may vary for items marked Price on Request.</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2">
            <Button
              type="button"
              loading={submitting === "submit"}
              disabled={submitting !== null}
              onClick={handleSubmit((v) => onSubmit(v, "submit"))}
              magnetic
            >
              <Send className="size-4" /> Submit Order
            </Button>
            <Button
              type="button"
              variant="outline"
              loading={submitting === "draft"}
              disabled={submitting !== null}
              onClick={handleSubmit((v) => onSubmit(v, "draft"))}
            >
              <Save className="size-4" /> Save as Draft
            </Button>
          </div>
        </div>
      </div>

      <SuccessCelebration
        open={!!success}
        title="Order submitted!"
        description={success ? `${success.orderNumber} is now awaiting approval.` : undefined}
      >
        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => success && router.push(`/orders/${success.orderId}`)}>
            View Order
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              setSuccess(null);
              router.push("/orders/new");
              router.refresh();
            }}
          >
            New Order
          </Button>
        </div>
      </SuccessCelebration>
    </div>
  );
}
