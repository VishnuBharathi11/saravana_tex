import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, CalendarDays, ChevronDown, MoreHorizontal, Package, Plus, Search, UserRound, Layers3, Coins, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/common/glass";
import { StatusChip } from "@/components/common/status-chip";
import { DataTable, type Column } from "@/components/common/data-table";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { getOrders, deleteOrder, updateOrder } from "@/api/orders";
import { getEmployees } from "@/api/employees";
import { toast } from "sonner";
import type { Order, OrderStatus } from "@/types";
import { formatDate } from "@/lib/date-time";

export const Route = createFileRoute("/orders/")({
  head: () => ({ meta: [{ title: "Orders · Saravana Traders CRM" }] }),
  component: OrdersPage,
});

const inr = (v: number) => `₹${v.toLocaleString("en-IN")}`;
const ORDER_STATUSES: OrderStatus[] = ["Pending", "Confirmed", "Cancel"];
const ORDER_STATUS_RANK: Record<string, number> = {
  Pending: 1,
  Confirmed: 2,
  Cancel: 3,
  Cancelled: 3,
  Draft: 1,
};

const displayOrderStatus = (status: string) =>
  status === "Cancelled" ? "Cancel" : status === "Draft" ? "Pending" : status;

function OrderStatusSelect({ order }: { order: Order }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (status: OrderStatus) => updateOrder(order.id, { status }),
    onSuccess: async (updated) => {
      queryClient.setQueryData<Order[]>(["orders"], (current) =>
        current?.map((item) => (item.id === updated.id ? updated : item)) ?? current,
      );
      queryClient.setQueryData(["orders", updated.id], updated);
      await queryClient.invalidateQueries({ queryKey: ["orders"] });
      await queryClient.invalidateQueries({ queryKey: ["follow-ups"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard", "follow-ups"] });
      toast.success(`Order ${order.id} status changed to ${displayOrderStatus(updated.status)}`);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to update order status");
    },
  });

  const value = displayOrderStatus(order.status);

  return (
    <Select
      value={value}
      onValueChange={(next) => mutation.mutate(next as OrderStatus)}
      disabled={mutation.isPending}
    >
      <SelectTrigger
        className="h-auto w-fit min-w-0 gap-1 rounded-full border-0 bg-transparent p-0 shadow-none focus:ring-0"
        onClick={(event) => event.stopPropagation()}
      >
        <StatusChip value={value} className={mutation.isPending ? "opacity-60" : ""} />
      </SelectTrigger>
      <SelectContent>
        {ORDER_STATUSES.map((status) => (
          <SelectItem key={status} value={status}>
            {status}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function OrderMobileCard({
  order,
  onOpen,
  onDelete,
}: {
  order: Order;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const itemText = order.items?.map((item) => item.material).join(", ") || order.material;
  return (
    <article
      className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm transition-colors hover:bg-white"
      onClick={onOpen}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-8 w-1 rounded-full bg-primary" />
          <p className="truncate text-lg font-bold">{order.id}</p>
        </div>
        <div className="flex items-center gap-1">
          <OrderStatusSelect order={order} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 rounded-full"
                onClick={(event) => event.stopPropagation()}
                aria-label={`Actions for ${order.id}`}
              >
                <MoreHorizontal className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup value="">
                <DropdownMenuRadioItem
                  value="delete"
                  className="text-destructive focus:text-destructive"
                  onSelect={(event) => {
                    event.preventDefault();
                    onDelete();
                  }}
                >
                  Delete order
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        <div className="grid grid-cols-[24px_92px_12px_minmax(0,1fr)] items-center gap-1 text-sm">
          <UserRound className="size-4 text-muted-foreground" />
          <span className="text-muted-foreground">Customer</span>
          <span className="text-muted-foreground">:</span>
          <span className="truncate font-semibold">{order.customerName || "—"}</span>
        </div>
        <div className="grid grid-cols-[24px_92px_12px_minmax(0,1fr)] items-center gap-1 text-sm">
          <Building2 className="size-4 text-muted-foreground" />
          <span className="text-muted-foreground">Company</span>
          <span className="text-muted-foreground">:</span>
          <span className="truncate font-semibold">{order.company || "—"}</span>
        </div>
        <div className="grid grid-cols-[24px_92px_12px_minmax(0,1fr)] items-center gap-1 text-sm">
          <Package className="size-4 text-muted-foreground" />
          <span className="text-muted-foreground">Item</span>
          <span className="text-muted-foreground">:</span>
          <span className="truncate font-semibold">{itemText || "—"}</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 divide-x divide-border/70 border-t border-border/70 pt-3">
        <div className="px-2 first:pl-0">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Layers3 className="size-4" />
            <span>Lines</span>
          </div>
          <p className="mt-1 text-sm font-semibold">{order.items?.length || 1} {(order.items?.length || 1) === 1 ? "line" : "lines"}</p>
        </div>
        <div className="px-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Coins className="size-4" />
            <span>Value</span>
          </div>
          <p className="mt-1 text-sm font-semibold">{inr(order.value)}</p>
        </div>
        <div className="px-2 pr-0">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="size-4" />
            <span>Delivery</span>
          </div>
          <p className="mt-1 truncate text-sm font-semibold">{formatDate(order.deliveryDate)}</p>
        </div>
      </div>
    </article>
  );
}

function OrdersPage() {
  const user = useRequireAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [emp, setEmp] = useState("All");
  const [status, setStatus] = useState("All");
  const [mobileQuery, setMobileQuery] = useState("");
  const [mobileSort, setMobileSort] = useState<"default" | "newest" | "oldest">("default");
  const [mobilePage, setMobilePage] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const ordersQuery = useQuery({
    queryKey: ["orders"],
    queryFn: getOrders,
    enabled: Boolean(user),
  });
  const employeesQuery = useQuery({
    queryKey: ["employees"],
    queryFn: getEmployees,
    enabled: Boolean(user),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteOrder(id),
    onSuccess: () => {
      if (deleteTargetId) {
        queryClient.setQueryData<Order[]>(["orders"], (current) =>
          current?.filter((order) => order.id !== deleteTargetId) ?? current,
        );
      }
      setConfirmDelete(false);
      setDeleteTargetId(null);
      toast.success("Order deleted");
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (e) => {
      setConfirmDelete(false);
      toast.error(e instanceof Error ? e.message : "Unable to delete order");
    },
  });

  if (!user) return null;

  const orders = ordersQuery.data ?? [];
  const employees = employeesQuery.data ?? [];
  const nameOf = (id: string) => employees.find((e) => e.id === id)?.name ?? "Unassigned";
  const rows = orders.filter(
    (o) =>
      (emp === "All" || nameOf(o.employeeId) === emp) &&
      (status === "All" || displayOrderStatus(o.status) === status),
  );
  const orderedRows = rows.slice().sort((a, b) => {
    const statusDiff =
      (ORDER_STATUS_RANK[displayOrderStatus(a.status)] ?? 99) -
      (ORDER_STATUS_RANK[displayOrderStatus(b.status)] ?? 99);
    if (statusDiff !== 0) return statusDiff;
    return (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0);
  });

  const mobileFilteredRows = orderedRows.filter((order) => {
    if (!mobileQuery.trim()) return true;
    const query = mobileQuery.trim().toLowerCase();
    const itemText = order.items?.map((item) => item.material).join(", ") || order.material;
    return `${order.id} ${order.customerName} ${order.company} ${itemText}`.toLowerCase().includes(query);
  });

  const mobileRows = mobileFilteredRows.slice().sort((a, b) => {
    if (mobileSort === "newest") {
      return (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0);
    }
    if (mobileSort === "oldest") {
      return (Date.parse(a.createdAt) || 0) - (Date.parse(b.createdAt) || 0);
    }
    return 0;
  });
  const mobilePageSize = 6;
  const mobilePages = Math.max(1, Math.ceil(mobileRows.length / mobilePageSize));
  const mobileCurrentPage = Math.min(mobilePage, mobilePages - 1);
  const mobileVisibleRows = mobileRows.slice(
    mobileCurrentPage * mobilePageSize,
    mobileCurrentPage * mobilePageSize + mobilePageSize,
  );

  const columns: Column<Order>[] = [
    { key: "id", header: "Order ID", render: (o) => <span className="font-medium">{o.id}</span> },
    { key: "customerName", header: "Customer" },
    { key: "company", header: "Company" },
    {
      key: "items",
      header: "Items",
      render: (o) => o.items?.map((i) => i.material).join(", ") || o.material,
    },
    { key: "quantity", header: "Lines", render: (o) => String(o.items?.length || 1) },
    { key: "value", header: "Value", render: (o) => inr(o.value) },
    {
      key: "status",
      header: "Status",
      value: (o) => displayOrderStatus(o.status),
      render: (o) => <OrderStatusSelect order={o} />,
    },
    { key: "deliveryDate", header: "Delivery" },
    {
      key: "actions",
      header: "",
      render: (o) => (
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            setDeleteTargetId(o.id);
            setConfirmDelete(true);
          }}
        >
          <Trash2 className="size-4" />
        </Button>
      ),
    },
  ];

  const error = ordersQuery.error ?? employeesQuery.error;

  return (
    <AppShell>
      <div className="space-y-4">
        <PageHeader
          title="Orders"
          subtitle={
            user.role === "Admin"
              ? `${orderedRows.length} orders · ${inr(orderedRows.reduce((a, o) => a + o.value, 0))} pipeline value`
              : `${orderedRows.length} orders in CRM (Edit assigned only)`
          }
          actions={
            <Button className="gap-2 rounded-xl" onClick={() => navigate({ to: "/orders/new" })}>
              <Plus className="size-4" /> Add Order
            </Button>
          }
        />
        {ordersQuery.isPending || employeesQuery.isPending ? (
          <div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">
            Loading orders...
          </div>
        ) : error ? (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="font-medium">Unable to load orders</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "Please try again."}
            </p>
          </div>
        ) : orderedRows.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">
            {orders.length === 0 ? "No orders found." : "No orders match the current filters."}
          </div>
        ) : (
          <>
          <div className="md:hidden space-y-3">
            <div className="glass rounded-2xl p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={mobileQuery}
                  onChange={(event) => {
                    setMobileQuery(event.target.value);
                    setMobilePage(0);
                  }}
                  placeholder="Search orders, customers..."
                  className="h-11 rounded-xl border-0 bg-white/85 pl-10"
                />
              </div>
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="glass-soft shrink-0 rounded-full border-0">
                      Employee
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="max-h-72 overflow-auto">
                    <DropdownMenuRadioGroup value={emp} onValueChange={(value) => { setEmp(value); setMobilePage(0); }}>
                      {["All", ...employees.map((e) => e.name)].map((option) => (
                        <DropdownMenuRadioItem key={option} value={option}>{option === "All" ? "All employees" : option}</DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="glass-soft shrink-0 rounded-full border-0">
                      Status
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuRadioGroup value={status} onValueChange={(value) => { setStatus(value); setMobilePage(0); }}>
                      {["All", ...ORDER_STATUSES].map((option) => (
                        <DropdownMenuRadioItem key={option} value={option}>{option === "All" ? "All statuses" : option}</DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="glass-soft shrink-0 rounded-full border-0">
                      Sort <ChevronDown className="size-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuRadioGroup value={mobileSort} onValueChange={(value) => { setMobileSort(value as typeof mobileSort); setMobilePage(0); }}>
                      <DropdownMenuRadioItem value="default">Status order</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="newest">Newest first</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="oldest">Oldest first</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {mobileVisibleRows.map((order) => (
              <OrderMobileCard
                key={order.id}
                order={order}
                onOpen={() => navigate({ to: "/orders/$id", params: { id: order.id } })}
                onDelete={() => {
                  setDeleteTargetId(order.id);
                  setConfirmDelete(true);
                }}
              />
            ))}

            {mobileVisibleRows.length === 0 && (
              <div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">
                {orders.length === 0 ? "No orders found." : "No orders match the current filters."}
              </div>
            )}

            <div className="flex items-center justify-between gap-2 px-1 text-xs text-muted-foreground">
              <span>{mobileRows.length} records · page {mobileCurrentPage + 1} of {mobilePages}</span>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="size-8" disabled={mobileCurrentPage === 0} onClick={() => setMobilePage(mobileCurrentPage - 1)}>
                  <span className="text-lg">‹</span>
                </Button>
                <Button variant="ghost" size="icon" className="size-8" disabled={mobileCurrentPage >= mobilePages - 1} onClick={() => setMobilePage(mobileCurrentPage + 1)}>
                  <span className="text-lg">›</span>
                </Button>
              </div>
            </div>
          </div>

          <div className="hidden md:block">
            <DataTable
              rows={orderedRows}
              columns={columns}
              rowKey={(o) => o.id}
              searchPlaceholder="Search orders by order ID, customer, item…"
              onRowClick={(o) => navigate({ to: "/orders/$id", params: { id: o.id } })}
              filters={[
                { label: "Employee", options: employees.map((e) => e.name), value: emp, onChange: setEmp },
                { label: "Status", options: ORDER_STATUSES, value: status, onChange: setStatus },
              ]}
            />
          </div>
          </>
        )}
      </div>
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this order?"
        description="The order will be permanently removed from the register."
        confirmLabel={deleteMutation.isPending ? "Deleting..." : "Delete order"}
        destructive
        onConfirm={() => {
          if (deleteTargetId) deleteMutation.mutate(deleteTargetId);
        }}
      />
    </AppShell>
  );
}
