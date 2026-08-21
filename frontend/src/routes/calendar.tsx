import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { AlertTriangle, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/common/glass";
import { StatusChip } from "@/components/common/status-chip";
import { FollowUpFormDialog } from "@/components/common/followup-form-dialog";
import { FollowUpDetailDialog } from "@/components/common/followup-detail-dialog";
import { CustomerLeadSearch } from "@/components/common/customer-lead-search";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { TODAY, customers, employeeName, employees, leads } from "@/data/mock";
import { useCrm } from "@/lib/store";
import { canEditRecord } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { FollowUp } from "@/types";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar · Saravana Traders CRM" },
      {
        name: "description",
        content: "Daily, weekly and monthly follow-up scheduling with colour coded categories.",
      },
      { property: "og:title", content: "Calendar · Saravana Traders CRM" },
      { property: "og:description", content: "Colour coded follow-up and meeting scheduler." },
    ],
  }),
  component: CalendarPage,
});

const EVENT_COLORS: Record<string, string> = {
  Pending: "bg-sunbeam/35 text-[oklch(0.42_0.09_60)] border-sunbeam/60",
  Completed: "bg-mint/60 text-[oklch(0.36_0.07_170)] border-primary/40",
  Important: "bg-blush/30 text-[oklch(0.42_0.1_350)] border-blush/60",
  Meeting: "bg-lilac/25 text-[oklch(0.42_0.1_300)] border-lilac/55",
  Order: "bg-teal/25 text-[oklch(0.38_0.08_200)] border-teal/55",
  Reminder: "bg-sky/25 text-[oklch(0.4_0.09_245)] border-sky/55",
};

type View = "Daily" | "Weekly" | "Monthly" | "Today";

function AddFollowUpDialog() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button className="gap-2 rounded-xl" onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Add Follow-up
      </Button>
      <FollowUpFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

function EventChip({ f, onClick, isOwn }: { f: FollowUp; onClick: () => void; isOwn?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full truncate rounded-md border px-1.5 py-1 text-left text-[11px] font-medium transition-transform hover:-translate-y-0.5",
        EVENT_COLORS[f.status],
      )}
    >
      {isOwn && "★ "}{f.time} {f.title}
    </button>
  );
}

function CalendarPage() {
  const user = useRequireAuth();
  const [view, setView] = useState<View>("Monthly");
  const [cursor, setCursor] = useState(parseISO(TODAY));
  const [selectedDay, setSelectedDay] = useState(parseISO(TODAY));
  const [detail, setDetail] = useState<FollowUp | null>(null);
  const [mobileTab, setMobileTab] = useState<"Upcoming" | "Pending">("Upcoming");

  const { followUps } = useCrm();
  const events = followUps;

  const eventsOn = (d: Date) => events.filter((f) => isSameDay(parseISO(f.date), d));

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    const out: Date[] = [];
    for (let d = start; d <= end; d = addDays(d, 1)) out.push(d);
    return out;
  }, [cursor]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDay, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selectedDay]);

  // Missed follow-up rollover: anything pending before today shows up as tomorrow's pending work.
  const missed = events.filter((f) => f.date < TODAY && f.status === "Pending").slice(0, 6);
  const upcoming = events
    .filter((f) => f.date >= TODAY)
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
    .slice(0, 8);

  if (!user) return null;

  return (
    <AppShell plain>
      <div className="space-y-4">
        <PageHeader
          title="Calendar"
          subtitle="Follow-ups, meetings and reminders across your pipeline"
          actions={<AddFollowUpDialog />}
        />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
              <div className="flex min-w-0 items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setCursor(subMonths(cursor, 1))}>
                  <ChevronLeft className="size-4" />
                </Button>
                <p className="truncate font-display text-lg font-bold">
                  {format(cursor, "MMMM yyyy")}
                </p>
                <Button variant="ghost" size="icon" onClick={() => setCursor(addMonths(cursor, 1))}>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
              <Tabs value={view} onValueChange={(v) => setView(v as View)}>
                <TabsList className="rounded-xl">
                  {(["Daily", "Weekly", "Monthly", "Today"] as View[]).map((v) => (
                    <TabsTrigger key={v} value={v} className="rounded-lg text-xs">
                      {v}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            {view === "Monthly" && (
              <div className="mt-4 grid grid-cols-7 gap-1.5">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <p
                    key={d}
                    className="pb-1 text-center text-[11px] font-semibold text-muted-foreground"
                  >
                    {d}
                  </p>
                ))}
                {monthDays.map((d) => {
                  const dayEvents = eventsOn(d);
                  return (
                    <div
                      key={d.toISOString()}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedDay(d)}
                      onKeyDown={(e) => e.key === "Enter" && setSelectedDay(d)}
                      className={cn(
                        "min-h-[92px] cursor-pointer rounded-xl border border-border/70 p-1.5 text-left align-top transition-colors hover:bg-mint/20",
                        !isSameMonth(d, cursor) && "opacity-45",
                        isSameDay(d, parseISO(TODAY)) && "border-primary/60 bg-mint/25",
                        isSameDay(d, selectedDay) && "ring-2 ring-primary/40",
                      )}
                    >
                      <span className="text-xs font-semibold">{format(d, "d")}</span>
                      <div className="mt-1 space-y-1">
                        {dayEvents.slice(0, 2).map((f) => (
                          <EventChip key={f.id} f={f} onClick={() => setDetail(f)} isOwn={f.employeeId === user.id} />
                        ))}
                        {dayEvents.length > 2 && (
                          <span className="block text-[10px] text-muted-foreground">
                            +{dayEvents.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {view === "Weekly" && (
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-7">
                {weekDays.map((d) => (
                  <div key={d.toISOString()} className="rounded-xl border border-border/70 p-2">
                    <p className="text-xs font-semibold">{format(d, "EEE d")}</p>
                    <div className="mt-1.5 space-y-1">
                      {eventsOn(d).map((f) => (
                        <EventChip key={f.id} f={f} onClick={() => setDetail(f)} isOwn={f.employeeId === user.id} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(view === "Daily" || view === "Today") && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-semibold">
                  {format(view === "Today" ? parseISO(TODAY) : selectedDay, "EEEE, d MMMM yyyy")}
                </p>
                {eventsOn(view === "Today" ? parseISO(TODAY) : selectedDay).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setDetail(f)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left",
                      EVENT_COLORS[f.status],
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{f.employeeId === user.id && "★ "}{f.title}</span>
                      <span className="block truncate text-xs opacity-80">
                        {f.time} · {f.relatedName} · {employeeName(f.employeeId)}
                      </span>
                    </span>
                    <StatusChip value={f.priority} />
                  </button>
                ))}
                {eventsOn(view === "Today" ? parseISO(TODAY) : selectedDay).length === 0 && (
                  <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                    Nothing scheduled for this day.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="hidden rounded-2xl border border-border bg-white p-3 shadow-sm md:block">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{format(cursor, "MMM yyyy")}</p>
                <div className="flex">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => setCursor(subMonths(cursor, 1))}
                  >
                    <ChevronLeft className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => setCursor(addMonths(cursor, 1))}
                  >
                    <ChevronRight className="size-3.5" />
                  </Button>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-7 gap-1 text-center">
                {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                  <span key={i} className="text-[10px] text-muted-foreground">
                    {d}
                  </span>
                ))}
                {monthDays.map((d) => (
                  <button
                    key={d.toISOString()}
                    onClick={() => setSelectedDay(d)}
                    className={cn(
                      "relative rounded-md py-1 text-xs hover:bg-mint/30",
                      !isSameMonth(d, cursor) && "text-muted-foreground/50",
                      isSameDay(d, selectedDay) &&
                        "bg-primary font-semibold text-primary-foreground",
                    )}
                  >
                    {format(d, "d")}
                    {eventsOn(d).length > 0 && !isSameDay(d, selectedDay) && (
                      <span className="absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-teal" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:hidden">
              <div className="mb-1 flex items-center gap-1 rounded-full bg-white/55 p-1 glass-soft">
                <button
                  onClick={() => setMobileTab("Upcoming")}
                  className={cn(
                    "flex-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                    mobileTab === "Upcoming"
                      ? "bg-mint/40 text-teal"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Upcoming
                </button>
                <button
                  onClick={() => setMobileTab("Pending")}
                  className={cn(
                    "flex-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                    mobileTab === "Pending"
                      ? "bg-mint/40 text-teal"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Pending
                </button>
              </div>
            </div>

            <div
              className={cn(
                "rounded-2xl border border-border bg-white p-3 shadow-sm",
                mobileTab === "Upcoming" ? "block" : "hidden md:block",
              )}
            >
              <p className="text-sm font-semibold">Upcoming follow-ups</p>
              <div className="mt-2 space-y-1.5">
                {upcoming.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setDetail(f)}
                    className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-muted"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-medium">{f.employeeId === user.id && "★ "}{f.title}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {f.date} · {f.relatedName}
                      </span>
                    </span>
                    <StatusChip value={f.status} />
                  </button>
                ))}
              </div>
            </div>

            <div
              className={cn(
                "rounded-2xl border border-coral/40 bg-coral/8 p-3",
                mobileTab === "Pending" ? "block" : "hidden md:block",
              )}
            >
              <p className="flex items-center gap-2 text-sm font-semibold text-coral">
                <AlertTriangle className="size-4" /> Pending follow-ups (rolled over)
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Not completed on the scheduled day — automatically listed for{" "}
                {format(addDays(parseISO(TODAY), 1), "d MMM")}.
              </p>
              <div className="mt-2 space-y-1.5">
                {missed.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setDetail(f)}
                    className="flex w-full items-center justify-between gap-2 rounded-lg bg-white px-2 py-1.5 text-left hover:bg-mint/25"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-medium">{f.employeeId === user.id && "★ "}{f.title}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        missed {f.date} · {f.relatedName}
                      </span>
                    </span>
                    <StatusChip value={f.priority} />
                  </button>
                ))}
              </div>
            </div>

            <div className="hidden rounded-2xl border border-border bg-white p-3 shadow-sm md:block">
              <p className="text-sm font-semibold">Legend</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {Object.keys(EVENT_COLORS).map((k) => (
                  <span
                    key={k}
                    className={cn(
                      "rounded-md border px-2 py-0.5 text-[11px] font-medium",
                      EVENT_COLORS[k],
                    )}
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <FollowUpDetailDialog detail={detail} onClose={() => setDetail(null)} />
      </div>
    </AppShell>
  );
}
