import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/common/glass";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { getOrder, updateOrder, type UpdateOrderInput, type CreateOrderItemInput } from "@/api/orders";
import { getEmployees } from "@/api/employees";
import { toast } from "sonner";
import { TEXTILE_UNITS } from "@/lib/constants";
import type { OrderStatus } from "@/types";
import { canEditRecord } from "@/lib/permissions";

export const Route = createFileRoute("/orders/$id/edit")({ head: () => ({ meta: [{ title: "Edit Order · Saravana Traders CRM" }] }), component: OrderEdit });
const ORDER_STATUSES: OrderStatus[] = ["Confirmed", "Pending", "Cancel"] as OrderStatus[];
const blank = (): CreateOrderItemInput => ({ material: "", materialType: "General", quantity: 1, units: TEXTILE_UNITS[0] ?? "Tons", price: 0, deliveryDate: "" });

function OrderEdit() {
  const user = useRequireAuth();
  const navigate = useNavigate();
  const { id } = useParams({ from: "/orders/$id/edit" });
  const queryClient = useQueryClient();
  const orderQuery = useQuery({ queryKey: ["orders", id], queryFn: () => getOrder(id), enabled: Boolean(user && id) });
  const employeesQuery = useQuery({ queryKey: ["employees"], queryFn: getEmployees, enabled: Boolean(user) });
  const [draft, setDraft] = useState<UpdateOrderInput | null>(null);
  const [items, setItems] = useState<CreateOrderItemInput[]>([]);

  useEffect(() => {
    if (!orderQuery.data) return;
    const order = orderQuery.data;
    setDraft({ orderId: order.id, invoiceNumber: order.invoiceNumber, customerId: order.customerId, status: order.status, employeeId: order.employeeId, deliveryDate: order.deliveryDate, address: order.address, notes: order.notes });
    setItems(order.items?.length ? order.items.map(({ id: _id, value: _value, ...item }) => ({ ...item, deliveryDate: item.deliveryDate ?? order.deliveryDate })) : [{ material: order.material, materialType: order.materialType, quantity: order.quantity, units: order.units, price: order.price, deliveryDate: order.deliveryDate }]);
  }, [orderQuery.data]);

  const mutation = useMutation({
    mutationFn: (input: UpdateOrderInput) => updateOrder(id, input),
    onSuccess: async (updated) => {
      queryClient.setQueryData(["orders", id], updated);
      await queryClient.invalidateQueries({ queryKey: ["orders"] });
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Order updated");
      navigate({ to: "/orders/$id", params: { id } });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Unable to update order"),
  });

  if (!user) return null;
  if (orderQuery.isPending || !draft || items.length === 0) return <AppShell><div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">Loading order...</div></AppShell>;
  const order = orderQuery.data;
  if (orderQuery.isError || !order) return <AppShell><div className="glass rounded-2xl p-8 text-center"><p className="font-medium">Order not found.</p></div></AppShell>;
  if (!canEditRecord(user, order)) return <AppShell><div className="glass rounded-2xl p-8 text-center"><p className="text-sm text-muted-foreground">You do not have permission to edit this order.</p><Button variant="link" onClick={() => navigate({ to: "/orders" })}>Back to orders</Button></div></AppShell>;

  const updateDraft = (patch: UpdateOrderInput) => setDraft((current) => current ? { ...current, ...patch } : current);
  const updateItem = (index: number, patch: Partial<CreateOrderItemInput>) => setItems((current) => current.map((item, currentIndex) => currentIndex === index ? { ...item, ...patch } : item));
  const removeItem = (index: number) => setItems((current) => current.filter((_, currentIndex) => currentIndex !== index));
  const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const save = (): void => {
    const firstItem = items[0];
    if (!firstItem) {
      toast.error("At least one item is required");
      return;
    }
    const invalid = items.some((item) => !item.material.trim() || !item.units || !item.deliveryDate?.trim() || item.quantity <= 0 || item.price < 0);
    if (invalid || !draft.deliveryDate?.trim() || !draft.address?.trim() || !draft.status) {
      toast.error("Complete all required order fields");
      return;
    }
    mutation.mutate({ ...draft, items, material: firstItem.material, materialType: firstItem.materialType, quantity: firstItem.quantity, units: firstItem.units, price: firstItem.price });
  };

  return <AppShell><div className="space-y-4"><Button variant="ghost" className="gap-2 pl-0" onClick={() => navigate({ to: "/orders/$id", params: { id } })}><ArrowLeft className="size-4" /> Back to Order</Button><PageHeader title={`Edit Order ${order.id}`} subtitle={order.customerName} />
    <div className="glass rounded-2xl p-4"><div className="grid gap-3 sm:grid-cols-2"><div><Label>Order ID</Label><Input value={order.id} readOnly className="h-10 border-0 bg-white/70" /></div><div><Label>Final delivery date</Label><Input type="date" value={draft.deliveryDate ?? ""} onChange={(e) => updateDraft({ deliveryDate: e.target.value })} className="h-10 border-0 bg-white/70" /></div><div className="sm:col-span-2"><Label>Delivery address</Label><Input value={draft.address ?? ""} onChange={(e) => updateDraft({ address: e.target.value })} className="h-10 border-0 bg-white/70" /></div>{user.role === "Admin" && <div><Label>Assigned employee</Label><Select value={draft.employeeId ?? ""} onValueChange={(v) => updateDraft({ employeeId: v })}><SelectTrigger className="h-10 w-full border-0 bg-white/70"><SelectValue /></SelectTrigger><SelectContent>{employeesQuery.data?.filter((employee) => employee.status === "Active").map((employee) => <SelectItem key={employee.id} value={employee.id}>{employee.name}</SelectItem>)}</SelectContent></Select></div>}<div><Label>Status</Label><Select value={draft.status ?? "Pending"} onValueChange={(v) => updateDraft({ status: v as OrderStatus })}><SelectTrigger className="h-10 w-full border-0 bg-white/70"><SelectValue /></SelectTrigger><SelectContent>{ORDER_STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></div></div>
      <div className="mt-5 flex items-center justify-between"><p className="text-sm font-semibold">Items</p><Button type="button" variant="outline" className="gap-1.5 rounded-xl" onClick={() => setItems((current) => [...current, blank()])}><Plus className="size-4" /> Add item</Button></div>
      <div className="mt-3 space-y-3">{items.map((item, index) => <div key={index} className="rounded-2xl border border-border/70 bg-white/45 p-3"><div className="mb-2 flex items-center justify-between"><p className="text-xs font-semibold text-muted-foreground">Item {index + 1}</p>{items.length > 1 && <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeItem(index)}><Trash2 className="size-4" /></Button>}</div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div><Label>Item</Label><Input value={item.material} onChange={(e) => updateItem(index, { material: e.target.value })} className="h-10 border-0 bg-white/70" /></div><div><Label>Quantity</Label><Input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })} className="h-10 border-0 bg-white/70" /></div><div><Label>Units</Label><Select value={item.units} onValueChange={(v) => updateItem(index, { units: v })}><SelectTrigger className="h-10 w-full border-0 bg-white/70"><SelectValue /></SelectTrigger><SelectContent>{TEXTILE_UNITS.map((unit) => <SelectItem key={unit} value={unit}>{unit}</SelectItem>)}</SelectContent></Select></div><div><Label>Unit price (₹)</Label><Input type="number" min={0} value={item.price} onChange={(e) => updateItem(index, { price: Number(e.target.value) })} className="h-10 border-0 bg-white/70" /></div><div className="sm:col-span-2 lg:col-span-4"><Label>Delivery date</Label><Input type="date" value={item.deliveryDate ?? ""} onChange={(e) => updateItem(index, { deliveryDate: e.target.value })} className="h-10 border-0 bg-white/70" /></div></div></div>)}</div>
      <div className="mt-4 sm:col-span-2"><Label>Notes</Label><Textarea rows={3} value={draft.notes ?? ""} onChange={(e) => updateDraft({ notes: e.target.value })} className="border-0 bg-white/70" /></div>
      <div className="mt-4 flex items-center gap-2"><Button type="button" onClick={save} disabled={mutation.isPending}><Save className="size-4" /> {mutation.isPending ? "Saving..." : "Save order"}</Button><Button type="button" variant="ghost" onClick={() => navigate({ to: "/orders/$id", params: { id } })}>Cancel</Button><div className="ml-auto rounded-xl bg-mint/30 px-4 py-2 text-sm font-semibold">Total: ₹{total.toLocaleString("en-IN")}</div></div>
    </div></div></AppShell>;
}
