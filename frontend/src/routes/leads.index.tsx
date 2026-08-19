import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/common/glass";
import { StatusChip } from "@/components/common/status-chip";
import { DataTable, type Column } from "@/components/common/data-table";
import { Button } from "@/components/ui/button";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { employeeName, employees, leads } from "@/data/mock";
import type { Lead } from "@/types";

export const Route = createFileRoute("/leads/")({
  head: () => ({
    meta: [
      { title: "Leads · Saravana Traders CRM" },
      {
        name: "description",
        content: "Track every enquiry and lead with filters, sorting and export.",
      },
      { property: "og:title", content: "Leads · Saravana Traders CRM" },
      { property: "og:description", content: "Full lead register for the sales team." },
    ],
  }),
  component: LeadsPage,
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

function LeadsPage() {
  const user = useRequireAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState("All");
  const [emp, setEmp] = useState("All");
  const [source, setSource] = useState("All");

  if (!user) return null;
  const isAdmin = user.role === "Admin";

  const scoped = isAdmin ? leads : leads.filter((l) => l.employeeId === user.id);
  const rows = scoped.filter(
    (r) =>
      (status === "All" || r.status === status) &&
      (emp === "All" || employeeName(r.employeeId) === emp) &&
      (source === "All" || r.source === source),
  );

  const columns: Column<Lead>[] = [
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
    { key: "createdAt", header: "Created" },
  ];

  const filters = [
    {
      label: "Status",
      options: ["New", "Contacted", "Interested", "Negotiation", "Converted", "Lost"],
      value: status,
      onChange: setStatus,
    },
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
          title="Leads"
          subtitle={
            isAdmin ? `${scoped.length} leads across the organisation` : "Leads assigned to you"
          }
          actions={
            <Button className="gap-2 rounded-xl" onClick={() => navigate({ to: "/leads/new" })}>
              <Plus className="size-4" /> Add Lead
            </Button>
          }
        />

        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(r) => r.id}
          searchPlaceholder="Search leads by name, company, phone…"
          filters={filters}
          onRowClick={(r) => navigate({ to: "/leads/$id", params: { id: r.id } })}
        />
      </div>
    </AppShell>
  );
}
