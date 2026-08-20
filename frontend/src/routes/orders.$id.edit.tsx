import { useState, useEffect } from "react";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Save, X } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/common/glass";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { crm, useCrm } from "@/lib/store";
import { toast } from "sonner";
import { inr } from "@/data/mock";
import { TEXTILE_TYPES, TEXTILE_UNITS } from "@/lib/constants";
import type { Order, OrderStatus, PaymentStatus } from "@/types";
import { canEditRecord } from "@/lib/permissions";

export const Route = createFileRoute("/orders/$id/edit")({
  head: () => ({
    meta: [{ title: "Edit Order · Saravana Traders CRM" }],
  }),
  component: OrderEdit,
});

const ORDER_STATUSES: OrderStatus[] = [
  "Draft",
  "Confirmed",
  "Processing",
  "Packed",
  "Dispatched",
  "Delivered",
  "Cancelled",
];
const PAYMENT_STATUSES: PaymentStatus[] = ["Pending", "Partial", "Paid"];
const UNITS = TEXTILE_UNITS;

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-white/55 px-3 py-2.5">
      <p className="text-[11px] tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-0.5 text-sm font-medium break-words">{value === "" ? "—" : value}</p>
    </div>
  );
}

function OrderEdit() {
  const user = useRequireAuth();
  const navigate = useNavigate();
  const { id } = useParams({ from: "/orders/$id/edit" });
  const { orders, employees } = useCrm();
  const order = orders.find((o) => o.id === id);

  const [draft, setDraft] = useState<Order | null>(null);

  useEffect(() => {
    if (order) setDraft(order);
  }, [order]);

  if (!user) return null;
  if (!order || !draft) {
    return (
      <AppShell>
        <div className="glass rounded-2xl p-8 text-center">
          <p className="text-sm text-muted-foreground">Order not found.</p>
          <Button variant="link" onClick={() => navigate({ to: "/orders" })}>
            Back to orders
          </Button>
        </div>
      </AppShell>
    );
  }
  
  if (!canEditRecord(user, order)) {
    return (
      <AppShell>
        <div className="glass rounded-2xl p-8 text-center">
          <p className="text-sm text-muted-foreground">You do not have permission to edit this order.</p>
          <Button variant="link" onClick={() => navigate({ to: "/orders" })}>
            Back to orders
          </Button>
        </div>
      </AppShell>
    );
  }

  const upd = (patch: Partial<Order>) => {
    const next = { ...draft, ...patch };
    next.value = Math.round(next.price * next.quantity);
    setDraft(next);
  };

  const save = () => {
    if (!draft.material.trim()) {
      toast.error("Material is required");
      return;
    }
    crm.updateOrder(draft.id, draft);
    toast.success("Order updated");
    navigate({ to: "/orders" });
  };

  return (
    <AppShell>
      <div className="space-y-4">
        <Button variant="ghost" className="gap-2 pl-0" onClick={() => navigate({ to: "/orders" })}>
          <ArrowLeft className="size-4" /> Back to Orders
        </Button>

        <PageHeader title={`Edit Order ${draft.invoiceNumber}`} subtitle={draft.customerName} />

        <div className="glass rounded-2xl p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="o-material">Material</Label>
              <Input
                id="o-material"
                value={draft.material}
                onChange={(e) => upd({ material: e.target.value })}
                className="h-10 border-0 bg-white/70"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={draft.materialType} onValueChange={(v) => upd({ materialType: v })}>
                <SelectTrigger className="h-10 w-full border-0 bg-white/70">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEXTILE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="o-qty">Quantity</Label>
              <Input
                id="o-qty"
                type="number"
                min={0}
                value={draft.quantity}
                onChange={(e) => upd({ quantity: Number(e.target.value) })}
                className="h-10 border-0 bg-white/70"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Units</Label>
              <Select value={draft.units} onValueChange={(v) => upd({ units: v })}>
                <SelectTrigger className="h-10 w-full border-0 bg-white/70">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="o-price">Unit price (₹)</Label>
              <Input
                id="o-price"
                type="number"
                min={0}
                value={draft.price}
                onChange={(e) => upd({ price: Number(e.target.value) })}
                className="h-10 border-0 bg-white/70"
              />
            </div>
            <Field label="Total value" value={inr(draft.value)} />

            <div className="space-y-1.5">
              <Label>Order status</Label>
              <Select value={draft.status} onValueChange={(v) => upd({ status: v as OrderStatus })}>
                <SelectTrigger className="h-10 w-full border-0 bg-white/70">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Payment status</Label>
              <Select
                value={draft.paymentStatus}
                onValueChange={(v) => upd({ paymentStatus: v as PaymentStatus })}
              >
                <SelectTrigger className="h-10 w-full border-0 bg-white/70">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="o-delivery">Delivery date</Label>
              <Input
                id="o-delivery"
                type="date"
                value={draft.deliveryDate}
                onChange={(e) => upd({ deliveryDate: e.target.value })}
                className="h-10 border-0 bg-white/70"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Assigned employee</Label>
              <Select value={draft.employeeId} onValueChange={(v) => upd({ employeeId: v })}>
                <SelectTrigger className="h-10 w-full border-0 bg-white/70">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="o-address">Delivery address</Label>
              <Input
                id="o-address"
                value={draft.address}
                onChange={(e) => upd({ address: e.target.value })}
                className="h-10 border-0 bg-white/70"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="o-notes">Notes</Label>
              <Textarea
                id="o-notes"
                rows={3}
                value={draft.notes}
                onChange={(e) => upd({ notes: e.target.value })}
                className="border-0 bg-white/70"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button className="gap-1.5 rounded-xl" onClick={save}>
              <Save className="size-4" /> Save
            </Button>
            <Button
              variant="ghost"
              className="gap-1.5 rounded-xl"
              onClick={() => navigate({ to: "/orders" })}
            >
              <X className="size-4" /> Cancel
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
