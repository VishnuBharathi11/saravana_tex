import { useState } from "react";
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, PencilLine, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { GlassCard, PageHeader } from "@/components/common/glass";
import { StatusChip } from "@/components/common/status-chip";
import { FollowUpTimeline } from "@/components/common/followup-timeline";
import { formatDate } from "@/lib/date-utils";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { crm, nameOf, useCrm } from "@/lib/store";
import { inr } from "@/data/mock";
import { toast } from "sonner";
import { canEditRecord, canDeleteRecord } from "@/lib/permissions";

export const Route = createFileRoute("/orders/$id")({
  head: () => ({
    meta: [
      { title: "Order detail · Saravana Traders CRM" },
      { name: "description", content: "View order details, status and payment information." },
      { property: "og:title", content: "Order detail · Saravana Traders CRM" },
    ],
  }),
  component: OrderDetailPage,
});

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-white/55 px-3 py-2.5">
      <p className="text-[11px] tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-0.5 break-words text-sm font-medium">{value === "" ? "—" : value}</p>
    </div>
  );
}

function OrderDetailPage() {
  const user = useRequireAuth();
  const navigate = useNavigate();
  const { id } = useParams({ from: "/orders/$id" });
  const { orders, employees } = useCrm();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!user) return null;

  const order = orders.find((o) => o.id === id);

  if (!order) {
    return (
      <AppShell>
        <GlassCard className="p-10 text-center">
          <p className="font-semibold">Order not found</p>
          <Link to="/orders" className="mt-3 inline-block text-sm text-primary underline">
            Back to orders
          </Link>
        </GlassCard>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm" className="gap-2">
          <Link to="/orders">
            <ArrowLeft className="size-4" /> Orders
          </Link>
        </Button>

        <PageHeader
          title={order.invoiceNumber}
          subtitle={`${order.customerName} · ${order.company}`}
          actions={
            canEditRecord(user, order) ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="glass-soft gap-1.5 rounded-xl border-0"
                  onClick={() => navigate({ to: "/orders/$id/edit", params: { id: order.id } })}
                >
                  <PencilLine className="size-3.5" /> Edit
                </Button>
                {canDeleteRecord(user, order) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5 rounded-xl text-destructive"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 className="size-3.5" /> Delete
                  </Button>
                )}
              </>
            ) : null
          }
        />

        <GlassCard className="p-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label="Customer" value={order.customerName} />
            <Field label="Company" value={order.company} />
            <Field label="Material" value={`${order.material} · ${order.materialType}`} />
            <Field label="Quantity" value={`${order.quantity} ${order.units}`} />
            <Field label="Unit price" value={inr(order.price)} />
            <Field label="Total value" value={inr(order.value)} />
            <Field label="Delivery date" value={formatDate(order.deliveryDate)} />
            <Field label="Created" value={formatDate(order.createdAt)} />

            <div className="rounded-xl bg-white/55 px-3 py-2.5">
              <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
                Order status
              </p>
              <StatusChip value={order.status} className="mt-1" />
            </div>

            <div className="rounded-xl bg-white/55 px-3 py-2.5">
              <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
                Payment status
              </p>
              <StatusChip value={order.paymentStatus} className="mt-1" />
            </div>

            {nameOf(employees, order.employeeId) !== "—" && (
              <div className="rounded-xl bg-white/55 px-3 py-2.5">
                <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
                  Assigned employee
                </p>
                <Link
                  to="/employees/$id"
                  params={{ id: order.employeeId }}
                  className="mt-0.5 block text-sm font-medium text-primary hover:underline"
                >
                  {nameOf(employees, order.employeeId)}
                </Link>
              </div>
            )}

            <div className="sm:col-span-2">
              <Field label="Delivery address" value={order.address} />
            </div>
            {order.notes && (
              <div className="sm:col-span-2">
                <Field label="Notes" value={order.notes} />
              </div>
            )}

            <div className="sm:col-span-2">
              <Button
                variant="ghost"
                className="rounded-xl px-0"
                onClick={() => navigate({ to: "/customers/$id", params: { id: order.customerId } })}
              >
                Open customer account →
              </Button>
            </div>
          </div>
        </GlassCard>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this order?"
        description="The order will be permanently removed from the register."
        confirmLabel="Delete order"
        destructive
        onConfirm={() => {
          crm.deleteOrder(order.id);
          setConfirmDelete(false);
          toast.success("Order deleted");
          navigate({ to: "/orders" });
        }}
      />
    </AppShell>
  );
}
