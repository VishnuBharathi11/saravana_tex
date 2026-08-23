import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/common/glass";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { getEmployees } from "@/api/employees";
import { createCustomer, type CreateCustomerInput } from "@/api/customers";
import { toast } from "sonner";
import type { Customer } from "@/types";

export const Route = createFileRoute("/customers/new")({ head: () => ({ meta: [{ title: "New customer · Saravana Traders CRM" }] }), component: NewCustomer });
const STATUSES: Customer["status"][] = ["Active", "Dormant", "VIP"];
const UNITS = ["Tons", "Nos", "Bags", "Sheets", "Rolls", "Boxes"];
function NewCustomer() {
  const user = useRequireAuth(); const navigate = useNavigate(); const queryClient = useQueryClient();
  const employeesQuery = useQuery({ queryKey: ["employees"], queryFn: getEmployees, enabled: Boolean(user) });
  const [d, setD] = useState<Partial<CreateCustomerInput>>({ status: "Active", quantity: 1, units: UNITS[0] ?? "Tons" });
  const mutation = useMutation({ mutationFn: createCustomer, onSuccess: async (customer) => { queryClient.setQueryData(["customers", customer.id], customer); await queryClient.invalidateQueries({ queryKey: ["customers"] }); toast.success("Customer created"); navigate({ to: "/customers/$id", params: { id: customer.id } }); }, onError: (e) => toast.error(e instanceof Error ? e.message : "Unable to create customer") });
  if (!user) return null;
  const upd = (patch: Partial<CreateCustomerInput>) => setD((p) => ({ ...p, ...patch }));
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (!d.name?.trim() || !d.company?.trim() || !d.phone?.trim() || !d.email?.trim() || !d.address?.trim() || !d.material?.trim() || !d.units || !d.quantity || d.quantity <= 0 || !d.duration?.trim() || !d.source?.trim()) { toast.error("Complete all required customer fields"); return; } const nextStatus = d.status ?? "Active"; const nextUnits = d.units ?? "Tons"; mutation.mutate({ name: d.name.trim(), company: d.company.trim(), phone: d.phone.trim(), email: d.email.trim(), address: d.address.trim(), material: d.material.trim(), units: nextUnits, quantity: d.quantity, duration: d.duration.trim(), notes: d.notes?.trim() ?? "", status: nextStatus, source: d.source.trim(), feedback: d.feedback?.trim() ?? "", ...(user.role === "Admin" && d.employeeId ? { employeeId: d.employeeId } : {}) }); };
  const employees = employeesQuery.data ?? [];
  return <AppShell><div className="space-y-4"><Button variant="ghost" className="gap-2 pl-0" onClick={() => navigate({ to: "/customers" })}><ArrowLeft className="size-4" /> Back</Button><PageHeader title="Create customer" subtitle="Capture a new customer account" /><form className="glass rounded-2xl p-4" onSubmit={submit}><div className="grid gap-3 sm:grid-cols-2">{([ ["name","Name"],["company","Company"],["phone","Phone"],["email","Email"],["material","Preferred material"],["duration","Duration"],["source","Source"] ] as const).map(([key,label]) => <div key={key}><Label>{label}</Label><Input value={(d[key] as string) ?? ""} onChange={(e) => upd({ [key]: e.target.value } as Partial<CreateCustomerInput>)} className="glass-soft h-10 border-0" required /></div>)}<div><Label>Quantity</Label><Input type="number" min={1} value={d.quantity ?? ""} onChange={(e) => upd({ quantity: Number(e.target.value) })} className="glass-soft h-10 border-0" required /></div><div><Label>Units</Label><Select value={d.units ?? ""} onValueChange={(v) => upd({ units: v })}><SelectTrigger className="glass-soft h-10 w-full border-0"><SelectValue /></SelectTrigger><SelectContent>{UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select></div><div><Label>Status</Label><Select value={d.status ?? "Active"} onValueChange={(v) => upd({ status: v as Customer["status"] })}><SelectTrigger className="glass-soft h-10 w-full border-0"><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>{user.role === "Admin" && <div><Label>Assigned employee</Label><Select value={d.employeeId ?? ""} onValueChange={(v) => upd({ employeeId: v })}><SelectTrigger className="glass-soft h-10 w-full border-0"><SelectValue placeholder="Assign to employee" /></SelectTrigger><SelectContent>{employees.filter((e) => e.status === "Active").map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent></Select></div>}<div className="sm:col-span-2"><Label>Address</Label><Input value={d.address ?? ""} onChange={(e) => upd({ address: e.target.value })} className="glass-soft h-10 border-0" required /></div><div className="sm:col-span-2"><Label>Notes</Label><Textarea rows={3} value={d.notes ?? ""} onChange={(e) => upd({ notes: e.target.value })} className="glass-soft border-0" /></div><div className="sm:col-span-2"><Label>Feedback</Label><Textarea rows={3} value={d.feedback ?? ""} onChange={(e) => upd({ feedback: e.target.value })} className="glass-soft border-0" /></div></div><div className="mt-4"><Button type="submit" disabled={mutation.isPending} className="gap-2 rounded-xl"><Save className="size-4" /> {mutation.isPending ? "Saving..." : "Save customer"}</Button></div></form></div></AppShell>;
}
