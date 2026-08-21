import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/common/glass";
import { StatusChip } from "@/components/common/status-chip";
import { DataTable, type Column } from "@/components/common/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useCrm } from "@/lib/store";
import { employeeName, employees, inr } from "@/data/mock";
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
      {name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)}
    </span>
  );
}

function CustomersPage() {
  const user = useRequireAuth();
  const navigate = useNavigate({ from: Route.fullPath });
  const [customerStatus, setCustomerStatus] = useState("All");
  const [customerEmp, setCustomerEmp] = useState("All");
  const [customerSearch, setCustomerSearch] = useState("");

  if (!user) return null;
  const isAdmin = user.role === "Admin";

  const { customers } = useCrm();

  const customerRows = customers.filter(
    (r) =>
      (customerStatus === "All" || r.status === customerStatus) &&
      (customerEmp === "All" || employeeName(r.employeeId) === customerEmp) &&
      (!customerSearch || 
        `${r.name} ${r.company} ${r.phone} ${r.email}`.toLowerCase().includes(customerSearch.toLowerCase())
      ),
  );

  const customerColumns: Column<Customer>[] = [
    { key: "avatar", header: "Profile", value: (r) => r.name, render: (r) => <Avatar name={r.name} /> },
    { key: "name", header: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "company", header: "Company" },
    { key: "phone", header: "Phone" },
    { key: "email", header: "Email" },
    {
      key: "employeeId",
      header: "Assigned Employee",
      value: (r) => employeeName(r.employeeId),
      render: (r) => employeeName(r.employeeId),
    },
    { key: "status", header: "Status", render: (r) => <StatusChip value={r.status} /> },
    { key: "totalOrders", header: "Orders" },
    { key: "totalValue", header: "Lifetime Value", render: (r) => inr(r.totalValue) },
  ];

  const customerFilters = [
    { label: "Status", options: ["Active", "Dormant", "VIP"], value: customerStatus, onChange: setCustomerStatus },
    { label: "Employee", options: employees.map((e) => e.name), value: customerEmp, onChange: setCustomerEmp },
  ];

  return (
    <AppShell>
      <div className="space-y-4">
        <PageHeader
          title="Customers"
          subtitle={
            isAdmin ? `Manage ${customers.length} customers` : `View records (Edit assigned only)`
          }
        />

        <div className="m-0 space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search customers by name, company, phone, email..." 
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="pl-9 h-10 bg-white/70"
            />
          </div>
          <DataTable
            rows={customerRows}
            columns={customerColumns}
            rowKey={(r) => r.id}
            filters={customerFilters}
            onRowClick={(r) => navigate({ to: "/customers/$id", params: { id: r.id } })}
          />
        </div>
      </div>
    </AppShell>
  );
}
