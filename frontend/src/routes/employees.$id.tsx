import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowLeft,
  IndianRupee,
  Mail,
  Package,
  Phone,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { GlassCard, PageHeader } from "@/components/common/glass";
import { StatusChip } from "@/components/common/status-chip";
import { StatCard } from "@/components/common/stat-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useCrm } from "@/lib/store";
import { inr } from "@/data/mock";

export const Route = createFileRoute("/employees/$id")({
  head: () => ({
    meta: [
      { title: "Employee profile · Saravana Traders CRM" },
      {
        name: "description",
        content: "Performance analytics, assigned leads, orders and follow-ups per employee.",
      },
      { property: "og:title", content: "Employee profile · Saravana Traders CRM" },
      {
        property: "og:description",
        content: "Individual sales performance and workload breakdown.",
      },
    ],
  }),
  component: EmployeeDetail,
});

const CHART_COLORS = [
  "oklch(0.72 0.13 165)",
  "oklch(0.72 0.11 200)",
  "oklch(0.78 0.11 245)",
  "oklch(0.83 0.12 90)",
  "oklch(0.75 0.12 320)",
];

function EmployeeDetail() {
  const user = useRequireAuth();
  const { id } = useParams({ from: "/employees/$id" });
  const { employees, leads, customers, orders, followUps } = useCrm();
  const employee = employees.find((e) => e.id === id);

  if (!user) return null;

  if (!employee) {
    return (
      <AppShell>
        <GlassCard className="p-10 text-center">
          <p className="font-semibold">Employee not found</p>
          <Link to="/employees" className="mt-3 inline-block text-sm text-primary underline">
            Back to employees
          </Link>
        </GlassCard>
      </AppShell>
    );
  }

  const myLeads = leads.filter((l) => l.employeeId === employee.id);
  const myCustomers = customers.filter((c) => c.employeeId === employee.id);
  const myOrders = orders.filter((o) => o.employeeId === employee.id);
  const myFollowUps = followUps.filter((f) => f.employeeId === employee.id);
  const revenue = myOrders.reduce((a, o) => a + o.value, 0);
  const converted = myLeads.filter((l) => l.status === "Converted").length;
  const conversion = myLeads.length ? Math.round((converted / myLeads.length) * 100) : 0;

  const statusData = ["New", "Contacted", "Interested", "Negotiation", "Converted", "Lost"].map(
    (s) => ({
      name: s,
      value: myLeads.filter((l) => l.status === s).length,
    }),
  );
  const monthly = Array.from({ length: 6 }, (_, i) => {
    const slice = myOrders.filter((_, idx) => idx % 6 === i);
    return {
      name: ["Mar", "Apr", "May", "Jun", "Jul", "Aug"][i],
      revenue: slice.reduce((a, o) => a + o.value, 0),
    };
  });

  return (
    <AppShell>
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm" className="gap-2">
          <Link to="/employees">
            <ArrowLeft className="size-4" /> Employees
          </Link>
        </Button>

        <PageHeader
          title={employee.name}
          subtitle={`${employee.designation} · joined ${employee.createdAt}`}
          actions={
            <>
              <StatusChip value={employee.role} />
              <StatusChip value={employee.status} />
            </>
          }
        />

        <GlassCard className="grid gap-3 p-4 sm:grid-cols-3">
          <p className="flex items-center gap-2 text-sm">
            <Mail className="size-4 text-primary" /> {employee.email}
          </p>
          <p className="flex items-center gap-2 text-sm">
            <Phone className="size-4 text-primary" /> {employee.phone}
          </p>
          <p className="flex items-center gap-2 text-sm">
            <ShieldCheck className="size-4 text-primary" /> Access: {employee.role}
          </p>
        </GlassCard>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Assigned leads" value={myLeads.length} icon={Target} />
          <StatCard label="Customers" value={myCustomers.length} icon={Users} />
          <StatCard label="Orders" value={myOrders.length} icon={Package} />
          <StatCard label="Revenue" value={revenue} icon={IndianRupee} prefix="₹" />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <GlassCard className="p-4">
            <p className="text-sm font-semibold">Revenue trend</p>
            <div className="mt-3 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="oklch(0.9 0.02 180)"
                    vertical={false}
                  />
                  <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} width={54} />
                  <Tooltip formatter={(v: number) => inr(v)} />
                  <Bar dataKey="revenue" radius={[8, 8, 0, 0]} fill="oklch(0.72 0.13 165)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <p className="text-sm font-semibold">Lead status split · {conversion}% conversion</p>
            <div className="mt-3 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={48}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        <GlassCard className="p-4" hover={false}>
          <Tabs defaultValue="leads">
            <TabsList className="rounded-xl">
              <TabsTrigger value="leads">Leads</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="followups">Follow-ups</TabsTrigger>
            </TabsList>

            <TabsContent value="leads" className="mt-3 space-y-1.5">
              {myLeads.slice(0, 10).map((l) => (
                <Link
                  key={l.id}
                  to="/leads/$id"
                  params={{ id: l.id }}
                  className="flex items-center justify-between gap-3 rounded-xl bg-white/55 px-3 py-2 hover:bg-mint/30"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{l.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {l.company} · {l.material}
                    </span>
                  </span>
                  <StatusChip value={l.status} />
                </Link>
              ))}
              {myLeads.length === 0 && (
                <p className="p-4 text-sm text-muted-foreground">No leads assigned.</p>
              )}
            </TabsContent>

            <TabsContent value="orders" className="mt-3 space-y-1.5">
              {myOrders.slice(0, 10).map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-white/55 px-3 py-2"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {o.invoiceNumber} · {o.customerName}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {o.material} · {inr(o.value)}
                    </span>
                  </span>
                  <StatusChip value={o.status} />
                </div>
              ))}
              {myOrders.length === 0 && (
                <p className="p-4 text-sm text-muted-foreground">No orders yet.</p>
              )}
            </TabsContent>

            <TabsContent value="followups" className="mt-3 space-y-1.5">
              {myFollowUps.slice(0, 10).map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-white/55 px-3 py-2"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{f.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {f.date} {f.time} · {f.relatedName}
                    </span>
                  </span>
                  <StatusChip value={f.status} />
                </div>
              ))}
              {myFollowUps.length === 0 && (
                <p className="p-4 text-sm text-muted-foreground">No follow-ups.</p>
              )}
            </TabsContent>
          </Tabs>
        </GlassCard>
      </div>
    </AppShell>
  );
}
