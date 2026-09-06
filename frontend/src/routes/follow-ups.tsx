import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarPlus, CheckCircle2, Pencil, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/common/glass";
import { FollowUpFormDialogApi } from "@/components/common/followup-form-dialog-api";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { StatusChip } from "@/components/common/status-chip";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { getFollowUps, completeFollowUp, deleteFollowUp } from "@/api/followups";
import type { FollowUp } from "@/types";
import { toast } from "sonner";

export const Route = createFileRoute("/follow-ups")({
  head: () => ({ meta: [{ title: "Follow-ups · Saravana Traders CRM" }] }),
  component: FollowUpsPage,
});

type Filter = "Lead" | "Order";

function FollowUpsPage() {
  const user = useRequireAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>("Lead");
  const [editing, setEditing] = useState<FollowUp | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FollowUp | null>(null);

  const query = useQuery({
    queryKey: ["follow-ups"],
    queryFn: getFollowUps,
    enabled: Boolean(user),
  });

  const completeMutation = useMutation({
    mutationFn: completeFollowUp,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["follow-ups"] });
      toast.success("Follow-up completed");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Unable to complete follow-up"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFollowUp,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["follow-ups"] });
      setDeleteTarget(null);
      toast.success("Follow-up deleted");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Unable to delete follow-up"),
  });

  const rows = useMemo(
    () => (query.data ?? [])
      .filter((f) => f.relatedType === filter)
      .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)),
    [query.data, filter],
  );

  if (!user) return null;

  return (
    <AppShell>
      <div className="space-y-4">
        <PageHeader
          title="Follow-ups"
          subtitle="Track Lead and Order follow-ups separately"
          actions={
            <Button className="gap-2 rounded-xl" onClick={() => setEditing({} as FollowUp)}>
              <CalendarPlus className="size-4" /> Add Follow-up
            </Button>
          }
        />

        <div className="glass rounded-2xl p-3 sm:p-4">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
            <TabsList className="rounded-xl">
              <TabsTrigger value="Lead" className="rounded-lg">Lead Follow-ups</TabsTrigger>
              <TabsTrigger value="Order" className="rounded-lg">Order Follow-ups</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {query.isPending ? (
          <div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">Loading follow-ups...</div>
        ) : query.isError ? (
          <div className="glass rounded-2xl p-8 text-center text-sm text-destructive">Unable to load follow-ups.</div>
        ) : (
          <div className="glass overflow-hidden rounded-2xl p-3 sm:p-4">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-2">Title</th>
                    <th className="px-3 py-2">Related</th>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Time</th>
                    <th className="px-3 py-2">Priority</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((followUp) => (
                    <tr key={followUp.id} className="border-b border-border/50 hover:bg-mint/20">
                      <td className="px-3 py-3 font-medium">{followUp.title}</td>
                      <td className="px-3 py-3">{followUp.relatedName}</td>
                      <td className="px-3 py-3 whitespace-nowrap">{followUp.date}</td>
                      <td className="px-3 py-3 whitespace-nowrap">{followUp.time}</td>
                      <td className="px-3 py-3"><StatusChip value={followUp.priority} /></td>
                      <td className="px-3 py-3"><StatusChip value={followUp.status} /></td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          {followUp.status !== "Completed" && (
                            <Button variant="ghost" size="icon" title="Complete" onClick={() => completeMutation.mutate(followUp.id)}>
                              <CheckCircle2 className="size-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" title="Edit" onClick={() => setEditing(followUp)}>
                            <Pencil className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Delete" className="text-destructive" onClick={() => setDeleteTarget(followUp)}>
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr><td colSpan={7} className="px-3 py-10 text-center text-muted-foreground">No {filter.toLowerCase()} follow-ups found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <FollowUpFormDialogApi
          open={Boolean(editing)}
          onOpenChange={(open) => { if (!open) setEditing(null); }}
          existing={editing && editing.id ? editing : null}
        />

        <ConfirmDialog
          open={Boolean(deleteTarget)}
          onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
          title="Delete this follow-up?"
          description="This follow-up will be permanently removed."
          confirmLabel={deleteMutation.isPending ? "Deleting..." : "Delete follow-up"}
          destructive
          onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget.id); }}
        />
      </div>
    </AppShell>
  );
}
