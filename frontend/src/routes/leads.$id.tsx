import { useState } from "react";
import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, PencilLine, Save, Trash2, UserCheck, X } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { IdentityHeader } from "@/components/common/identity-header";
import { CopyField } from "@/components/common/copy-field";
import { EmployeeLink } from "@/components/common/employee-link";
import { FollowUpTimeline } from "@/components/common/followup-timeline";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
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
import { toast } from "sonner";
import type { Lead, LeadStatus } from "@/types";
import { getFollowUps } from "@/api/followups";
import { canEditRecord, canDeleteRecord } from "@/lib/permissions";
import {
  convertLead,
  deleteLead,
  getLead,
  updateLead,
  type UpdateLeadInput,
} from "@/api/leads";

export const Route = createFileRoute("/leads/$id")({
  head: () => ({
    meta: [
      { title: "Lead details · Saravana Traders CRM" },
      { name: "description", content: "Lead profile, timeline, follow-up history and notes." },
      { property: "og:title", content: "Lead details · Saravana Traders CRM" },
      {
        property: "og:description",
        content: "Enquiry profile with timeline and follow-up history.",
      },
    ],
  }),
  component: LeadDetail,
});

const STATUSES: LeadStatus[] = [
  "New",
  "Contacted",
  "Interested",
  "Negotiation",
  "Converted",
  "Lost",
];
const UNITS = ["Tons", "Nos", "Bags", "Sheets", "Rolls", "Boxes"];
const DURATIONS = ["Immediate", "1 Week", "2 Weeks", "1 Month", "Quarterly"];

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-white/55 px-3 py-2.5">
      <p className="text-[11px] tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-0.5 text-sm font-medium break-words">{value || "—"}</p>
    </div>
  );
}

function LeadDetail() {
  const user = useRequireAuth();
  const { id } = useParams({ from: "/leads/$id" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const leadQuery = useQuery({
    queryKey: ["leads", id],
    queryFn: () => getLead(id),
    enabled: Boolean(user && id),
  });
  const followUpsQuery = useQuery({
    queryKey: ["follow-ups"],
    queryFn: getFollowUps,
    enabled: Boolean(user),
  });

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Lead | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmConvert, setConfirmConvert] = useState(false);

  const updateMutation = useMutation({
    mutationFn: (patch: UpdateLeadInput) => updateLead(id, patch),
    onSuccess: async (updated) => {
      queryClient.setQueryData(["leads", id], updated);
      queryClient.setQueryData<Lead[]>(["leads"], (current) =>
        current?.map((lead) => (lead.id === updated.id ? updated : lead)) ?? current,
      );
      await queryClient.invalidateQueries({ queryKey: ["leads"] });
      setEditing(false);
      setDraft(null);
      toast.success("Lead updated");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to update lead");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteLead(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.removeQueries({ queryKey: ["leads", id] });
      toast.success("Lead deleted");
      navigate({ to: "/leads" });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to delete lead");
    },
  });

  const convertMutation = useMutation({
    mutationFn: () => convertLead(id),
    onSuccess: async (response) => {
      const customerId = response.data?.customerId ?? response.customerId;
      await queryClient.invalidateQueries({ queryKey: ["leads"] });
      if (customerId) {
        queryClient.setQueryData<Lead>(["leads", id], (current) =>
          current ? { ...current, status: "Converted", convertedCustomerId: customerId } : current,
        );
      }
      setConfirmConvert(false);
      if (customerId) {
        toast.success("Lead converted to customer");
        navigate({ to: "/customers/$id", params: { id: customerId } });
      } else {
        toast.success("Lead is already converted");
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to convert lead");
    },
  });

  if (!user) return null;

  if (leadQuery.isPending) {
    return (
      <AppShell>
        <div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">Loading lead...</div>
      </AppShell>
    );
  }

  if (leadQuery.isError || !leadQuery.data) {
    return (
      <AppShell>
        <div className="glass rounded-2xl p-8 text-center">
          <p className="font-medium">Unable to load this lead</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {leadQuery.error instanceof Error ? leadQuery.error.message : "This lead no longer exists."}
          </p>
          <Link to="/leads" className="mt-3 inline-block text-sm font-medium text-primary">Back to leads</Link>
        </div>
      </AppShell>
    );
  }

  const lead = leadQuery.data;
  const history = (followUpsQuery.data ?? []).filter((followUp) => followUp.relatedId === lead.id);
  const d = draft ?? lead;
  const upd = (patch: Partial<Lead>) => setDraft({ ...d, ...patch });

  const save = () => {
    if (!d.name.trim() || !d.company.trim()) {
      toast.error("Name and company are required");
      return;
    }

    updateMutation.mutate({
      name: d.name,
      company: d.company,
      phone: d.phone,
      email: d.email,
      address: d.address,
      material: d.material,
      units: d.units,
      quantity: d.quantity,
      duration: d.duration,
      notes: d.notes,
      status: d.status,
      source: d.source,
      feedback: d.feedback,
    });
  };

  return (
    <AppShell>
      <div className="space-y-4">
        <Button variant="ghost" className="gap-2 pl-0" onClick={() => navigate({ to: "/leads" })}>
          <ArrowLeft className="size-4" /> Back
        </Button>

        <IdentityHeader
          name={lead.name}
          company={lead.company}
          phone={lead.phone}
          email={lead.email}
          meta={`${lead.source} · created ${lead.createdAt}`}
          actions={
            editing ? (
              <>
                <Button className="gap-2 rounded-xl" onClick={save} disabled={updateMutation.isPending}>
                  <Save className="size-4" /> {updateMutation.isPending ? "Saving..." : "Save"}
                </Button>
                <Button
                  variant="ghost"
                  className="gap-2 rounded-xl"
                  onClick={() => { setEditing(false); setDraft(null); }}
                  disabled={updateMutation.isPending}
                >
                  <X className="size-4" /> Cancel
                </Button>
              </>
            ) : canEditRecord(user, lead) ? (
              <>
                <Button
                  variant="outline"
                  className="glass-soft gap-2 rounded-xl border-0"
                  onClick={() => { setDraft(lead); setEditing(true); }}
                >
                  <PencilLine className="size-4" /> Edit
                </Button>
                <Button
                  className="gap-2 rounded-xl"
                  disabled={!!lead.convertedCustomerId || convertMutation.isPending}
                  onClick={() => setConfirmConvert(true)}
                >
                  <UserCheck className="size-4" />
                  {lead.convertedCustomerId ? "Converted" : convertMutation.isPending ? "Converting..." : "Convert to Customer"}
                </Button>
                {canDeleteRecord(user, lead) && (
                  <Button
                    variant="ghost"
                    className="gap-2 rounded-xl text-destructive"
                    onClick={() => setConfirmDelete(true)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </>
            ) : null
          }
        />

        <div className="grid gap-3 lg:grid-cols-3">
          <div className="glass rounded-2xl p-4 lg:col-span-2">
            <p className="text-sm font-semibold">Basic information</p>

            {editing ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ["name", "Name"],
                    ["company", "Company"],
                    ["phone", "Phone"],
                    ["email", "Email"],
                    ["material", "Material required"],
                    ["source", "Source"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key} className="space-y-1.5">
                    <Label htmlFor={key}>{label}</Label>
                    <Input
                      id={key}
                      value={d[key]}
                      onChange={(e) => upd({ [key]: e.target.value } as Partial<Lead>)}
                      className="h-10 border-0 bg-white/70"
                    />
                  </div>
                ))}

                <div className="space-y-1.5">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min={1}
                    value={d.quantity}
                    onChange={(e) => upd({ quantity: Number(e.target.value) })}
                    className="h-10 border-0 bg-white/70"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Units</Label>
                  <Select value={d.units} onValueChange={(v) => upd({ units: v })}>
                    <SelectTrigger className="h-10 w-full border-0 bg-white/70"><SelectValue /></SelectTrigger>
                    <SelectContent>{UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Duration</Label>
                  <Select value={d.duration} onValueChange={(v) => upd({ duration: v })}>
                    <SelectTrigger className="h-10 w-full border-0 bg-white/70"><SelectValue /></SelectTrigger>
                    <SelectContent>{DURATIONS.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={d.status} onValueChange={(v) => upd({ status: v as LeadStatus })}>
                    <SelectTrigger className="h-10 w-full border-0 bg-white/70"><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" value={d.address} onChange={(e) => upd({ address: e.target.value })} className="h-10 border-0 bg-white/70" />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="feedback">Feedback</Label>
                  <Textarea id="feedback" rows={3} value={d.feedback} onChange={(e) => upd({ feedback: e.target.value })} className="border-0 bg-white/70" />
                </div>
              </div>
            ) : (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <CopyField kind="phone" label="Phone" value={lead.phone} />
                <CopyField kind="email" label="Email" value={lead.email} />
                <Field label="Company" value={lead.company} />
                <Field label="Source" value={lead.source} />
                <Field label="Material required" value={lead.material} />
                <Field label="Quantity" value={`${lead.quantity} ${lead.units}`} />
                <Field label="Duration" value={lead.duration} />
                <EmployeeLink employeeId={lead.employeeId} />
                <div className="sm:col-span-2"><Field label="Address" value={lead.address} /></div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="glass rounded-2xl p-4">
              <p className="text-sm font-semibold">Feedback</p>
              <p className="mt-2 rounded-xl bg-white/55 px-3 py-2.5 text-sm">{lead.feedback || "No feedback captured yet."}</p>
            </div>

            {lead.convertedCustomerId ? (
              <div className="glass rounded-2xl p-4">
                <p className="text-sm font-semibold">Customer account</p>
                <Link to="/customers/$id" params={{ id: lead.convertedCustomerId }} className="mt-2 inline-block text-sm font-medium text-primary">Open converted customer →</Link>
              </div>
            ) : null}

            <div className="glass rounded-2xl p-4">
              <p className="text-sm font-semibold">Notes</p>
              {editing ? (
                <Textarea className="mt-2 border-0 bg-white/70" rows={4} value={d.notes} onChange={(e) => upd({ notes: e.target.value })} placeholder="Enter notes..." />
              ) : (
                <p className="mt-2 rounded-xl bg-white/55 px-3 py-2.5 text-sm whitespace-pre-wrap">{lead.notes || "No notes added."}</p>
              )}
            </div>
          </div>
        </div>

        <FollowUpTimeline items={history} target={{ id: lead.id, name: lead.name, type: "Lead" }} />
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete ${lead.name}?`}
        description="This lead and its follow-ups will be permanently removed."
        confirmLabel="Delete lead"
        destructive
        onConfirm={() => deleteMutation.mutate()}
      />

      <ConfirmDialog
        open={confirmConvert}
        onOpenChange={setConfirmConvert}
        title={`Convert ${lead.name} to a customer?`}
        description="Follow-up history, assigned employee and enquiry details are preserved on the new customer record."
        confirmLabel="Convert"
        onConfirm={() => convertMutation.mutate()}
      />
    </AppShell>
  );
}
