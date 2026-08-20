import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Camera, KeyRound, Save, Mail, Phone, ShieldCheck } from "lucide-react";
import { GlassCard } from "@/components/common/glass";
import { StatusChip } from "@/components/common/status-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCrm, crm } from "@/lib/store";
import { inr } from "@/data/mock";
import { toast } from "sonner";
import type { Employee } from "@/types";

interface EmployeeProfileProps {
  employee: Employee;
  editable?: boolean;
}

export function EmployeeProfile({ employee, editable = false }: EmployeeProfileProps) {
  const { leads, orders, followUps } = useCrm();

  const [name, setName] = useState(employee.name);
  const [email, setEmail] = useState(employee.email);
  const [phone, setPhone] = useState(employee.phone);
  const [designation, setDesignation] = useState(employee.designation);
  const [about, setAbout] = useState(employee.about || "");

  const myLeads = leads.filter((l) => l.employeeId === employee.id);
  const myOrders = orders.filter((o) => o.employeeId === employee.id);
  const myFollowUps = followUps.filter((f) => f.employeeId === employee.id);

  const upcomingFollowUps = myFollowUps.filter((f) => f.status !== "Completed" && f.status !== "Missed");
  const completedFollowUps = myFollowUps.filter((f) => f.status === "Completed");

  const initials = employee.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    crm.updateEmployee(employee.id, {
      name,
      email,
      phone,
      designation,
      about,
    });
    toast.success("Profile updated");
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,1.5fr)]">
        {/* PERSONAL PROFILE AREA */}
        <div className="space-y-4">
          <GlassCard className="p-6 text-center sm:text-left" hover={false}>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <div className="relative shrink-0">
                <div className="grid size-24 place-items-center rounded-full bg-gradient-to-br from-mint via-teal/40 to-sky/50 text-3xl font-bold">
                  {initials}
                </div>
                {editable && (
                  <button
                    onClick={() => toast("Photo upload is mocked in this build")}
                    className="absolute -right-1 bottom-1 grid size-8 place-items-center rounded-full border-2 border-white bg-primary text-primary-foreground shadow-sm"
                  >
                    <Camera className="size-4" />
                  </button>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-1 pt-1">
                <h2 className="truncate font-display text-2xl font-bold">{employee.name}</h2>
                <p className="truncate text-muted-foreground">{employee.designation}</p>
                <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                  <StatusChip value={employee.role} />
                  <StatusChip value={employee.status} />
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-white/40 pt-6">
              {editable ? (
                <form onSubmit={handleSave} className="grid gap-4">
                  <div className="space-y-1.5 text-left">
                    <Label htmlFor="n" className="text-muted-foreground">Full name</Label>
                    <Input id="n" value={name} onChange={(e) => setName(e.target.value)} className="h-10 bg-white/70" />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <Label htmlFor="e" className="text-muted-foreground">Email</Label>
                    <Input id="e" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-10 bg-white/70" />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <Label htmlFor="p" className="text-muted-foreground">Phone</Label>
                    <Input id="p" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-10 bg-white/70" />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <Label htmlFor="d" className="text-muted-foreground">Designation</Label>
                    <Input id="d" value={designation} onChange={(e) => setDesignation(e.target.value)} className="h-10 bg-white/70" />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <Label htmlFor="a" className="text-muted-foreground">About</Label>
                    <Textarea
                      id="a"
                      rows={3}
                      value={about}
                      maxLength={200}
                      onChange={(e) => setAbout(e.target.value)}
                      className="bg-white/70"
                    />
                    <div className="text-right text-xs text-muted-foreground">
                      {about.length}/200
                    </div>
                  </div>
                  
                  <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Button type="button" variant="outline" className="flex-1 rounded-xl bg-white/50" onClick={() => toast("Password reset workflow mocked")}>
                      Change Password
                    </Button>
                    <Button type="submit" className="flex-1 gap-2 rounded-xl">
                      <Save className="size-4" /> Save Changes
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4 text-left">
                  <div className="flex items-center gap-3">
                    <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-sky/10 text-sky">
                      <Mail className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="truncate text-sm font-medium">{employee.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-teal/10 text-teal">
                      <Phone className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="truncate text-sm font-medium">{employee.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                      <ShieldCheck className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Role Access</p>
                      <p className="truncate text-sm font-medium">{employee.role}</p>
                    </div>
                  </div>
                  {employee.about && (
                    <div className="mt-4 rounded-xl bg-white/40 p-4">
                      <p className="text-xs text-muted-foreground">About</p>
                      <p className="mt-1 text-sm leading-relaxed">{employee.about}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* CRM WORKLOAD AREA */}
        <div className="min-w-0 space-y-4">
          <GlassCard className="p-4 sm:p-6" hover={false}>
            <Tabs defaultValue="followups">
              <TabsList className="mb-4 h-auto flex-wrap justify-start gap-2 rounded-xl bg-transparent p-0 text-left">
                <TabsTrigger 
                  value="followups" 
                  className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  Follow-ups ({myFollowUps.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="leads" 
                  className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  Leads Owned ({myLeads.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="orders" 
                  className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  Orders Handled ({myOrders.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="followups" className="m-0 space-y-4 outline-none text-left">
                <Tabs defaultValue="upcoming" className="w-full">
                  <TabsList className="mb-4 grid w-full max-w-[400px] grid-cols-2 rounded-xl">
                    <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="upcoming" className="m-0 space-y-2">
                    {upcomingFollowUps.length > 0 ? upcomingFollowUps.map(f => (
                      <div key={f.id} className="flex flex-col gap-3 rounded-xl bg-white/55 p-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{f.title}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {f.date} {f.time} · {f.relatedName}
                          </p>
                        </div>
                        <StatusChip value={f.status} className="w-fit" />
                      </div>
                    )) : (
                      <p className="p-4 text-center text-sm text-muted-foreground">No upcoming follow-ups.</p>
                    )}
                  </TabsContent>

                  <TabsContent value="completed" className="m-0 space-y-2">
                    {completedFollowUps.length > 0 ? completedFollowUps.map(f => (
                      <div key={f.id} className="flex flex-col gap-3 rounded-xl bg-white/55 p-3 sm:flex-row sm:items-center sm:justify-between opacity-80">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{f.title}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {f.date} {f.time} · {f.relatedName}
                          </p>
                        </div>
                        <StatusChip value={f.status} className="w-fit" />
                      </div>
                    )) : (
                      <p className="p-4 text-center text-sm text-muted-foreground">No completed follow-ups.</p>
                    )}
                  </TabsContent>
                </Tabs>
              </TabsContent>

              <TabsContent value="leads" className="m-0 space-y-2 outline-none text-left">
                {myLeads.length > 0 ? myLeads.map(l => (
                  <Link 
                    key={l.id} 
                    to="/leads/$id" 
                    params={{ id: l.id }}
                    className="flex flex-col gap-3 rounded-xl bg-white/55 p-3 transition-colors hover:bg-mint/30 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{l.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {l.company} · {l.phone}
                      </p>
                    </div>
                    <StatusChip value={l.status} className="w-fit" />
                  </Link>
                )) : (
                  <p className="p-4 text-center text-sm text-muted-foreground">No leads owned.</p>
                )}
              </TabsContent>

              <TabsContent value="orders" className="m-0 space-y-2 outline-none text-left">
                {myOrders.length > 0 ? myOrders.map(o => (
                  <Link 
                    key={o.id} 
                    to="/orders/$id" 
                    params={{ id: o.id }}
                    className="flex flex-col gap-3 rounded-xl bg-white/55 p-3 transition-colors hover:bg-mint/30 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {o.invoiceNumber} · {o.customerName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {o.material} · {inr(o.value)} · {o.createdAt}
                      </p>
                    </div>
                    <StatusChip value={o.status} className="w-fit" />
                  </Link>
                )) : (
                  <p className="p-4 text-center text-sm text-muted-foreground">No orders handled.</p>
                )}
              </TabsContent>
            </Tabs>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
