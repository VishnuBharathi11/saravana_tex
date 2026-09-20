import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, AlertTriangle, Package, Trash2, UserRound, Users } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/common/glass";
import { StatCard } from "@/components/common/stat-card";
import { StatusChip } from "@/components/common/status-chip";
import { DataTable, type Column } from "@/components/common/data-table";
import { DashboardWorkflowOptions } from "@/components/dashboard/dashboard-workflow-options";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { getDashboardSummary, getDashboardFollowUps } from "@/api/dashboard";
import { getLeads } from "@/api/leads";
import { getCustomers } from "@/api/customers";
import { getOrders, deleteOrder, updateOrder } from "@/api/orders";
import { getEmployees } from "@/api/employees";
import { cn } from "@/lib/utils";
import { canDeleteRecord } from "@/lib/permissions";
import { toast } from "sonner";
import type { Lead, Order, OrderStatus } from "@/types";
export const Route = createFileRoute("/dashboard")({ head: () => ({ meta: [{ title: "Dashboard · Saravana Traders CRM" }, { name: "description", content: "Business overview with orders, customers, leads, revenue and follow-up KPIs." }] }), component: DashboardPage });
const TODAY = new Date().toISOString().slice(0, 10);
const ORDER_STATUS_RANK: Record<string, number> = { Confirmed: 1, Pending: 2, Cancel: 3, Cancelled: 3, Draft: 2, Processing: 2, Packed: 2, Dispatched: 2, Delivered: 2 };
const displayOrderStatus = (status: string) => status === "Cancelled" ? "Cancel" : status === "Draft" ? "Pending" : status;
const ORDER_STATUSES: OrderStatus[] = ["Confirmed", "Pending", "Cancel"];
function DashboardPage() {
  const user = useRequireAuth(); const navigate = useNavigate(); const queryClient = useQueryClient(); const [board, setBoard] = useState<"leads" | "converted" | "orders" | "employees">("orders"); const [mobileTab, setMobileTab] = useState<"Upcoming" | "Pending">("Upcoming"); const [confirmDelete, setConfirmDelete] = useState(false); const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null); const [orderStatusFilter, setOrderStatusFilter] = useState("All");
  const summaryQuery = useQuery({ queryKey: ["dashboard", "summary"], queryFn: getDashboardSummary, enabled: Boolean(user) }); const followUpsQuery = useQuery({ queryKey: ["dashboard", "follow-ups"], queryFn: () => getDashboardFollowUps(), enabled: Boolean(user) }); const leadsQuery = useQuery({ queryKey: ["leads"], queryFn: getLeads, enabled: Boolean(user) }); const customersQuery = useQuery({ queryKey: ["customers"], queryFn: getCustomers, enabled: Boolean(user) }); const ordersQuery = useQuery({ queryKey: ["orders"], queryFn: getOrders, enabled: Boolean(user) }); const employeesQuery = useQuery({ queryKey: ["employees"], queryFn: getEmployees, enabled: Boolean(user) });
  const orderStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) => updateOrder(id, { status }),
    onSuccess: async (updated) => {
      queryClient.setQueryData<Order[]>(["orders"], (current) =>
        current?.map((order) => (order.id === updated.id ? updated : order)) ?? current,
      );
      queryClient.setQueryData(["orders", updated.id], updated);
      await queryClient.invalidateQueries({ queryKey: ["orders"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard", "summary"] });
      toast.success(`Order ${updated.id} status changed to ${displayOrderStatus(updated.status)}`);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to update order status");
    },
  });

  const deleteMutation = useMutation({ mutationFn: (id: string) => deleteOrder(id), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["orders"] }); await queryClient.invalidateQueries({ queryKey: ["follow-ups"] }); await queryClient.invalidateQueries({ queryKey: ["dashboard", "follow-ups"] }); await queryClient.invalidateQueries({ queryKey: ["dashboard", "summary"] }); setConfirmDelete(false); setDeleteTargetId(null); toast.success("Order deleted"); }, onError: (e) => { setConfirmDelete(false); toast.error(e instanceof Error ? e.message : "Unable to delete order"); } });
  const summary = summaryQuery.data; const leads = leadsQuery.data ?? []; const customers = customersQuery.data ?? []; const orders = ordersQuery.data ?? []; const employees = employeesQuery.data ?? []; const followUps = followUpsQuery.data ?? []; const employeeName = (id: string) => employees.find((e) => e.id === id)?.name ?? "Unassigned"; const relatedName = (type: "Lead" | "Customer" | "Order", id: string) => type === "Lead" ? leads.find((l) => l.id === id)?.name ?? id : type === "Customer" ? customers.find((c) => c.id === id)?.name ?? id : orders.find((o) => o.id === id)?.id ?? id;
  const leadStatusRank: Record<string, number> = { Converted: 1, New: 2 };
  const orderBoard = useMemo(
    () =>
      orders
        .filter((o) => orderStatusFilter === "All" || displayOrderStatus(o.status) === orderStatusFilter)
        .slice()
        .sort((a, b) => {
          const statusDiff =
            (ORDER_STATUS_RANK[displayOrderStatus(a.status)] ?? 4) -
            (ORDER_STATUS_RANK[displayOrderStatus(b.status)] ?? 4);
          if (statusDiff !== 0) return statusDiff;
          return (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0);
        }),
    [orders, orderStatusFilter],
  );
  const boardRows = useMemo(() => {
  if (board === "converted") {
    return leads
      .filter((l) => l.status === "Converted")
      .slice()
      .sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0));
  }
  if (board === "orders") return orderBoard.map<Lead>((o) => ({ id: o.id, name: o.customerName, company: o.company, phone: o.id, email: "", address: o.address, material: o.items?.map((i) => i.material).join(", ") || o.material, units: o.units, quantity: o.items?.length || 1, duration: o.deliveryDate, notes: o.notes, employeeId: o.employeeId, status: "Converted", source: "Order", createdAt: o.createdAt, feedback: displayOrderStatus(o.status), priority: "Medium" })); if (board === "employees") return employees
    .slice()
    .sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0))
    .slice(0, 25)
    .map<Lead>((e) => ({ id: e.id, name: e.name, company: e.designation, phone: e.phone, email: e.email, address: "—", material: "—", units: "—", quantity: leads.filter((l) => l.employeeId === e.id).length, duration: e.status, notes: "", employeeId: e.id, status: "New", source: e.role, createdAt: e.createdAt, feedback: `${orders.filter((o) => o.employeeId === e.id).length} orders handled`, priority: "Medium" })); return leads
    .slice()
    .sort((a, b) => {
      const statusDiff = (leadStatusRank[a.status] ?? 3) - (leadStatusRank[b.status] ?? 3);
      if (statusDiff !== 0) return statusDiff;
      return (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0);
    });
}, [board, employees, leads, orderBoard, orders]);
  const boardColumns: Column<Lead>[] = board === "orders" ? [{ key: "phone", header: "Order ID" }, { key: "name", header: "Customer" }, { key: "company", header: "Company" }, { key: "material", header: "Items" }, { key: "feedback", header: "Status", value: (r) => r.feedback, sortValue: (r) => ({ Confirmed: 1, Pending: 2, Cancel: 3 }[r.feedback] ?? 99), render: (r) => {
      const order = orders.find((item) => item.id === r.id);
      if (!order) return <StatusChip value={r.feedback} />;
      return (
        <Select
          value={displayOrderStatus(order.status)}
          onValueChange={(status) => orderStatusMutation.mutate({ id: order.id, status: status as OrderStatus })}
          disabled={orderStatusMutation.isPending}
        >
          <SelectTrigger
            className="h-auto w-fit min-w-0 gap-1 rounded-full border-0 bg-transparent p-0 shadow-none focus:ring-0"
            onClick={(event) => event.stopPropagation()}
          >
            <StatusChip value={r.feedback} className={orderStatusMutation.isPending ? "opacity-60" : ""} />
          </SelectTrigger>
          <SelectContent>
            {ORDER_STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
          </SelectContent>
        </Select>
      );
    } }, { key: "duration", header: "Delivery" }, { key: "employeeId", header: "Assigned Employee", value: (r) => employeeName(r.employeeId), render: (r) => employeeName(r.employeeId) }, { key: "createdAt", header: "Created" }, { key: "actions", header: "", render: (r) => { const order = orders.find((o) => o.id === r.id); if (!order || !canDeleteRecord(user, order)) return null; return <Button variant="ghost" size="icon" className="text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteTargetId(order.id); setConfirmDelete(true); }}><Trash2 className="size-4" /></Button>; } }] : [{ key: "name", header: "Name" }, { key: "phone", header: "Contact" }, { key: "company", header: "Company" }, { key: "material", header: "Material Required" }, { key: "quantity", header: "Quantity" }, { key: "units", header: "Units" }, { key: "duration", header: "Duration" }, { key: "status", header: "Status", render: (r) => <StatusChip value={r.status} /> }, { key: "employeeId", header: "Assigned Employee", value: (r) => employeeName(r.employeeId), render: (r) => employeeName(r.employeeId) }, { key: "feedback", header: "Feedback", className: "max-w-[240px] truncate" }, { key: "followup", header: "Follow-up", render: (r) => <span className="text-xs text-muted-foreground">{followUps.find((f) => f.relatedId === r.id)?.date ?? "Not scheduled"}</span> }];
  const upcoming = followUps.filter((f) => f.status !== "Completed" && (f.date >= TODAY || f.status === "Missed")).slice(0, 6); const missed = followUps.filter((f) => f.status === "Pending").slice(0, 6); const dataError = summaryQuery.error ?? followUpsQuery.error ?? leadsQuery.error ?? customersQuery.error ?? ordersQuery.error ?? employeesQuery.error; const loading = summaryQuery.isPending || followUpsQuery.isPending || leadsQuery.isPending || customersQuery.isPending || ordersQuery.isPending || employeesQuery.isPending;
  if (!user) return null; if (loading) return <AppShell><div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">Loading dashboard...</div></AppShell>; if (dataError || !summary) return <AppShell><div className="glass rounded-2xl p-8 text-center"><p className="font-medium">Unable to load dashboard</p><p className="mt-1 text-sm text-muted-foreground">{dataError instanceof Error ? dataError.message : "Please try again."}</p></div></AppShell>;
  return <AppShell><div className="min-w-0 max-w-full space-y-5"><PageHeader title={`Good day, ${user.name.split(" ")[0]}`} subtitle={`${user.role} workspace · business overview for ${TODAY}`} /><section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Today's Meetings" value={summary.followUps.today ?? 0} icon={CalendarClock} tone="coral" delay={0} /><StatCard label="Orders" value={summary.orders.total} icon={Package} tone="teal" delay={60} /><StatCard label="Customers" value={summary.customers.total} icon={UserRound} tone="sky" delay={120} /><StatCard label="Total Leads" value={summary.leads.total} icon={Users} tone="teal" delay={180} /></section><section className="min-w-0 max-w-full space-y-3 overflow-hidden"><DataTable rows={boardRows} columns={boardColumns} rowKey={(r) => r.id} searchPlaceholder={board === "orders" ? "Search orders by order ID, customer, material…" : "Search this board…"} filters={board === "orders" ? [{ label: "Status", options: ["Pending", "Confirmed", "Cancel"], value: orderStatusFilter, onChange: setOrderStatusFilter }] : []} sortMenuExtra={<DashboardWorkflowOptions activeBoard={board} onSelect={(b) => { setBoard(b); if (b !== "orders") setOrderStatusFilter("All"); }} />} onRowClick={(r) => board === "employees" ? navigate({ to: "/employees/$id", params: { id: r.id } }) : board === "orders" ? navigate({ to: "/orders/$id", params: { id: r.id } }) : navigate({ to: "/leads/$id", params: { id: r.id } })} /></section><section className="grid gap-3 xl:grid-cols-2"><div className="md:hidden xl:col-span-2"><div className="mb-1 flex items-center gap-1 rounded-full bg-white/55 p-1 glass-soft"><button onClick={() => setMobileTab("Upcoming")} className={cn("flex-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors", mobileTab === "Upcoming" ? "bg-mint/40 text-teal" : "text-muted-foreground hover:text-foreground")}>Upcoming</button><button onClick={() => setMobileTab("Pending")} className={cn("flex-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors", mobileTab === "Pending" ? "bg-mint/40 text-teal" : "text-muted-foreground hover:text-foreground")}>Pending</button></div></div><div className={cn("glass rounded-2xl p-4", mobileTab === "Upcoming" ? "block" : "hidden md:block")}><div className="mb-3 flex items-center justify-between"><p className="text-sm font-semibold">Upcoming meetings & follow-ups</p><button onClick={() => navigate({ to: "/calendar" })} className="text-xs font-medium text-primary hover:underline">Open calendar →</button></div><div className="space-y-2">{upcoming.map((f) => <div key={f.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/55 px-3 py-2"><div className="min-w-0"><p className="truncate text-sm font-medium">{f.title}</p><p className="truncate text-xs text-muted-foreground">{relatedName(f.relatedType, f.relatedId)} · {f.date} · {f.time}</p></div><StatusChip value={f.status} /></div>)}{upcoming.length === 0 && <p className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">No upcoming follow-ups.</p>}</div></div><div className={cn("glass rounded-2xl border border-coral/40 bg-coral/5 p-4", mobileTab === "Pending" ? "block" : "hidden md:block")}><div className="mb-3 flex items-center justify-between"><p className="flex items-center gap-2 text-sm font-semibold text-coral"><AlertTriangle className="size-4" /> Pending follow-ups</p><button onClick={() => navigate({ to: "/follow-ups" })} className="text-xs font-medium text-coral hover:underline">View all →</button></div><div className="space-y-2">{missed.map((f) => <div key={f.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-3 py-2"><div className="min-w-0"><p className="truncate text-sm font-medium">{f.title}</p><p className="truncate text-xs text-muted-foreground">{f.date} · {relatedName(f.relatedType, f.relatedId)}</p></div><StatusChip value={f.priority} /></div>)}{missed.length === 0 && <p className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">No pending follow-ups.</p>}</div></div></section><p className="pb-2 text-center text-xs text-muted-foreground">{summary.customers.total} customers · {summary.orders.total} orders · {summary.followUps.total} follow-ups tracked</p></div><ConfirmDialog open={confirmDelete} onOpenChange={setConfirmDelete} title="Delete this order?" description="The order will be permanently removed from the register." confirmLabel={deleteMutation.isPending ? "Deleting..." : "Delete order"} destructive onConfirm={() => { if (deleteTargetId) deleteMutation.mutate(deleteTargetId); }} /></AppShell>;
}
