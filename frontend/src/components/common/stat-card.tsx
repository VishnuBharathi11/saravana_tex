import { useCountUp } from "@/hooks/use-count-up";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

const tones: Record<string, string> = {
  teal: "from-teal/25 to-mint/25 text-teal",
  mint: "from-mint/35 to-primary/20 text-primary",
  sky: "from-sky/25 to-mint/20 text-sky",
  lilac: "from-lilac/25 to-mint/20 text-lilac",
  sunbeam: "from-sunbeam/30 to-mint/20 text-coral",
  coral: "from-coral/25 to-blush/20 text-coral",
  blush: "from-blush/25 to-lilac/20 text-blush",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "teal",
  prefix = "",
  suffix = "",
  hint,
  delay = 0,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: keyof typeof tones;
  prefix?: string;
  suffix?: string;
  hint?: string;
  delay?: number;
}) {
  const n = useCountUp(value);
  return (
    <div
      className="glass lift page-enter rounded-2xl p-4 sm:p-5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </p>
          <p className="mt-2 font-display text-2xl font-bold sm:text-3xl">
            {prefix}
            {n.toLocaleString("en-IN")}
            {suffix}
          </p>
          {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br",
            tones[tone],
          )}
        >
          <Icon className="size-5" />
        </span>
      </div>
    </div>
  );
}
