import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, ShieldCheck, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/common/glass";
import { StatusChip } from "@/components/common/status-chip";
import { DataTable, type Column } from "@/components/common/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { toast } from "sonner";
import type { Employee } from "@/types";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { AccessDialog } from "@/components/dashboard/access-dialog";
import { crm, useCrm } from "@/lib/store";

export const Route = createFileRoute("/employees/")({
  head: () => ({
    meta: [
      { title: "Employees · Saravana Traders CRM" },
      {
        name: "description",
        content: "Admin view of the sales team, roles, status and access control.",
      },
      { property: "og:title", content: "Employees · Saravana Traders CRM" },
      { property: "og:description", content: "Team directory with roles and record level access." },
    ],
  }),
  component: EmployeesPage,
});

function EmployeesPage() {
  const user = useRequireAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState("All");
  const [status, setStatus] = useState("All");
  const [empToDelete, setEmpToDelete] = useState<Employee | null>(null);
  const [transferToId, setTransferToId] = useState<string>("");
  const { employees, leads, orders, followUps } = useCrm();

  if (!user) return null;

  if (user.role !== "Admin") {
    return (
      <AppShell>
        <div className="glass rounded-2xl p-10 text-center">
          <ShieldCheck className="mx-auto size-8 text-primary" />
          <p className="mt-3 font-semibold">Admin access required</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Employee management is restricted to administrators.
          </p>
        </div>
      </AppShell>
    );
  }

  const rows = employees.filter(
    (e) => (role === "All" || e.role === role) && (status === "All" || e.status === status),
  );

  const columns: Column<Employee>[] = [
    {
      key: "avatar",
      header: "Avatar",
      value: (e) => e.name,
      render: (e) => (
        <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-mint to-sky/60 text-[11px] font-bold">
          {e.name
            .split(" ")
            .map((p) => p[0])
            .join("")
            .slice(0, 2)}
        </span>
      ),
    },
    { key: "name", header: "Name", render: (e) => <span className="font-medium">{e.name}</span> },
    {
      key: "role",
      header: "Role",
      render: (e) => (
        <Select
          defaultValue={e.role}
          onValueChange={(v) => {
            crm.updateEmployee(e.id, { role: v as Employee["role"] });
            toast.success(`${e.name} is now ${v}`);
          }}
        >
          <SelectTrigger
            className="h-8 w-[168px] bg-white/70"
            onClick={(ev) => ev.stopPropagation()}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["Employee", "Admin"].map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    { key: "email", header: "Email" },
    { key: "phone", header: "Phone" },
    {
      key: "status",
      header: "Status",
      render: (e) => (
        <Select
          defaultValue={e.status}
          onValueChange={(v) => {
            crm.updateEmployee(e.id, { status: v as "Active" | "Inactive" });
            toast.success(`${e.name} is now ${v}`);
          }}
        >
          <SelectTrigger className="h-8 w-28 bg-white/70" onClick={(ev) => ev.stopPropagation()}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      ),
    },
    { key: "createdAt", header: "Created" },
    {
      key: "actions",
      header: "Actions",
      value: () => "",
      render: (e) => (
        <div className="flex gap-1" onClick={(ev) => ev.stopPropagation()}>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate({ to: "/employees/$id", params: { id: e.id } })}
          >
            Open
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="text-destructive"
            onClick={() => {
              setEmpToDelete(e);
              setTransferToId("");
            }}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AppShell>
      <div className="space-y-4">
        <PageHeader
          title="Employees"
          subtitle={`${employees.length} team members · role and access control`}
          actions={
            <>
              <AccessDialog />
              <Button
                className="gap-2 rounded-xl"
                onClick={() => navigate({ to: "/employees/new" })}
              >
                <Plus className="size-4" /> Add Employee
              </Button>
            </>
          }
        />

        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(e) => e.id}
          searchPlaceholder="Search employees…"
          onRowClick={(e) => navigate({ to: "/employees/$id", params: { id: e.id } })}
          filters={[
            {
              label: "Role",
              options: ["Admin", "Employee"],
              value: role,
              onChange: setRole,
            },
            {
              label: "Status",
              options: ["Active", "Inactive"],
              value: status,
              onChange: setStatus,
            },
          ]}
        />

        <p className="text-center text-xs text-muted-foreground">
          Team currently manages {leads.length} leads, {orders.length} orders and {followUps.length}{" "}
          follow-ups.
        </p>

        <Dialog
          open={!!empToDelete}
          onOpenChange={(o) => {
            if (!o) {
              setEmpToDelete(null);
              setTransferToId("");
            }
          }}
        >
          <DialogContent className="bg-white sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Delete {empToDelete?.name}?</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {(() => {
                const empLeads = leads.filter((l) => l.employeeId === empToDelete?.id).length;
                const empCustomers = crm.state.customers.filter(
                  (c) => c.employeeId === empToDelete?.id,
                ).length;
                const empOrders = orders.filter((o) => o.employeeId === empToDelete?.id).length;
                const empFollowUps = followUps.filter(
                  (f) => f.employeeId === empToDelete?.id,
                ).length;
                const totalRecords = empLeads + empCustomers + empOrders + empFollowUps;

                if (totalRecords > 0) {
                  return (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        This employee currently manages:
                      </p>
                      <ul className="text-sm list-disc pl-5">
                        {empLeads > 0 && <li>{empLeads} Leads</li>}
                        {empCustomers > 0 && <li>{empCustomers} Customers</li>}
                        {empFollowUps > 0 && <li>{empFollowUps} Follow-ups</li>}
                        {empOrders > 0 && <li>{empOrders} Orders</li>}
                      </ul>
                      <div className="space-y-2 mt-4">
                        <Label>Transfer records to:</Label>
                        <Select value={transferToId} onValueChange={setTransferToId}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Employee" />
                          </SelectTrigger>
                          <SelectContent>
                            {employees
                              .filter((e) => e.id !== empToDelete?.id && e.status === "Active")
                              .map((e) => (
                                <SelectItem key={e.id} value={e.id}>
                                  {e.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  );
                }
                return (
                  <p className="text-sm text-muted-foreground">
                    This employee has no active records.
                  </p>
                );
              })()}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEmpToDelete(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={(() => {
                  const empLeads = leads.filter((l) => l.employeeId === empToDelete?.id).length;
                  const empCustomers = crm.state.customers.filter(
                    (c) => c.employeeId === empToDelete?.id,
                  ).length;
                  const empOrders = orders.filter((o) => o.employeeId === empToDelete?.id).length;
                  const empFollowUps = followUps.filter(
                    (f) => f.employeeId === empToDelete?.id,
                  ).length;
                  const totalRecords = empLeads + empCustomers + empOrders + empFollowUps;
                  return totalRecords > 0 && !transferToId;
                })()}
                onClick={() => {
                  if (empToDelete) {
                    crm.deleteEmployee(empToDelete.id, transferToId);
                    toast.success("Employee deleted successfully");
                  }
                  setEmpToDelete(null);
                  setTransferToId("");
                }}
              >
                {transferToId ? "Transfer & Delete" : "Delete"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
