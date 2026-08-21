import { useState } from "react";
import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import { ArrowLeft, PencilLine, Plus, Save, Trash2, X } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { IdentityHeader } from "@/components/common/identity-header";
import { CopyField } from "@/components/common/copy-field";
import { EmployeeLink } from "@/components/common/employee-link";
import { FollowUpTimeline } from "@/components/common/followup-timeline";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { StatusChip } from "@/components/common/status-chip";
import { DataTable } from "@/components/common/data-table";
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
import { inr } from "@/data/mock";
import { crm, useCrm } from "@/lib/store";
import { formatDate } from "@/lib/date-utils";
import { toast } from "sonner";
import type { Customer, Order } from "@/types";
import { canEditRecord, canDeleteRecord } from "@/lib/permissions";

export const Route = createFileRoute("/customers/$id")({
  head: () => ({
    meta: [
      { title: "Customer account · Saravana Traders CRM" },
      {
        name: "description",
        content: "Customer profile, orders, payments and follow-up timeline.",
      },
      { property: "og:title", content: "Customer account · Saravana Traders CRM" },
      { property: "og:description", content: "Account overview with order history and payments." },
    ],
  }),
  component: CustomerDetail,
});

const STATUSES: Customer["status"][] = ["Active", "Dormant", "VIP"];
const UNITS = ["Tons", "Nos", "Bags", "Sheets", "Rolls", "Boxes"];

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-white/55 px-3 py-2.5">
      <p className="text-[11px] tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-0.5 text-sm font-medium break-words">{value === "" ? "—" : value}</p>
    </div>
  );
}

function CustomerDetail() {
  const user = useRequireAuth();
  const { id } = useParams({ from: "/customers/$id" });
  const navigate = useNavigate();
  const { customers, orders, followUps, employees } = useCrm();
  const customer = customers.find((c) => c.id === id);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Customer | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!user) return null;

  if (!customer) {
    return (
      <AppShell>
        <div className="glass rounded-2xl p-8 text-center">
          <p className="text-sm text-muted-foreground">This customer no longer exists.</p>
          <Link to="/customers" className="mt-3 inline-block text-sm font-medium text-primary">
            Back to customers
          </Link>
        </div>
      </AppShell>
    );
  }

  const custOrders = orders.filter((o) => o.customerId === customer.id);
  const timeline = followUps.filter((f) => f.relatedId === customer.id);
  const paid = custOrders
    .filter((o) => o.paymentStatus === "Paid")
    .reduce((a, o) => a + o.value, 0);
  const due = custOrders.filter((o) => o.paymentStatus !== "Paid").reduce((a, o) => a + o.value, 0);

  const d = draft ?? customer;
  const upd = (patch: Partial<Customer>) => setDraft({ ...d, ...patch });

  const save = () => {
    if (!d.name.trim() || !d.company.trim()) {
      toast.error("Name and company are required");
      return;
    }
    crm.updateCustomer(customer.id, d);
    setEditing(false);
    setDraft(null);
    toast.success("Customer updated");
  };

  return (
    <AppShell>
      <div className="space-y-4">
        <Button
          variant="ghost"
          className="gap-2 pl-0"
          onClick={() => navigate({ to: "/customers" })}
        >
          <ArrowLeft className="size-4" /> Back
        </Button>

        <IdentityHeader
          name={customer.name}
          company={customer.company}
          phone={customer.phone}
          email={customer.email}
          meta={`Customer since ${formatDate(customer.createdAt)} · ${customer.source}`}
          actions={
            editing ? (
              <>
                <Button className="gap-2 rounded-xl" onClick={save}>
                  <Save className="size-4" /> Save
                </Button>
                <Button
                  variant="ghost"
                  className="gap-2 rounded-xl"
                  onClick={() => {
                    setEditing(false);
                    setDraft(null);
                  }}
                >
                  <X className="size-4" /> Cancel
                </Button>
              </>
            ) : canEditRecord(user, customer) ? (
              <>
                <Button
                  variant="outline"
                  className="glass-soft gap-2 rounded-xl border-0"
                  onClick={() => {
                    setDraft(customer);
                    setEditing(true);
                  }}
                >
                  <PencilLine className="size-4" /> Edit
                </Button>
                <Button
                  className="gap-2 rounded-xl"
                  onClick={() => navigate({ to: "/orders/new" })}
                >
                  <Plus className="size-4" /> Create Order
                </Button>
                {canDeleteRecord(user, customer) && (
                  <Button
                    variant="ghost"
                    className="gap-2 rounded-xl text-destructive"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </>
            ) : (
              <Button
                className="gap-2 rounded-xl"
                onClick={() => navigate({ to: "/orders/new" })}
              >
                <Plus className="size-4" /> Create Order
              </Button>
            )
          }
        />

        <div className="grid gap-3 lg:grid-cols-3">
          <div className="glass rounded-2xl p-4 lg:col-span-2">
            <p className="text-sm font-semibold">Basic information</p>

            {editing ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ["name", "Name"],
                    ["company", "Company"],
                    ["phone", "Phone"],
                    ["email", "Email"],
                    ["material", "Preferred material"],
                    ["source", "Source"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key} className="space-y-1.5">
                    <Label htmlFor={key}>{label}</Label>
                    <Input
                      id={key}
                      value={d[key]}
                      onChange={(e) => upd({ [key]: e.target.value } as Partial<Customer>)}
                      className="h-10 border-0 bg-white/70"
                    />
                  </div>
                ))}

                <div className="space-y-1.5">
                  <Label htmlFor="quantity">Typical quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min={0}
                    value={d.quantity}
                    onChange={(e) => upd({ quantity: Number(e.target.value) })}
                    className="h-10 border-0 bg-white/70"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Units</Label>
                  <Select value={d.units} onValueChange={(v) => upd({ units: v })}>
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
                  <Label>Status</Label>
                  <Select
                    value={d.status}
                    onValueChange={(v) => upd({ status: v as Customer["status"] })}
                  >
                    <SelectTrigger className="h-10 w-full border-0 bg-white/70">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Assigned employee</Label>
                  <Select value={d.employeeId} onValueChange={(v) => upd({ employeeId: v })}>
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
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={d.address}
                    onChange={(e) => upd({ address: e.target.value })}
                    className="h-10 border-0 bg-white/70"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="feedback">Feedback</Label>
                  <Textarea
                    id="feedback"
                    rows={3}
                    value={d.feedback}
                    onChange={(e) => upd({ feedback: e.target.value })}
                    className="border-0 bg-white/70"
                  />
                </div>
              </div>
            ) : (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <CopyField kind="phone" label="Phone" value={customer.phone} />
                <CopyField kind="email" label="Email" value={customer.email} />
                <Field label="Company" value={customer.company} />
                <Field label="Source" value={customer.source} />
                <Field label="Preferred material" value={customer.material} />
                <Field label="Typical quantity" value={`${customer.quantity} ${customer.units}`} />
                <EmployeeLink employeeId={customer.employeeId} />
                <Field label="Duration" value={customer.duration} />
                <div className="sm:col-span-2">
                  <Field label="Address" value={customer.address} />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="glass rounded-2xl p-4">
              <p className="text-sm font-semibold">Payment summary</p>
              <div className="mt-3 space-y-2">
                <Field label="Lifetime value" value={inr(customer.totalValue)} />
                <Field label="Collected" value={inr(paid)} />
                <Field label="Outstanding" value={inr(due)} />
                <Field label="Orders placed" value={custOrders.length} />
              </div>
            </div>

            <div className="glass rounded-2xl p-4">
              <p className="text-sm font-semibold">Feedback</p>
              <p className="mt-2 rounded-xl bg-white/55 px-3 py-2.5 text-sm">
                {customer.feedback || "No feedback captured yet."}
              </p>
            </div>

            <div className="glass rounded-2xl p-4">
              <p className="text-sm font-semibold">Notes</p>
              {editing ? (
                <Textarea
                  className="mt-2 border-0 bg-white/70"
                  rows={4}
                  value={d.notes}
                  onChange={(e) => upd({ notes: e.target.value })}
                  placeholder="Enter notes..."
                />
              ) : (
                <p className="mt-2 rounded-xl bg-white/55 px-3 py-2.5 text-sm whitespace-pre-wrap">
                  {customer.notes || "No notes added."}
                </p>
              )}
            </div>
          </div>
        </div>

        <FollowUpTimeline
          items={timeline}
          target={{ id: customer.id, name: customer.name, type: "Customer" }}
          title="Follow-up timeline"
        />

        <div>
          <p className="mb-2 text-sm font-semibold">Order history</p>
          <DataTable<Order>
            rows={custOrders}
            columns={[
              { key: "invoiceNumber", header: "Invoice" },
              { key: "material", header: "Material" },
              { key: "quantity", header: "Qty", render: (o) => `${o.quantity} ${o.units}` },
              { key: "value", header: "Value", render: (o) => inr(o.value) },
              {
                key: "paymentStatus",
                header: "Payment",
                render: (o) => <StatusChip value={o.paymentStatus} />,
              },
              { key: "status", header: "Status", render: (o) => <StatusChip value={o.status} /> },
              { key: "createdAt", header: "Created", render: (o) => formatDate(o.createdAt) },
            ]}
            rowKey={(o) => o.id}
            onRowClick={(o) => navigate({ to: "/orders/$id/edit", params: { id: o.id } })}
            pageSize={5}
            emptyMessage="No orders recorded for this customer yet."
          />
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete ${customer.name}?`}
        description="The customer, their orders and follow-ups will be permanently removed."
        confirmLabel="Delete customer"
        destructive
        onConfirm={() => {
          crm.deleteCustomer(customer.id);
          toast.success("Customer deleted");
          navigate({ to: "/customers" });
        }}
      />
    </AppShell>
  );
}
