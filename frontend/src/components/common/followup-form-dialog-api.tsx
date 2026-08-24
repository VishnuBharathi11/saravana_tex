import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { getEmployees } from "@/api/employees";
import { createFollowUp, updateFollowUp, type CreateFollowUpInput } from "@/api/followups";
import { getCustomers } from "@/api/customers";
import { getLeads } from "@/api/leads";
import { getOrders } from "@/api/orders";
import type { Customer, FollowUp, FollowUpStatus, Lead, Order, Priority } from "@/types";

const STATUSES: FollowUpStatus[] = [
  "Pending",
  "Completed",
  "Important",
  "Meeting",
  "Order",
  "Reminder",
  "Missed",
];
const PRIORITIES: Priority[] = ["Low", "Medium", "High"];
export interface FollowUpTarget {
  id: string;
  name: string;
  type: "Lead" | "Customer" | "Order";
}

type FollowUpFormState = {
  title: string;
  description: string;
  date: string;
  time: string;
  status: FollowUpStatus;
  priority: Priority;
  reminder: boolean;
  employeeId?: string;
  relatedType: "Lead" | "Customer" | "Order";
  relatedId: string;
};
export function FollowUpFormDialogApi({
  open,
  onOpenChange,
  target,
  existing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target?: FollowUpTarget;
  existing?: FollowUp | null;
}) {
  const user = useRequireAuth();
  const queryClient = useQueryClient();
  const employeesQuery = useQuery({
    queryKey: ["employees"],
    queryFn: getEmployees,
    enabled: Boolean(user),
  });
  const customersQuery = useQuery({
    queryKey: ["customers"],
    queryFn: getCustomers,
    enabled: Boolean(user && !target && !existing),
  });
  const leadsQuery = useQuery({
    queryKey: ["leads"],
    queryFn: getLeads,
    enabled: Boolean(user && !target && !existing),
  });
  const ordersQuery = useQuery({
    queryKey: ["orders"],
    queryFn: getOrders,
    enabled: Boolean(user && !target && !existing),
  });
  const employees = employeesQuery.data ?? [];
  const [selected, setSelected] = useState<FollowUpTarget | undefined>(target);
  const [form, setForm] = useState<FollowUpFormState>({
    title: "",
    description: "",
    date: new Date().toISOString().slice(0, 10),
    time: "10:00",
    status: "Pending",
    priority: "Medium",
    reminder: false,
    relatedType: target?.type ?? "Customer",
    relatedId: target?.id ?? "",
  });
  useEffect(() => {
    if (!open) return;
    if (existing) {
      setSelected({
        id: existing.relatedId,
        name: existing.relatedName,
        type: existing.relatedType,
      });
      setForm({
        title: existing.title,
        description: existing.description,
        date: existing.date,
        time: existing.time,
        status: existing.status,
        priority: existing.priority,
        reminder: existing.reminder,
        ...(existing.employeeId ? { employeeId: existing.employeeId } : {}),
        relatedType: existing.relatedType,
        relatedId: existing.relatedId,
      });
    } else {
      setSelected(target);
      const defaultEmployeeId = user?.id ?? employees[0]?.id;
      setForm({
        title: "",
        description: "",
        date: new Date().toISOString().slice(0, 10),
        time: "10:00",
        status: "Pending",
        priority: "Medium",
        reminder: false,
        ...(defaultEmployeeId ? { employeeId: defaultEmployeeId } : {}),
        relatedType: target?.type ?? "Customer",
        relatedId: target?.id ?? "",
      });
    }
  }, [open, existing, target, user?.id, employees]);
  const mutation = useMutation({
    mutationFn: async () => {
      if (!selected) throw new Error("Customer, Lead, or Order must be selected");
      const payload: CreateFollowUpInput = {
        ...form,
        relatedType: selected.type,
        relatedId: selected.id,
      };
      if (existing) {
        const { employeeId: _employeeId, ...editablePayload } = payload;
        return updateFollowUp(existing.id, editablePayload);
      }
      return createFollowUp(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["follow-ups"] });
      toast.success(existing ? "Follow-up updated" : "Follow-up created");
      onOpenChange(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Unable to save follow-up"),
  });
  const records: FollowUpTarget[] = [
    ...(customersQuery.data ?? []).map((c: Customer) => ({
      id: c.id,
      name: c.name,
      type: "Customer" as const,
    })),
    ...(leadsQuery.data ?? []).map((l: Lead) => ({
      id: l.id,
      name: l.name,
      type: "Lead" as const,
    })),
    ...(ordersQuery.data ?? []).map((o: Order) => ({
      id: o.id,
      name: o.invoiceNumber,
      type: "Order" as const,
    })),
  ];
  if (!user) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-32px)] max-h-[85vh] max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit follow-up" : "Create follow-up"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Customer / Lead / Order</Label>
            {target ? (
              <Input value={target.name} readOnly className="h-10 border-0 bg-white/60" />
            ) : existing ? (
              <Input value={existing.relatedName} readOnly className="h-10 border-0 bg-white/60" />
            ) : (
              <Select
                value={selected ? `${selected.type}:${selected.id}` : ""}
                onValueChange={(v) => setSelected(records.find((x) => `${x.type}:${x.id}` === v))}
              >
                <SelectTrigger className="h-10 border-0 bg-white/70">
                  <SelectValue placeholder="Choose customer, lead, or order" />
                </SelectTrigger>
                <SelectContent>
                  {records.map((r) => (
                    <SelectItem key={`${r.type}:${r.id}`} value={`${r.type}:${r.id}`}>
                      {r.name} · {r.type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div>
            <Label>Date</Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="h-10 border-0 bg-white/70"
            />
          </div>
          <div>
            <Label>Time</Label>
            <Input
              type="time"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
              className="h-10 border-0 bg-white/70"
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Title</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="h-10 border-0 bg-white/70"
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Description</Label>
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="border-0 bg-white/70"
            />
          </div>
          <div>
            <Label>Type</Label>
            <Select
              value={form.status}
              onValueChange={(v) => setForm({ ...form, status: v as FollowUpStatus })}
            >
              <SelectTrigger className="h-10 border-0 bg-white/70">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Priority</Label>
            <Select
              value={form.priority}
              onValueChange={(v) => setForm({ ...form, priority: v as Priority })}
            >
              <SelectTrigger className="h-10 border-0 bg-white/70">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label>Assigned employee</Label>
            <Select
              value={form.employeeId ?? ""}
              disabled={Boolean(existing)}
              onValueChange={(v) => setForm({ ...form, employeeId: v })}
            >
              <SelectTrigger className="h-10 border-0 bg-white/70">
                <SelectValue placeholder="Choose employee" />
              </SelectTrigger>
              <SelectContent>
                {employees
                  .filter((e) => e.status === "Active")
                  .map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {existing && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                Assignment is controlled by the backend and is not editable here.
              </p>
            )}
          </div>
          <div className="flex items-center justify-between rounded-xl bg-white/55 px-3 py-2 sm:col-span-2">
            <Label>Reminder</Label>
            <Switch
              checked={form.reminder ?? false}
              onCheckedChange={(v) => setForm({ ...form, reminder: v })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !form.title.trim() || !selected}
          >
            {mutation.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
