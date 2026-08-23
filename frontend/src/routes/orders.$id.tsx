import { useState } from "react";
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, PencilLine, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { GlassCard, PageHeader } from "@/components/common/glass";
import { StatusChip } from "@/components/common/status-chip";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { getOrder, deleteOrder } from "@/api/orders";
import { getEmployees } from "@/api/employees";
import { toast } from "sonner";
import { canEditRecord, canDeleteRecord } from "@/lib/permissions";

export const Route = createFileRoute("/orders/$id")({ head: () => ({ meta: [{ title: "Order detail · Saravana Traders CRM" }] }), component: OrderDetailPage });
const inr = (v: number) => `₹${v.toLocaleString("en-IN")}`;
function Field({ label, value }: { label: string; value: string | number }) { return <div className="rounded-xl bg-white/55 px-3 py-2.5"><p className="text-[11px] tracking-wide text-muted-foreground uppercase">{label}</p><p className="mt-0.5 break-words text-sm font-medium">{value === "" ? "—" : value}</p></div>; }
function OrderDetailPage() {
  const user = useRequireAuth(); const navigate = useNavigate(); const { id } = useParams({ from: "/orders/$id" }); const queryClient = useQueryClient();
  const [openDelete, setOpenDelete] = useState(false);
  const orderQuery = useQuery({ queryKey: ["orders", id], queryFn: () => getOrder(id), enabled: Boolean(user && id) });
  const employeesQuery = useQuery({ queryKey: ["employees"], queryFn: getEmployees, enabled: Boolean(user) });
  const deleteMutation = useMutation({ mutationFn: () => deleteOrder(id), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["orders"] }); queryClient.removeQueries({ queryKey: ["orders", id] }); toast.success("Order deleted"); navigate({ to: "/orders" }); }, onError: (e) => toast.error(e instanceof Error ? e.message : "Unable to delete order") });
  if (!user) return null;
  if (orderQuery.isPending) return <AppShell><div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">Loading order...</div></AppShell>;
  const order = orderQuery.data;
  if (orderQuery.isError || !order) return <AppShell><GlassCard className="p-10 text-center"><p className="font-semibold">Order not found</p><Link to="/orders" className="mt-3 inline-block text-sm text-primary underline">Back to orders</Link></GlassCard></AppShell>;
  const employees = employeesQuery.data ?? []; const employee = employees.find((e) => e.id === order.employeeId);
  return <AppShell><div className="space-y-4"><Button asChild variant="ghost" size="sm" className="gap-2"><Link to="/orders"><ArrowLeft className="size-4" /> Orders</Link></Button><PageHeader title={order.invoiceNumber} subtitle={`${order.customerName} · ${order.company}`} actions={canEditRecord(user, order) ? <><Button size="sm" variant="outline" className="glass-soft gap-1.5 rounded-xl border-0" onClick={() => navigate({ to: "/orders/$id/edit", params: { id: order.id } })}><PencilLine className="size-3.5" /> Edit</Button>{canDeleteRecord(user, order) && <Button size="sm" variant="ghost" className="gap-1.5 rounded-xl text-destructive" onClick={() => setOpenDelete(true)}><Trash2 className="size-3.5" /> Delete</Button>}</> : null} /><GlassCard className="p-4"><div className="grid gap-2 sm:grid-cols-2"><Field label="Customer" value={order.customerName} /><Field label="Company" value={order.company} /><Field label="Material" value={`${order.material} · ${order.materialType}`} /><Field label="Quantity" value={`${order.quantity} ${order.units}`} /><Field label="Unit price" value={inr(order.price)} /><Field label="Total value" value={inr(order.value)} /><Field label="Delivery date" value={order.deliveryDate} /><Field label="Created" value={order.createdAt} /><div className="rounded-xl bg-white/55 px-3 py-2.5"><p className="text-[11px] tracking-wide text-muted-foreground uppercase">Order status</p><StatusChip value={order.status} className="mt-1" /></div><div className="rounded-xl bg-white/55 px-3 py-2.5"><p className="text-[11px] tracking-wide text-muted-foreground uppercase">Payment status</p><StatusChip value={order.paymentStatus} className="mt-1" /></div>{employee && <Field label="Assigned employee" value={employee.name} />}<div className="sm:col-span-2"><Field label="Delivery address" value={order.address} /></div>{order.notes && <div className="sm:col-span-2"><Field label="Notes" value={order.notes} /></div>}<div className="sm:col-span-2"><Button variant="ghost" className="rounded-xl px-0" onClick={() => navigate({ to: "/customers/$id", params: { id: order.customerId } })}>Open customer account →</Button></div></div></GlassCard></div><ConfirmDialog open={openDelete} onOpenChange={setOpenDelete} title="Delete this order?" description="The order will be permanently removed from the register." confirmLabel={deleteMutation.isPending ? "Deleting..." : "Delete order"} destructive onConfirm={() => deleteMutation.mutate()} /></AppShell>;
}
