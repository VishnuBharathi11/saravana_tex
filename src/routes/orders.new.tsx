import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Save, Search } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/common/glass";
import { CustomerLeadSearch } from "@/components/common/customer-lead-search";
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
import { useCrm, crm } from "@/lib/store";
import { TEXTILE_TYPES, TEXTILE_UNITS } from "@/lib/constants";
import { toast } from "sonner";
import type { Order, OrderStatus } from "@/types";

export const Route = createFileRoute("/orders/new")({
  head: () => ({
    meta: [
      { title: "New order · Saravana Traders CRM" },
      { name: "description", content: "Raise a new order against an existing customer account." },
      { property: "og:title", content: "New order · Saravana Traders CRM" },
      {
        property: "og:description",
        content: "Order entry form with material, pricing and delivery.",
      },
    ],
  }),
  component: NewOrder,
});

function NewOrder() {
  const user = useRequireAuth();
  const navigate = useNavigate();
  const [picked, setPicked] = useState<string | null>(null);

  const [d, setD] = useState<Partial<Order>>({
    status: "Draft",
    paymentStatus: "Pending",
    quantity: 0,
    price: 0,
    value: 0,
    units: TEXTILE_UNITS[0],
    materialType: TEXTILE_TYPES[0],
  });

  if (!user) return null;

  const upd = (patch: Partial<Order>) => {
    setD((prev) => {
      const next = { ...prev, ...patch };
      if (patch.quantity !== undefined || patch.price !== undefined) {
        next.value = (next.quantity || 0) * (next.price || 0);
      }
      return next;
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!picked) {
      toast.error("Please select a customer first.");
      return;
    }
    const o: Order = {
      id: `ORD-${Math.floor(Math.random() * 100000)}`,
      invoiceNumber: `ST/26-27/TEMP`,
      customerId: d.customerId || "",
      customerName: d.customerName || "",
      company: d.company || "",
      material: d.material || "",
      materialType: d.materialType || TEXTILE_TYPES[0],
      quantity: d.quantity || 0,
      units: d.units || TEXTILE_UNITS[0],
      price: d.price || 0,
      value: d.value || 0,
      paymentStatus: d.paymentStatus || "Pending",
      status: d.status || "Draft",
      employeeId: d.employeeId || user.id,
      createdAt: new Date().toISOString().slice(0, 10),
      deliveryDate: d.deliveryDate || "",
      address: d.address || "",
      notes: d.notes || "",
    };
    crm.addOrder(o);
    toast.success("Order created");
    navigate({ to: "/orders" });
  };

  return (
    <AppShell>
      <div className="space-y-4">
        <Button variant="ghost" className="gap-2 pl-0" onClick={() => navigate({ to: "/orders" })}>
          <ArrowLeft className="size-4" /> Back
        </Button>

        <PageHeader
          title="Create order"
          subtitle="Search a customer, then capture the order details"
        />

        <div className="glass rounded-2xl p-4">
          <Label>Customer</Label>
          <div className="mt-1.5">
            <CustomerLeadSearch
              value={picked}
              onChange={(id, record) => {
                setPicked(id);
                if (record) {
                  upd({
                    customerId: record.id,
                    customerName: record.name,
                    company: record.company,
                    address: record.address,
                    employeeId: record.employeeId,
                  });
                } else {
                  upd({
                    customerId: "",
                    customerName: "",
                    company: "",
                    address: "",
                    employeeId: "",
                  });
                }
              }}
              typeFilter="Customer"
              placeholder="Start typing a customer name…"
            />
          </div>
        </div>

        <form className="glass rounded-2xl p-4" onSubmit={handleSave}>
          <p className="text-sm font-semibold">Order details</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="material">Material</Label>
              <Input
                id="material"
                placeholder="Grey Fabric"
                value={d.material || ""}
                onChange={(e) => upd({ material: e.target.value })}
                className="glass-soft h-10 border-0"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={d.quantity || ""}
                onChange={(e) => upd({ quantity: Number(e.target.value) })}
                className="glass-soft h-10 border-0"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="price">Unit price (₹)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                value={d.price || ""}
                onChange={(e) => upd({ price: Number(e.target.value) })}
                className="glass-soft h-10 border-0"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={d.materialType || ""} onValueChange={(v) => upd({ materialType: v })}>
                <SelectTrigger className="glass-soft h-10 w-full border-0">
                  <SelectValue placeholder="Type" />
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
              <Label>Units</Label>
              <Select value={d.units || ""} onValueChange={(v) => upd({ units: v })}>
                <SelectTrigger className="glass-soft h-10 w-full border-0">
                  <SelectValue placeholder="Units" />
                </SelectTrigger>
                <SelectContent>
                  {TEXTILE_UNITS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="delivery">Delivery date (DD/MM/YYYY)</Label>
              <Input
                id="delivery"
                type="date"
                value={d.deliveryDate || ""}
                onChange={(e) => upd({ deliveryDate: e.target.value })}
                className="glass-soft h-10 border-0"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={d.status || ""}
                onValueChange={(v) => upd({ status: v as OrderStatus })}
              >
                <SelectTrigger className="glass-soft h-10 w-full border-0">
                  <SelectValue placeholder="Pending" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "Draft",
                    "Confirmed",
                    "Processing",
                    "Packed",
                    "Dispatched",
                    "Delivered",
                    "Cancelled",
                  ].map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={d.address || ""}
                onChange={(e) => upd({ address: e.target.value })}
                className="glass-soft h-10 border-0"
                required
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                rows={3}
                value={d.notes || ""}
                onChange={(e) => upd({ notes: e.target.value })}
                placeholder="Dispatch instructions, site contact…"
                className="glass-soft border-0"
              />
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button type="submit" className="gap-2 rounded-xl">
              <Save className="size-4" /> Save order
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl"
              onClick={() => navigate({ to: "/orders" })}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
