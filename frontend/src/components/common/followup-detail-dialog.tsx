import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getFollowUps, completeFollowUp, deleteFollowUp } from "@/api/followups";
import { getEmployees } from "@/api/employees";
import { useRequireAuth } from "@/hooks/use-require-auth";
import type { FollowUp } from "@/types";
import { canEditRecord } from "@/lib/permissions";

export function FollowUpDetailDialog({ detail, onClose }: { detail: FollowUp | null; onClose: () => void }) {
  const user = useRequireAuth(); const queryClient = useQueryClient();
  const followUpsQuery = useQuery({ queryKey: ["follow-ups"], queryFn: getFollowUps, enabled: Boolean(user && detail) }); const employeesQuery = useQuery({ queryKey: ["employees"], queryFn: getEmployees, enabled: Boolean(user && detail) });
  const completeMutation = useMutation({ mutationFn: completeFollowUp, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["follow-ups"] }); toast.success("Follow-up marked completed"); onClose(); }, onError: (e) => toast.error(e instanceof Error ? e.message : "Unable to complete follow-up") });
  const deleteMutation = useMutation({ mutationFn: deleteFollowUp, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["follow-ups"] }); toast.success("Follow-up deleted"); onClose(); }, onError: (e) => toast.error(e instanceof Error ? e.message : "Unable to delete follow-up") });
  if (!detail || !user) return null; const employee = (employeesQuery.data ?? []).find((e) => e.id === detail.employeeId); const previous = (followUpsQuery.data ?? []).filter((f) => f.relatedId === detail.relatedId && f.id !== detail.id).slice(0, 3);
  return <Dialog open={!!detail} onOpenChange={(o) => !o && onClose()}><DialogContent className="max-w-lg bg-white"><DialogHeader><DialogTitle>{detail.title}</DialogTitle></DialogHeader><div className="space-y-2 text-sm"><p className="text-muted-foreground">{detail.description}</p><div className="grid grid-cols-2 gap-2">{[["Date", detail.date], ["Time", detail.time], ["Related", `${detail.relatedType}: ${detail.relatedName}`], ["Owner", employee?.name ?? "Unassigned"], ["Priority", detail.priority], ["Reminder", detail.reminder ? "On" : "Off"]].map(([k, v]) => <div key={k} className="rounded-lg border px-3 py-2"><p className="text-[11px] uppercase text-muted-foreground">{k}</p><p className="text-sm font-medium">{v}</p></div>)}</div><div className="rounded-lg border px-3 py-2"><p className="text-[11px] uppercase text-muted-foreground">Previous follow-ups</p>{previous.map((f) => <p key={f.id} className="mt-1 text-xs">{f.date} · {f.title} · {f.status}</p>)}</div>{canEditRecord(user, detail) && <div className="flex gap-2 pt-1"><Button className="rounded-xl" disabled={detail.status === "Completed" || completeMutation.isPending} onClick={() => completeMutation.mutate(detail.id)}>{completeMutation.isPending ? "Completing..." : "Mark completed"}</Button><Button variant="ghost" className="rounded-xl text-destructive" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(detail.id)}>{deleteMutation.isPending ? "Deleting..." : "Delete"}</Button></div>}</div></DialogContent></Dialog>;
}
