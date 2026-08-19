import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/common/glass";
import { StatusChip } from "@/components/common/status-chip";
import { DataTable, type Column } from "@/components/common/data-table";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { customers, employeeName, employees, inr } from "@/data/mock";
import type { Customer } from "@/types";

export const Route = createFileRoute("/customers/")({
  head: () => ({
    meta: [
      { title: "Customers · Saravana Traders CRM" },
      {
        name: "description",
        content:
          "Customer register with lifetime value, assigned employee, status and source filters.",
      },
      { property: "og:title", content: "Customers · Saravana Traders CRM" },
      {
        property: "og:description",
        content: "Complete customer accounts register for the sales team.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
  const navigate = useNavigate();
  const [status, setStatus] = useState("All");
  const [emp, setEmp] = useState("All");
  const [source, setSource] = useState("All");

  if (!user) return null;
  const isAdmin = user.role === "Admin";

  const scoped = isAdmin ? customers : customers.filter((c) => c.employeeId === user.id);
  const rows = scoped.filter(
    (r) =>
      (status === "All" || r.status === status) &&
      (emp === "All" || employeeName(r.employeeId) === emp) &&
      (source === "All" || r.source === source),
  );

  const columns: Column<Customer>[] = [
    {
      key: "avatar",
      header: "Profile",
      value: (r) => r.name,
      render: (r) => <Avatar name={r.name} />,
    },
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
    { key: "source", header: "Source" },
    { key: "totalOrders", header: "Orders" },
    { key: "totalValue", header: "Lifetime Value", render: (r) => inr(r.totalValue) },
    { key: "createdAt", header: "Created" },
  ];

  const filters = [
    { label: "Status", options: ["Active", "Dormant", "VIP"], value: status, onChange: setStatus },
    { label: "Employee", options: employees.map((e) => e.name), value: emp, onChange: setEmp },
    {
      label: "Source",
      options: ["Website", "Referral", "Walk-in", "Exhibition", "Cold Call", "IndiaMART"],
      value: source,
      onChange: setSource,
    },
  ];

  return (
    <AppShell>
      <div className="space-y-4">
        <PageHeader
          title="Customers"
          subtitle={
            isAdmin
              ? `${scoped.length} customer accounts across the organisation`
              : "Customer accounts assigned to you"
          }
        />

        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(r) => r.id}
          searchPlaceholder="Search customers by name, company, phone…"
          filters={filters}
          onRowClick={(r) => navigate({ to: "/customers/$id", params: { id: r.id } })}
        />
      </div>
    </AppShell>
  );
}
