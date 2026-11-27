import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2, CalendarDays, ChevronDown, Phone, Plus, Search, Users } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/common/glass";
import { StatusChip } from "@/components/common/status-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { getEmployees } from "@/api/employees";
import { getLeads } from "@/api/leads";
import type { Lead } from "@/types";
import { formatDate, formatTime } from "@/lib/date-time";

function formatCreatedTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(parsed);
}
export const Route = createFileRoute("/leads/")({
  head: () => ({
    meta: [
      { title: "Leads · Saravana Traders CRM" },
      { name: "description", content: "Track every enquiry and lead." },
    ],
  }),
  component: LeadsPage,
});

function LeadCard({
  lead,
  employeeName,
  onOpen,
}: {
  lead: Lead;
  employeeName: (employeeId?: string) => string;
  onOpen: () => void;
}) {
  return (
    <article
      className="cursor-pointer rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm transition-colors hover:bg-white"
      onClick={onOpen}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-8 w-1 rounded-full bg-primary" />
          <p className="truncate text-lg font-bold">{lead.company || "Unknown company"}</p>
        </div>
        <StatusChip value={lead.activityStatus} />
      </div>

      <div className="mt-4 space-y-2.5">
        <div className="grid grid-cols-[24px_92px_12px_minmax(0,1fr)] items-center gap-1 text-sm">
          <Building2 className="size-4 text-muted-foreground" />
          <span className="text-muted-foreground">Person</span>
          <span className="text-muted-foreground">:</span>
          <span className="truncate font-semibold">{lead.name || "—"}</span>
        </div>
        <div className="grid grid-cols-[24px_92px_12px_minmax(0,1fr)] items-center gap-1 text-sm">
          <Phone className="size-4 text-muted-foreground" />
          <span className="text-muted-foreground">Phone</span>
          <span className="text-muted-foreground">:</span>
          <span className="truncate font-semibold">{lead.phone || "—"}</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 divide-x divide-border/70 border-t border-border/70 pt-3">
        <div className="px-2 first:pl-0">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="size-4" />
            <span>Assigned Employee</span>
          </div>
          <p className="mt-1 truncate text-sm font-semibold">{employeeName(lead.employeeId)}</p>
        </div>
        <div className="min-w-0 px-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="size-4" />
            <span>Created</span>
          </div>
          <div className="mt-1 text-sm font-semibold leading-5">
            <p>{formatDate(lead.createdAt)}</p>
            <p className="text-muted-foreground">{formatCreatedTime(lead.createdAt)}</p>
          </div>
        </div>
      </div>
    </article>
  );
}

function LeadsPage() {
  const user = useRequireAuth();
  const navigate = useNavigate({ from: Route.fullPath });
  const [leadStatus, setLeadStatus] = useState("All");
  const [leadEmp, setLeadEmp] = useState("All");
  const [leadSearch, setLeadSearch] = useState("");
  const [leadSort, setLeadSort] = useState<"default" | "newest" | "oldest">("default");
  const [leadPage, setLeadPage] = useState(0);

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
  const leadPriorityRank: Record<string, number> = { Active: 1, Inactive: 2 };
  const leadRows = leads.filter(
    (r) =>
      r.status !== "Converted" &&
      (leadStatus === "All" || r.activityStatus === leadStatus) &&
      (leadEmp === "All" || employeeName(r.employeeId) === leadEmp) &&
      (!leadSearch ||
        `${r.name} ${r.company} ${r.phone} ${r.email}`
          .toLowerCase()
          .includes(leadSearch.toLowerCase())),
  );

  const orderedLeadRows = [...leadRows].sort((a, b) => {
    if (leadSort === "newest") {
      return (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0);
    }
    if (leadSort === "oldest") {
      return (Date.parse(a.createdAt) || 0) - (Date.parse(b.createdAt) || 0);
    }
    const statusDiff =
      (leadPriorityRank[a.activityStatus] ?? 3) -
      (leadPriorityRank[b.activityStatus] ?? 3);
    if (statusDiff !== 0) return statusDiff;
    return (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0);
  });

  const leadPageSize = 6;
  const leadPages = Math.max(1, Math.ceil(orderedLeadRows.length / leadPageSize));
  const currentLeadPage = Math.min(leadPage, leadPages - 1);
  const visibleLeadRows = orderedLeadRows.slice(
    currentLeadPage * leadPageSize,
    currentLeadPage * leadPageSize + leadPageSize,
  );

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
          ) : orderedLeadRows.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">
              {leads.length === 0 ? "No leads found." : "No leads match the current filters."}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="glass rounded-2xl p-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search leads, companies..."
                    value={leadSearch}
                    onChange={(event) => {
                      setLeadSearch(event.target.value);
                      setLeadPage(0);
                    }}
                    className="h-11 rounded-xl border-0 bg-white/85 pl-10"
                  />
                </div>

                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="glass-soft shrink-0 rounded-full border-0">
                        Status
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuRadioGroup value={leadStatus} onValueChange={(value) => { setLeadStatus(value); setLeadPage(0); }}>
                        {["All", "Active", "Inactive"].map((option) => (
                          <DropdownMenuRadioItem key={option} value={option}>
                            {option === "All" ? "All statuses" : option}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="glass-soft shrink-0 rounded-full border-0">
                        Employee
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="max-h-72 overflow-auto">
                      <DropdownMenuRadioGroup value={leadEmp} onValueChange={(value) => { setLeadEmp(value); setLeadPage(0); }}>
                        {["All", ...employees.map((e) => e.name)].map((option) => (
                          <DropdownMenuRadioItem key={option} value={option}>
                            {option === "All" ? "All employees" : option}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="glass-soft shrink-0 rounded-full border-0">
                        Sort <ChevronDown className="size-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuRadioGroup value={leadSort} onValueChange={(value) => { setLeadSort(value as typeof leadSort); setLeadPage(0); }}>
                        <DropdownMenuRadioItem value="default">Status order</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="newest">Newest first</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="oldest">Oldest first</DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {visibleLeadRows.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    employeeName={employeeName}
                    onOpen={() => navigate({ to: "/leads/$id", params: { id: lead.id } })}
                  />
                ))}
              </div>

              {visibleLeadRows.length === 0 && (
                <div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">
                  {leads.length === 0 ? "No leads found." : "No leads match the current filters."}
                </div>
              )}

              <div className="flex items-center justify-between gap-2 px-1 text-xs text-muted-foreground">
                <span>{orderedLeadRows.length} records · page {currentLeadPage + 1} of {leadPages}</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    disabled={currentLeadPage === 0}
                    onClick={() => setLeadPage(currentLeadPage - 1)}
                  >
                    <span className="text-lg">‹</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    disabled={currentLeadPage >= leadPages - 1}
                    onClick={() => setLeadPage(currentLeadPage + 1)}
                  >
                    <span className="text-lg">›</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
