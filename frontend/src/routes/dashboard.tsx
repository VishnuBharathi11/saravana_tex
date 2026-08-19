import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  CalendarClock,
  CheckCircle2,
  AlertTriangle,
  IndianRupee,
  Package,
  ShoppingBag,
  UserPlus,
  UserRound,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/common/glass";
import { StatCard } from "@/components/common/stat-card";
import { StatusChip } from "@/components/common/status-chip";
import { DataTable, type Column } from "@/components/common/data-table";
import { DashboardWorkflowOptions } from "@/components/dashboard/dashboard-workflow-options";
import { useRequireAuth } from "@/hooks/use-require-auth";
import {
  TODAY,
  customers,
  dashboardStats,
  employeeName,
  employees,
  followUps,
  inr,
  leads,
  orders,
  statusSeries,
} from "@/data/mock";
import { cn } from "@/lib/utils";
import type { Lead } from "@/types";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard · Saravana Traders CRM" },
      {
        name: "description",
        content: "Business overview with leads, customers, orders, revenue and follow-up KPIs.",
      },
      { property: "og:title", content: "Dashboard · Saravana Traders CRM" },
      { property: "og:description", content: "Live sales KPIs, charts and recent activity." },
    ],
  }),
  component: DashboardPage,
});

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--teal)",
];

function DashboardPage() {
  const user = useRequireAuth();
  const navigate = useNavigate();
  const [board, setBoard] = useState<"leads" | "converted" | "orders" | "employees">("leads");
  const [mobileTab, setMobileTab] = useState<"Upcoming" | "Pending">("Upcoming");

  const isAdmin = user?.role === "Admin";
  const scopedLeads = isAdmin ? leads : leads.filter((l) => l.employeeId === user?.id);
  const scopedOrders = isAdmin ? orders : orders.filter((o) => o.employeeId === user?.id);

  const boardRows = useMemo(() => {
    if (board === "converted") return scopedLeads.filter((l) => l.status === "Converted");
    if (board === "orders")
      return scopedOrders
        .filter((o) => o.status !== "Cancelled")
        .slice(0, 40)
        .map<Lead>((o) => ({
          id: o.id,
          name: o.customerName,
          company: o.company,
          phone: "—",
          email: "—",
          address: o.address,
          material: o.material,
          units: o.units,
          quantity: o.quantity,
          duration: o.deliveryDate,
          notes: o.notes,
          employeeId: o.employeeId,
          status: "Converted",
          source: "Order",
          createdAt: o.createdAt,
          feedback: `${o.paymentStatus} · ${o.status}`,
        }));
    if (board === "employees")
      return employees.slice(0, 25).map<Lead>((e) => ({
        id: e.id,
        name: e.name,
        company: e.designation,
        phone: e.phone,
        email: e.email,
        address: "—",
        material: "—",
        units: "—",
        quantity: leads.filter((l) => l.employeeId === e.id).length,
        duration: e.status,
        notes: "",
        employeeId: e.id,
        status: "New",
        source: e.role,
        createdAt: e.createdAt,
        feedback: `${orders.filter((o) => o.employeeId === e.id).length} orders handled`,
      }));
    return scopedLeads;
  }, [board, scopedLeads, scopedOrders]);

  const boardColumns: Column<Lead>[] = [
    { key: "name", header: "Name" },
    { key: "phone", header: "Contact" },
    { key: "company", header: "Company" },
    { key: "material", header: "Material Required" },
    { key: "quantity", header: "Quantity" },
    { key: "units", header: "Units" },
    { key: "duration", header: "Duration" },
    { key: "status", header: "Status", render: (r) => <StatusChip value={r.status} /> },
    {
      key: "employeeId",
      header: "Assigned Employee",
      value: (r) => employeeName(r.employeeId),
      render: (r) => employeeName(r.employeeId),
    },
    { key: "feedback", header: "Feedback", className: "max-w-[240px] truncate" },
    {
      key: "followup",
      header: "Follow-up",
      render: (r) => (
        <span className="text-xs text-muted-foreground">
          {followUps.find((f) => f.relatedId === r.id)?.date ?? "Not scheduled"}
        </span>
      ),
    },
  ];

  const upcoming = followUps
    .filter((f) => f.status !== "Completed" && (f.date >= TODAY || f.status === "Missed"))
    .slice(0, 6);
  const missed = followUps.filter((f) => f.date < TODAY && f.status === "Pending").slice(0, 6);

  if (!user) return null;

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader
          title={`Good day, ${user.name.split(" ")[0]}`}
          subtitle={`${user.role} workspace · business overview for ${TODAY}`}
        />

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Today's Meetings"
            value={dashboardStats.todaysMeetings}
            icon={CalendarClock}
            tone="coral"
            delay={0}
          />
          <StatCard
            label="Orders"
            value={dashboardStats.orders}
            icon={Package}
            tone="teal"
            delay={60}
          />
          <StatCard
            label="Customers"
            value={dashboardStats.customers}
            icon={UserRound}
            tone="sky"
            delay={120}
          />
          <StatCard
            label="Total Leads"
            value={dashboardStats.totalLeads}
            icon={Users}
            tone="teal"
            delay={180}
          />
        </section>

        <section className="space-y-3">
          <DataTable
            rows={boardRows}
            columns={boardColumns}
            rowKey={(r) => r.id}
            searchPlaceholder="Search this board…"
            sortMenuExtra={
              <DashboardWorkflowOptions activeBoard={board} onSelect={(b) => setBoard(b)} />
            }
            onRowClick={(r) =>
              board === "employees"
                ? navigate({ to: "/employees/$id", params: { id: r.id } })
                : board === "orders"
                  ? navigate({ to: "/orders" })
                  : navigate({ to: "/leads/$id", params: { id: r.id } })
            }
          />
        </section>

        <section className="grid gap-3 xl:grid-cols-2">
          <div className="md:hidden xl:col-span-2">
            <div className="mb-1 flex items-center gap-1 rounded-full bg-white/55 p-1 glass-soft">
              <button
                onClick={() => setMobileTab("Upcoming")}
                className={cn(
                  "flex-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                  mobileTab === "Upcoming"
                    ? "bg-mint/40 text-teal"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Upcoming
              </button>
              <button
                onClick={() => setMobileTab("Pending")}
                className={cn(
                  "flex-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                  mobileTab === "Pending"
                    ? "bg-mint/40 text-teal"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Pending
              </button>
            </div>
          </div>

          <div
            className={cn(
              "glass rounded-2xl p-4",
              mobileTab === "Upcoming" ? "block" : "hidden md:block",
            )}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">Upcoming meetings & follow-ups</p>
              <button
                onClick={() => navigate({ to: "/calendar" })}
                className="text-xs font-medium text-primary hover:underline"
              >
                Open calendar →
              </button>
            </div>
            <div className="space-y-2">
              {upcoming.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-white/55 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{f.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {f.relatedName} · {f.date} · {f.time}
                    </p>
                  </div>
                  <StatusChip value={f.status} />
                </div>
              ))}
            </div>
          </div>

          <div
            className={cn(
              "glass rounded-2xl border border-coral/40 bg-coral/5 p-4",
              mobileTab === "Pending" ? "block" : "hidden md:block",
            )}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="flex items-center gap-2 text-sm font-semibold text-coral">
                <AlertTriangle className="size-4" /> Pending follow-ups
              </p>
              <button
                onClick={() => navigate({ to: "/calendar" })}
                className="text-xs font-medium text-coral hover:underline"
              >
                View all →
              </button>
            </div>
            <div className="space-y-2">
              {missed.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{f.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      missed {f.date} · {f.relatedName}
                    </p>
                  </div>
                  <StatusChip value={f.priority} />
                </div>
              ))}
            </div>
          </div>
        </section>

        <p className="pb-2 text-center text-xs text-muted-foreground">
          {customers.length} customers · {orders.length} orders · {followUps.length} follow-ups
          tracked
        </p>
      </div>
    </AppShell>
  );
}
