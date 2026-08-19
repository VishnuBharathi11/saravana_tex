import type { ReactNode } from "react";
import { CopyChip } from "@/components/common/copy-field";
import { StatusChip } from "@/components/common/status-chip";

const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/** Compact profile header: avatar + name and company on one row, status and contact shortcuts. */
export function IdentityHeader({
  name,
  company,
  status,
  phone,
  email,
  meta,
  actions,
}: {
  name: string;
  company: string;
  status?: string;
  phone: string;
  email: string;
  meta?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="glass rounded-2xl p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-mint to-sky/60 text-sm font-bold">
            {initials(name)}
          </span>
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <h1 className="truncate text-lg font-bold sm:text-xl">{name}</h1>
              <span className="hidden text-muted-foreground sm:inline">·</span>
              <p className="truncate text-sm font-medium text-muted-foreground">{company}</p>
            </div>
            {meta ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{meta}</p> : null}
          </div>
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <CopyChip kind="phone" value={phone} />
        <CopyChip kind="email" value={email} />
      </div>
    </header>
  );
}
