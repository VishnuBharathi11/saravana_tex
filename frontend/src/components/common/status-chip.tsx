import { cn } from "@/lib/utils";

const map: Record<string, string> = {
  New: "bg-sky/20 text-sky border-sky/30",
  Contacted: "bg-teal/20 text-teal border-teal/30",
  Interested: "bg-primary/15 text-primary border-primary/30",
  Negotiation: "bg-sunbeam/25 text-coral border-sunbeam/40",
  Converted: "bg-mint/40 text-primary border-primary/25",
  Lost: "bg-destructive/12 text-destructive border-destructive/25",
  Active: "bg-mint/40 text-primary border-primary/25",
  Inactive: "bg-muted text-muted-foreground border-border",
  Dormant: "bg-muted text-muted-foreground border-border",
  VIP: "bg-lilac/20 text-lilac border-lilac/30",
  Pending: "bg-sunbeam/25 text-coral border-sunbeam/40",
  Processing: "bg-sky/20 text-sky border-sky/30",
  Draft: "bg-muted text-muted-foreground border-border",
  Confirmed: "bg-teal/15 text-teal border-teal/30",
  Packed: "bg-lilac/20 text-lilac border-lilac/30",
  Dispatched: "bg-teal/20 text-teal border-teal/30",
  Delivered: "bg-mint/40 text-primary border-primary/25",
  Cancelled: "bg-destructive/12 text-destructive border-destructive/25",
  Paid: "bg-mint/40 text-primary border-primary/25",
  Partial: "bg-sunbeam/25 text-coral border-sunbeam/40",
  Completed: "bg-mint/40 text-primary border-primary/25",
  Important: "bg-blush/20 text-blush border-blush/30",
  Meeting: "bg-lilac/20 text-lilac border-lilac/30",
  Order: "bg-teal/20 text-teal border-teal/30",
  Reminder: "bg-sky/20 text-sky border-sky/30",
  High: "bg-coral/20 text-coral border-coral/30",
  Medium: "bg-sunbeam/25 text-coral border-sunbeam/40",
  Low: "bg-mint/40 text-primary border-primary/25",
  Admin: "bg-lilac/20 text-lilac border-lilac/30",
  "Sales Coordinator": "bg-sky/20 text-sky border-sky/30",
  Employee: "bg-mint/40 text-primary border-primary/25",
};

export function StatusChip({ value, className }: { value: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        map[value] ?? "bg-muted text-muted-foreground border-border",
        className,
      )}
    >
      {value}
    </span>
  );
}
