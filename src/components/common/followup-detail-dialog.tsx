import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCrm, crm } from "@/lib/store";
import { employeeName } from "@/data/mock";
import type { FollowUp } from "@/types";
import { canEditRecord } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/store";

export function FollowUpDetailDialog({
  detail,
  onClose,
}: {
  detail: FollowUp | null;
  onClose: () => void;
}) {
  const { followUps } = useCrm();
  const user = getCurrentUser();

  if (!detail) return null;

  return (
    <Dialog open={!!detail} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg bg-white">
        <DialogHeader>
          <DialogTitle>{detail.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          <p className="text-muted-foreground">{detail.description}</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              ["Date", detail.date],
              ["Time", detail.time],
              ["Related", `${detail.relatedType}: ${detail.relatedName}`],
              ["Owner", employeeName(detail.employeeId)],
              ["Priority", detail.priority],
              ["Reminder", detail.reminder ? "On" : "Off"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg border px-3 py-2">
                <p className="text-[11px] uppercase text-muted-foreground">{k}</p>
                <p className="text-sm font-medium">{v}</p>
              </div>
            ))}
          </div>
          <div className="rounded-lg border px-3 py-2">
            <p className="text-[11px] uppercase text-muted-foreground">Previous follow-ups</p>
            {followUps
              .filter((f) => f.relatedId === detail.relatedId && f.id !== detail.id)
              .slice(0, 3)
              .map((f) => (
                <p key={f.id} className="mt-1 text-xs">
                  {f.date} · {f.title} · {f.status}
                </p>
              ))}
          </div>
          {canEditRecord(user, detail) && (
            <div className="flex gap-2 pt-1">
              <Button
                className="rounded-xl"
                onClick={() => {
                  crm.updateFollowUp(detail.id, { status: "Completed" });
                  toast.success("Follow-up marked completed");
                  onClose();
                }}
              >
                Mark completed
              </Button>
              <Button
                variant="ghost"
                className="rounded-xl text-destructive"
                onClick={() => {
                  crm.deleteFollowUp(detail.id);
                  onClose();
                  toast.error("Follow-up deleted");
                }}
              >
                Delete
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
