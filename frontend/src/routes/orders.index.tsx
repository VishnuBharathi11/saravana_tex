import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/common/glass";
import { StatusChip } from "@/components/common/status-chip";
import { DataTable, type Column } from "@/components/common/data-table";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { inr } from "@/data/mock";
import { crm, nameOf, useCrm } from "@/lib/store";
import { toast } from "sonner";
import type { Order, OrderStatus, PaymentStatus } from "@/types";

export const Route = createFileRoute("/orders/")({
  head: () => ({
    meta: [
      { title: "Orders · Saravana Traders CRM" },
      {
        name: "description",
        content: "Manage confirmed orders, invoices, payment status and dispatch timelines.",
      },
      { property: "og:title", content: "Orders · Saravana Traders CRM" },
      {
        property: "og:description",
        content: "Order register with payments, dispatch and invoices.",
      },
    ],
  }),
  component: OrdersPage,
});

const PAYMENT_STATUSES: PaymentStatus[] = ["Pending", "Partial", "Paid"];

const ORDER_STATUSES: OrderStatus[] = [
  "Draft",
  "Confirmed",
  "Processing",
  "Packed",
  "Dispatched",
  "Delivered",
  "Cancelled",
];

function OrdersPage() {
  const user = useRequireAuth();
  const navigate = useNavigate();
  const { orders, employees } = useCrm();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [payment, setPayment] = useState("All");
  const [status, setStatus] = useState("All");
  const [emp, setEmp] = useState("All");

  if (!user) return null;
  const isAdmin = user.role === "Admin";
  const deleteTarget = orders.find((o) => o.id === deleteTargetId) ?? null;

  const rows = orders
    .filter((o) => (isAdmin ? true : o.employeeId === user.id))
    .filter(
      (o) =>
        (payment === "All" || o.paymentStatus === payment) &&
        (status === "All" || o.status === status) &&
        (emp === "All" || nameOf(employees, o.employeeId) === emp),
    );

  const columns: Column<Order>[] = [
    {
      key: "customerName",
      header: "Customer",
      render: (o) => <span className="font-medium">{o.customerName}</span>,
    },
    { key: "material", header: "Material" },
    { key: "quantity", header: "Quantity" },
    { key: "units", header: "Units" },
    { key: "value", header: "Value", render: (o) => inr(o.value) },
    {
      key: "paymentStatus",
      header: "Payment",
      render: (o) => <StatusChip value={o.paymentStatus} />,
    },
    { key: "status", header: "Order Status", render: (o) => <StatusChip value={o.status} /> },
    {
      key: "employeeId",
      header: "Assigned Employee",
      value: (o) => nameOf(employees, o.employeeId),
      render: (o) => nameOf(employees, o.employeeId),
    },
    { key: "createdAt", header: "Created" },
  ];

  return (
    <AppShell>
      <div className="space-y-4">
        <PageHeader
          title="Orders"
          subtitle={`${rows.length} orders · ${inr(rows.reduce((a, o) => a + o.value, 0))} pipeline value`}
          actions={
            <Button className="gap-2 rounded-xl" onClick={() => navigate({ to: "/orders/new" })}>
              <Plus className="size-4" /> Add Order
            </Button>
          }
        />

        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(o) => o.id}
          searchPlaceholder="Search orders by customer, invoice, material…"
          onRowClick={(o) => navigate({ to: "/orders/$id", params: { id: o.id } })}
          filters={[
            {
              label: "Payment",
              options: PAYMENT_STATUSES,
              value: payment,
              onChange: setPayment,
            },
            { label: "Status", options: ORDER_STATUSES, value: status, onChange: setStatus },
            {
              label: "Employee",
              options: employees.map((e) => e.name),
              value: emp,
              onChange: setEmp,
            },
          ]}
        />
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this order?"
        description="The order will be permanently removed from the register."
        confirmLabel="Delete order"
        destructive
        onConfirm={() => {
          if (deleteTarget) crm.deleteOrder(deleteTarget.id);
          setConfirmDelete(false);
          setDeleteTargetId(null);
          toast.success("Order deleted");
        }}
      />
    </AppShell>
  );
}
