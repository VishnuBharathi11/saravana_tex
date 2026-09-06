import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CalendarPlus, Save } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/common/glass";
import { CustomerLeadSearch } from "@/components/common/customer-lead-search";
import { FollowUpFormDialogApi } from "@/components/common/followup-form-dialog-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { getEmployees } from "@/api/employees";
import { createLead, type CreateLeadInput } from "@/api/leads";
import type { Lead } from "@/types";
import { toast } from "sonner";

export const Route = createFileRoute("/leads/new")({
  head: () => ({
    meta: [
      { title: "New lead · Saravana Traders CRM" },
      { name: "description", content: "Capture a new enquiry or link it to an existing customer." },
      { property: "og:title", content: "New lead · Saravana Traders CRM" },
      { property: "og:description", content: "Enquiry capture form for the sales team." },
    ],
  }),
  component: NewLead,
});

const DURATIONS = ["Immediate", "1 Week", "2 Weeks", "1 Month", "Quarterly"];

const initialForm: CreateLeadInput = {
  name: "",
  company: "",
  phone: "",
  email: "",
  address: "",
  // Kept in the API payload for backward compatibility with the existing schema.
  // These fields are intentionally no longer exposed in the Lead UI.
  material: "Not specified",
  units: "N/A",
  quantity: 1,
  duration: "",
  notes: "",
  status: "New",
  source: "Other",
  feedback: "",
};

function NewLead() {
  const user = useRequireAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const employeesQuery = useQuery({
    queryKey: ["employees"],
    queryFn: getEmployees,
    enabled: Boolean(user),
  });
  const employees = employeesQuery.data ?? [];
  const [form, setForm] = useState<CreateLeadInput>(initialForm);
  const [createdLead, setCreatedLead] = useState<Lead | null>(null);
  const [followUpOpen, setFollowUpOpen] = useState(false);

  const createMutation = useMutation({
    mutationFn: createLead,
    onSuccess: async (lead) => {
      queryClient.setQueryData<Lead[]>(["leads"], (current) =>
        current ? [lead, ...current] : current,
      );
      await queryClient.invalidateQueries({ queryKey: ["leads"] });
      setCreatedLead(lead);
      toast.success("Lead saved successfully");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to save lead");
    },
  });

  if (!user) return null;

  const setField = <K extends keyof CreateLeadInput>(
    key: K,
    value: CreateLeadInput[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (createdLead) setCreatedLead(null);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();

    if (
      !form.name.trim() ||
      !form.company.trim() ||
      !form.address.trim() ||
      !form.duration
    ) {
      toast.error("Complete all required lead fields");
      return;
    }

    createMutation.mutate({
      ...form,
      name: form.name.trim(),
      company: form.company.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      duration: form.duration.trim(),
      notes: form.notes?.trim() ?? "",
      // The current backend schema still requires these legacy Lead fields.
      // They are no longer part of the client-facing Lead form.
      material: "Not specified",
      units: "N/A",
      quantity: 1,
      source: "Other",
      feedback: form.feedback?.trim() ?? "",
      ...(user.role === "Admin" && form.employeeId
        ? { employeeId: form.employeeId }
        : {}),
    });
  };

  return (
    <AppShell>
      <div className="space-y-4">
        <Button
          variant="ghost"
          className="gap-2 pl-0"
          onClick={() => navigate({ to: "/leads" })}
        >
          <ArrowLeft className="size-4" /> Back
        </Button>

        <PageHeader
          title="Create lead"
          subtitle="Search an existing customer or capture a fresh enquiry"
        />

        <div className="glass rounded-2xl p-4">
          <Label>Search existing customer</Label>
          <div className="mt-1.5">
            <CustomerLeadSearch
              value={null}
              onChange={(id) => {
                if (id) navigate({ to: "/customers/$id", params: { id } });
              }}
              typeFilter="Customer"
              placeholder="Type a customer or company name…"
            />
          </div>
        </div>

        <form className="glass rounded-2xl p-4" onSubmit={submit}>
          <p className="text-sm font-semibold">New lead details</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {[
              { id: "name", label: "Name", ph: "Contact person", key: "name" as const },
              { id: "company", label: "Company", ph: "Company name", key: "company" as const },
              { id: "phone", label: "Phone", ph: "+91 …", key: "phone" as const },
              { id: "email", label: "Email", ph: "name@company.in", key: "email" as const },
            ].map((field) => (
              <div key={field.id} className="space-y-1.5">
                <Label htmlFor={field.id}>{field.label}</Label>
                <Input
                  id={field.id}
                  placeholder={field.ph}
                  value={form[field.key]}
                  onChange={(e) => setField(field.key, e.target.value)}
                  className="glass-soft h-10 border-0"
                  required={field.key !== "phone"}
                />
              </div>
            ))}

            <div className="space-y-1.5">
              <Label>Duration</Label>
              <Select
                value={form.duration}
                onValueChange={(value) => setField("duration", value)}
              >
                <SelectTrigger className="glass-soft h-10 w-full border-0">
                  <SelectValue placeholder="Requirement window" />
                </SelectTrigger>
                <SelectContent>
                  {DURATIONS.map((duration) => (
                    <SelectItem key={duration} value={duration}>
                      {duration}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {user.role === "Admin" && (
              <div className="space-y-1.5">
                <Label>Assigned employee</Label>
                <Select
                  value={form.employeeId ?? ""}
                  onValueChange={(value) => setField("employeeId", value)}
                >
                  <SelectTrigger className="glass-soft h-10 w-full border-0">
                    <SelectValue placeholder="Assign to employee" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {employees
                      .filter((employee) => employee.status === "Active")
                      .map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="Street, city, state"
                value={form.address}
                onChange={(e) => setField("address", e.target.value)}
                className="glass-soft h-10 border-0"
                required
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                rows={3}
                value={form.notes ?? ""}
                onChange={(e) => setField("notes", e.target.value)}
                placeholder="Requirement details, pricing expectations…"
                className="glass-soft border-0"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="gap-2 rounded-xl"
            >
              <Save className="size-4" />
              {createMutation.isPending ? "Saving..." : "Save lead"}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="glass-soft gap-2 rounded-xl border-0"
              disabled={!createdLead}
              onClick={() => setFollowUpOpen(true)}
            >
              <CalendarPlus className="size-4" />
              Follow-up
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="rounded-xl"
              onClick={() => navigate({ to: "/leads" })}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>

      {createdLead && (
        <FollowUpFormDialogApi
          open={followUpOpen}
          onOpenChange={setFollowUpOpen}
          target={{
            id: createdLead.id,
            name: createdLead.name,
            type: "Lead",
          }}
        />
      )}
    </AppShell>
  );
}
