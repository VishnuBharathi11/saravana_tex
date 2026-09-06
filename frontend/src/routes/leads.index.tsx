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
import { getEmployees } from "@/api/employees";
import { getLeads } from "@/api/leads";
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

  const leadsQuery = useQuery({
    queryKey: ["leads"],
    queryFn: getLeads,
    enabled: Boolean(user),
  });
  const employeesQuery = useQuery({
    queryKey: ["employees"],
    queryFn: getEmployees,
    enabled: Boolean(user),
  });

  if (!user) return null;
  const isAdmin = user.role === "Admin";
  const employees = employeesQuery.data ?? [];
  const employeeName = (employeeId?: string) =>
    employees.find((employee) => employee.id === employeeId)?.name ?? "Unassigned";

  const leads = leadsQuery.data ?? [];
  const leadRows = leads.filter(
    (r) =>
      (leadStatus === "All" || r.status === leadStatus) &&
      (leadEmp === "All" || employeeName(r.employeeId) === leadEmp) &&
      (!leadSearch ||
        `${r.name} ${r.company} ${r.phone} ${r.email}`
          .toLowerCase()
          .includes(leadSearch.toLowerCase())),
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

          {leadsQuery.isPending ? (
            <div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">
              Loading leads...
            </div>
          ) : leadsQuery.isError ? (
            <div className="glass rounded-2xl p-8 text-center">
              <p className="font-medium">Unable to load leads</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {leadsQuery.error instanceof Error ? leadsQuery.error.message : "Please try again."}
              </p>
              <Button className="mt-4" onClick={() => leadsQuery.refetch()}>
                Retry
              </Button>
            </div>
          ) : leadRows.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">
              {leads.length === 0 ? "No leads found." : "No leads match the current filters."}
            </div>
          ) : (
            <DataTable
              rows={leadRows}
              columns={leadColumns}
              rowKey={(r) => r.id}
              filters={leadFilters}
              onRowClick={(r) => navigate({ to: "/leads/$id", params: { id: r.id } })}
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}
