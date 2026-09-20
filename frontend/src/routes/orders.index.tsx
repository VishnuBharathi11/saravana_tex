import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/common/glass";
import { StatusChip } from "@/components/common/status-chip";
import { DataTable, type Column } from "@/components/common/data-table";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { getOrders, deleteOrder, updateOrder } from "@/api/orders";
import { getEmployees } from "@/api/employees";
import { toast } from "sonner";
import type { Order, OrderStatus } from "@/types";

export const Route = createFileRoute("/orders/")({
  head: () => ({ meta: [{ title: "Orders · Saravana Traders CRM" }] }),
  component: OrdersPage,
});

const inr = (v: number) => `₹${v.toLocaleString("en-IN")}`;
const ORDER_STATUSES: OrderStatus[] = ["Confirmed", "Pending", "Cancel"];
const ORDER_STATUS_RANK: Record<string, number> = {
  Confirmed: 1,
  Pending: 2,
  Cancel: 3,
  Cancelled: 3,
  Draft: 2,
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

function OrdersPage() {
  const user = useRequireAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [emp, setEmp] = useState("All");
  const [status, setStatus] = useState("All");
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["orders"] });
      setConfirmDelete(false);
      setDeleteTargetId(null);
      toast.success("Order deleted");
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

  const columns: Column<Order>[] = [
    { key: "id", header: "Order ID", render: (o) => <span className="font-medium">{o.id}</span> },
    { key: "customerName", header: "Customer" },
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
    {
      key: "employeeId",
      header: "Assigned Employee",
      value: (o) => nameOf(o.employeeId),
      render: (o) => nameOf(o.employeeId),
    },
    { key: "createdAt", header: "Created", sortValue: (o) => Date.parse(o.createdAt) || 0 },
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
