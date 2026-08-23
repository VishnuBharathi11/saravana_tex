import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/common/glass";
import { StatusChip } from "@/components/common/status-chip";
import { DataTable, type Column } from "@/components/common/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { getCustomers } from "@/api/customers";
import { getEmployees } from "@/api/employees";
import type { Customer } from "@/types";

export const Route = createFileRoute("/customers/")({
  head: () => ({
    meta: [
      { title: "Customers · Saravana Traders CRM" },
      { name: "description", content: "Track every customer account." },
    ],
  }),
  component: CustomersPage,
});

function Avatar({ name }: { name: string }) {
  return (
    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-mint to-sky/60 text-[11px] font-bold text-secondary-foreground">
      {name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
    </span>
  );
}

const inr = (value: number) => `₹${value.toLocaleString("en-IN")}`;

function CustomersPage() {
  const user = useRequireAuth();
  const navigate = useNavigate({ from: Route.fullPath });
  const [customerStatus, setCustomerStatus] = useState("All");
  const [customerEmp, setCustomerEmp] = useState("All");
  const [customerSearch, setCustomerSearch] = useState("");

  const customersQuery = useQuery({
    queryKey: ["customers"],
    queryFn: getCustomers,
    enabled: Boolean(user),
  });
  const employeesQuery = useQuery({
    queryKey: ["employees"],
    queryFn: getEmployees,
    enabled: Boolean(user),
  });

  if (!user) return null;
  const employees = employeesQuery.data ?? [];
  const customers = customersQuery.data ?? [];
  const employeeName = (id: string) => employees.find((e) => e.id === id)?.name ?? "Unassigned";
  const customerRows = customers.filter(
    (r) =>
      (customerStatus === "All" || r.status === customerStatus) &&
      (customerEmp === "All" || employeeName(r.employeeId) === customerEmp) &&
      (!customerSearch || `${r.name} ${r.company} ${r.phone} ${r.email}`.toLowerCase().includes(customerSearch.toLowerCase())),
  );

  const customerColumns: Column<Customer>[] = [
    { key: "avatar", header: "Profile", value: (r) => r.name, render: (r) => <Avatar name={r.name} /> },
    { key: "name", header: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "company", header: "Company" },
    { key: "phone", header: "Phone" },
    { key: "email", header: "Email" },
    { key: "employeeId", header: "Assigned Employee", value: (r) => employeeName(r.employeeId), render: (r) => employeeName(r.employeeId) },
    { key: "status", header: "Status", render: (r) => <StatusChip value={r.status} /> },
    { key: "totalOrders", header: "Orders" },
    { key: "totalValue", header: "Lifetime Value", render: (r) => inr(r.totalValue) },
  ];

  const loading = customersQuery.isPending || employeesQuery.isPending;
  const error = customersQuery.error ?? employeesQuery.error;

  return (
    <AppShell>
      <div className="space-y-4">
        <PageHeader title="Customers" subtitle={user.role === "Admin" ? `Manage ${customers.length} customers` : "View records (Edit assigned only)"} />
        <div className="m-0 space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search customers by name, company, phone, email..." value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} className="pl-9 h-10 bg-white/70" />
          </div>
          {loading ? (
            <div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">Loading customers...</div>
          ) : error ? (
            <div className="glass rounded-2xl p-8 text-center"><p className="font-medium">Unable to load customers</p><p className="mt-1 text-sm text-muted-foreground">{error instanceof Error ? error.message : "Please try again."}</p></div>
          ) : customerRows.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">{customers.length === 0 ? "No customers found." : "No customers match the current filters."}</div>
          ) : (
            <DataTable rows={customerRows} columns={customerColumns} rowKey={(r) => r.id} filters={[{ label: "Status", options: ["Active", "Dormant", "VIP"], value: customerStatus, onChange: setCustomerStatus }, { label: "Employee", options: employees.map((e) => e.name), value: customerEmp, onChange: setCustomerEmp }]} onRowClick={(r) => navigate({ to: "/customers/$id", params: { id: r.id } })} />
          )}
        </div>
      </div>
    </AppShell>
  );
}
