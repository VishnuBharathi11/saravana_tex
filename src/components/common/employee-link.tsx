import { Link } from "@tanstack/react-router";
import { useCrm } from "@/lib/store";
import { cn } from "@/lib/utils";

const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/** Clickable assigned-employee identity that opens the existing employee profile route. */
export function EmployeeLink({
  employeeId,
  label,
  className,
  showRole = true,
}: {
  employeeId: string;
  label?: string;
  className?: string;
  showRole?: boolean;
}) {
  const { employees } = useCrm();
  const employee = employees.find((e) => e.id === employeeId);

  const body = employee ? (
    <Link
      to="/employees/$id"
      params={{ id: employee.id }}
      className="mt-0.5 flex min-w-0 items-center gap-2 rounded-lg text-left hover:opacity-80"
    >
      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-mint to-sky/60 text-[10px] font-bold">
        {initials(employee.name)}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{employee.name}</span>
        {showRole ? (
          <span className="block truncate text-[11px] text-muted-foreground">{employee.role}</span>
        ) : null}
      </span>
    </Link>
  ) : (
    <p className="mt-0.5 text-sm font-medium">Unassigned</p>
  );

  return (
    <div className={cn("rounded-xl bg-white/55 px-3 py-2", className)}>
      <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
        {label ?? "Assigned employee"}
      </p>
      {body}
    </div>
  );
}
