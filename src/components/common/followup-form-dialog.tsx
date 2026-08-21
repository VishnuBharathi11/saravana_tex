import { useEffect, useState } from "react";
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
import { crm, newId, useCrm } from "@/lib/store";
import { TODAY } from "@/data/mock";
import type { FollowUp, FollowUpStatus, Priority } from "@/types";

import { CustomerLeadSearch } from "./customer-lead-search";

const STATUSES: FollowUpStatus[] = [
  "Pending",
  "Completed",
  "Important",
  "Meeting",
  "Order",
  "Reminder",
];
const PRIORITIES: Priority[] = ["Low", "Medium", "High"];

export interface FollowUpTarget {
  id: string;
  name: string;
  type: "Lead" | "Customer";
}

/** Reusable create / edit follow-up dialog wired to shared state. */
export function FollowUpFormDialog({
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
  const { employees } = useCrm();
  const [selectedTarget, setSelectedTarget] = useState<FollowUpTarget | undefined>(target);
  
  useEffect(() => {
    if (open) {
      if (target) setSelectedTarget(target);
      else if (existing) {
        setSelectedTarget({
          id: existing.relatedId,
          name: existing.relatedName,
          type: existing.relatedType as "Lead" | "Customer",
        });
      } else {
        setSelectedTarget(undefined);
      }
    }
  }, [open, target, existing]);

  const [form, setForm] = useState<Omit<FollowUp, "id">>({
    title: "",
    description: "",
    date: TODAY,
    time: "10:00",
    status: "Pending",
    priority: "Medium",
    reminder: true,
    employeeId: employees[0]?.id ?? "",
    relatedName: target?.name ?? "",
    relatedType: target?.type ?? "Customer",
    relatedId: target?.id ?? "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      if (existing) {
        setForm(existing);
      } else {
        setForm({
          title: "",
          description: "",
          date: TODAY,
          time: "10:00",
          status: "Pending",
          priority: "Medium",
          reminder: true,
          employeeId: employees[0]?.id ?? "",
          relatedId: selectedTarget?.id || "",
          relatedName: selectedTarget?.name || "",
          relatedType: selectedTarget?.type || "Customer",
        });
      }
      setError("");
    }
  }, [open, existing, selectedTarget, employees]);

  const submit = () => {
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    const finalTarget = target || selectedTarget;
    if (!finalTarget) {
      setError("Customer or Lead must be selected");
      return;
    }

    const payload = {
      ...form,
      relatedId: finalTarget.id,
      relatedName: finalTarget.name,
      relatedType: finalTarget.type,
    };

    if (existing) {
      crm.updateFollowUp(existing.id, payload);
      toast.success("Follow-up updated");
    } else {
      crm.addFollowUp({ ...payload, id: newId("FU") });
      toast.success("Follow-up created");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-32px)] max-h-[85vh] max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit follow-up" : "Create follow-up"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>{target ? target.type : "Customer / Lead"}</Label>
            {target ? (
              <Input value={target.name} readOnly className="h-10 border-0 bg-white/60" />
            ) : (
              <CustomerLeadSearch
                value={selectedTarget?.id ?? null}
                onChange={(val, rec) => {
                  if (rec) {
                    setSelectedTarget({ id: rec.id, name: rec.name, type: rec.type });
                  } else {
                    setSelectedTarget(undefined);
                  }
                }}
                typeFilter="Both"
              />
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fu-date">Date (DD/MM/YYYY)</Label>
            <Input
              id="fu-date"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="h-10 border-0 bg-white/70"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fu-time">Time</Label>
            <Input
              id="fu-time"
              type="time"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
              className="h-10 border-0 bg-white/70"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="fu-title">Title</Label>
            <Input
              id="fu-title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Quotation follow-up"
              className="h-10 border-0 bg-white/70"
            />
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="fu-desc">Description</Label>
            <Textarea
              id="fu-desc"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="border-0 bg-white/70"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select
              value={form.status}
              onValueChange={(v) => setForm({ ...form, status: v as FollowUpStatus })}
            >
              <SelectTrigger className="h-10 w-full border-0 bg-white/70">
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
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Select
              value={form.priority}
              onValueChange={(v) => setForm({ ...form, priority: v as Priority })}
            >
              <SelectTrigger className="h-10 w-full border-0 bg-white/70">
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
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Assigned employee</Label>
            <Select
              value={form.employeeId}
              onValueChange={(v) => setForm({ ...form, employeeId: v })}
            >
              <SelectTrigger className="h-10 w-full border-0 bg-white/70">
                <SelectValue placeholder="Choose employee" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-white/55 px-3 py-2 sm:col-span-2">
            <Label htmlFor="fu-reminder">Reminder</Label>
            <Switch
              id="fu-reminder"
              checked={form.reminder}
              onCheckedChange={(v) => setForm({ ...form, reminder: v })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" className="rounded-xl" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="rounded-xl" onClick={submit}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
