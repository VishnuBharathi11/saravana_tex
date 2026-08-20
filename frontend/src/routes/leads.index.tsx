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
import { employeeName, employees } from "@/data/mock";
import type { Lead } from "@/types";

export const Route = createFileRoute("/leads/")({
  head: () => ({
    meta: [
      { title: "Leads · Saravana Traders CRM" },
      { name: "description", content: "Track every enquiry and lead." },
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
  const navigate = useNavigate({ from: Route.fullPath });
  const [leadStatus, setLeadStatus] = useState("All");
  const [leadEmp, setLeadEmp] = useState("All");
  const [leadSearch, setLeadSearch] = useState("");

  if (!user) return null;
  const isAdmin = user.role === "Admin";

  const { leads } = useCrm();

  const leadRows = leads.filter(
    (r) =>
      (leadStatus === "All" || r.status === leadStatus) &&
      (leadEmp === "All" || employeeName(r.employeeId) === leadEmp) &&
      (!leadSearch || 
        `${r.name} ${r.company} ${r.phone} ${r.email}`.toLowerCase().includes(leadSearch.toLowerCase())
      ),
  );

  const leadColumns: Column<Lead>[] = [
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
    { key: "source", header: "Source" },
    { key: "createdAt", header: "Created" },
  ];

  const leadFilters = [
    { label: "Status", options: ["New", "Contacted", "Interested", "Negotiation", "Converted", "Lost"], value: leadStatus, onChange: setLeadStatus },
    { label: "Employee", options: employees.map((e) => e.name), value: leadEmp, onChange: setLeadEmp },
  ];

  return (
    <AppShell>
      <div className="space-y-4">
        <PageHeader
          title="Leads"
          subtitle={
            isAdmin ? `Manage ${leads.length} leads` : `View records (Edit assigned only)`
          }
          actions={
            <Button className="gap-2 rounded-xl" onClick={() => navigate({ to: "/leads/new" })}>
              <Plus className="size-4" /> Add Lead
            </Button>
          }
        />

        <div className="m-0 space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search leads by name, company, phone, email..." 
              value={leadSearch}
              onChange={(e) => setLeadSearch(e.target.value)}
              className="pl-9 h-10 bg-white/70"
            />
          </div>
          <DataTable
            rows={leadRows}
            columns={leadColumns}
            rowKey={(r) => r.id}
            filters={leadFilters}
            onRowClick={(r) => navigate({ to: "/leads/$id", params: { id: r.id } })}
          />
        </div>
      </div>
    </AppShell>
  );
}
