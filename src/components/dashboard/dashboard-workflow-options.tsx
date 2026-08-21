import { DropdownMenuItem, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { CheckCircle2, ShoppingBag, UserRound, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const BOARDS = [
  { key: "leads", label: "Total Leads", icon: Users, tone: "teal" },
  { key: "converted", label: "Converted Leads", icon: CheckCircle2, tone: "mint" },
  { key: "orders", label: "Confirmed Orders", icon: ShoppingBag, tone: "sky" },
  { key: "employees", label: "Employee Board", icon: UserRound, tone: "lilac" },
] as const;

interface DashboardWorkflowOptionsProps {
  activeBoard: string;
  onSelect: (board: (typeof BOARDS)[number]["key"]) => void;
}

export function DashboardWorkflowOptions({ activeBoard, onSelect }: DashboardWorkflowOptionsProps) {
  return (
    <>
      <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">
        Workflow
      </DropdownMenuLabel>
      {BOARDS.map((b) => (
        <DropdownMenuItem
          key={b.key}
          onClick={() => onSelect(b.key)}
          className={cn(
            "flex items-center gap-2 cursor-pointer",
            activeBoard === b.key && "bg-muted font-medium",
          )}
        >
          <b.icon className={cn("size-4", `text-${b.tone}`)} />
          <span>{b.label}</span>
        </DropdownMenuItem>
      ))}
    </>
  );
}
