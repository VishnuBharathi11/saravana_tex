import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { CalendarPlus, Check, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusChip } from "@/components/common/status-chip";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { FollowUpFormDialog, type FollowUpTarget } from "@/components/common/followup-form-dialog";
import { crm, useCrm } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { FollowUp } from "@/types";

function sortChrono(items: FollowUp[]) {
  return [...items].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
}

/**
 * Chronological follow-up timeline.
 * Desktop: left-to-right horizontal rail. Mobile: compact vertical agenda.
 */
export function FollowUpTimeline({
  items,
  target,
  title = "Follow-up history",
}: {
  items: FollowUp[];
  target: FollowUpTarget;
  title?: string;
}) {
  const { employees } = useCrm();
  const [detail, setDetail] = useState<FollowUp | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<FollowUp | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const navigate = useNavigate();

  const ordered = sortChrono(items);
  const nameOfEmployee = (id: string) => employees.find((e) => e.id === id)?.name ?? "Unassigned";
  const detailIndex = detail ? ordered.findIndex((f) => f.id === detail.id) : -1;
  const previous = detailIndex > 0 ? ordered[detailIndex - 1] : null;

  const Card = ({ f, horizontal }: { f: FollowUp; horizontal: boolean }) => (
    <button
      type="button"
      onClick={() => setDetail(f)}
      className={cn(
        "glass-soft rounded-2xl p-3 text-left transition-colors hover:bg-mint/25",
        horizontal ? "w-[210px] shrink-0" : "w-full",
      )}
    >
      <p className="text-[11px] text-muted-foreground">
        {f.date} · {f.time}
      </p>
      <p className="mt-0.5 truncate text-sm font-semibold">{f.title}</p>
      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
        {nameOfEmployee(f.employeeId)}
      </p>
      <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{f.description}</p>
      <StatusChip value={f.status} className="mt-1.5" />
    </button>
  );

  return (
    <div className="glass rounded-2xl p-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <p className="truncate text-sm font-semibold">{title}</p>
        <Button
          size="sm"
          variant="ghost"
          className="shrink-0 gap-1.5"
          onClick={() => {
            setEditing(null);
            setCreating(true);
          }}
        >
          <CalendarPlus className="size-4" /> Add
        </Button>
      </div>

      {ordered.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No follow-ups recorded yet.</p>
      ) : (
        <>
          {/* Desktop: horizontal chronological rail */}
          <div className="mt-3 hidden overflow-x-auto pb-2 md:block">
            <div className="flex items-stretch gap-2">
              {ordered.map((f, i) => (
                <div key={f.id} className="flex items-center gap-2">
                  <Card f={f} horizontal />
                  {i < ordered.length - 1 ? (
                    <ChevronRight className="size-4 shrink-0 text-primary/50" />
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          {/* Mobile: vertical agenda */}
          <div className="mt-3 space-y-2 border-l border-border pl-4 md:hidden">
            {ordered.map((f) => (
              <div key={f.id} className="relative">
                <span className="absolute top-4 -left-[22px] size-2.5 rounded-full bg-primary" />
                <Card f={f} horizontal={false} />
              </div>
            ))}
          </div>
        </>
      )}

      {/* Detail popup */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="w-[calc(100vw-32px)] max-h-[85vh] max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="text-left">{detail.title}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-2 sm:grid-cols-2">
                <Info label="Date" value={detail.date} />
                <Info label="Time" value={detail.time} />
                <Info label="Status" value={<StatusChip value={detail.status} />} />
                <Info label="Priority" value={<StatusChip value={detail.priority} />} />
                <Info
                  label="Assigned employee"
                  value={
                    <Link
                      to="/employees/$id"
                      params={{ id: detail.employeeId }}
                      className="text-sm font-medium text-primary"
                    >
                      {nameOfEmployee(detail.employeeId)}
                    </Link>
                  }
                />
                <Info label={detail.relatedType} value={detail.relatedName} />
                <div className="sm:col-span-2">
                  <Info label="Description" value={detail.description} />
                </div>
                <div className="sm:col-span-2">
                  <Info
                    label="Previous follow-up"
                    value={
                      previous
                        ? `${previous.title} · ${previous.date}`
                        : "This is the first follow-up."
                    }
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="glass-soft gap-1.5 rounded-xl border-0"
                  onClick={() => {
                    setEditing(detail);
                    setDetail(null);
                    setCreating(true);
                  }}
                >
                  <Pencil className="size-3.5" /> Edit
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5 rounded-xl"
                  disabled={detail.status === "Completed"}
                  onClick={() => {
                    crm.updateFollowUp(detail.id, { status: "Completed" });
                    toast.success("Follow-up marked as completed");
                    setDetail(null);
                  }}
                >
                  <Check className="size-3.5" /> Complete
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-xl"
                  onClick={() => {
                    const f = detail;
                    setDetail(null);
                    if (f.relatedType === "Lead")
                      navigate({ to: "/leads/$id", params: { id: f.relatedId } });
                    else navigate({ to: "/customers/$id", params: { id: f.relatedId } });
                  }}
                >
                  View {detail.relatedType}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1.5 rounded-xl text-destructive"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="size-3.5" /> Delete
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete follow-up?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (detail) crm.deleteFollowUp(detail.id);
          setConfirmDelete(false);
          setDetail(null);
          toast.success("Follow-up deleted");
        }}
      />

      <FollowUpFormDialog
        open={creating}
        onOpenChange={(o) => {
          setCreating(o);
          if (!o) setEditing(null);
        }}
        target={target}
        existing={editing}
      />
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white/55 px-3 py-2">
      <p className="text-[11px] tracking-wide text-muted-foreground uppercase">{label}</p>
      <div className="mt-0.5 text-sm font-medium break-words">{value}</div>
    </div>
  );
}
