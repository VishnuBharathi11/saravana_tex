import { Copy, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

async function copy(value: string, message: string) {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const el = document.createElement("textarea");
    el.value = value;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    el.remove();
  }
  toast.success(message);
}

/** Phone / email shown as a clickable chip that copies to clipboard. */
export function CopyField({
  kind,
  value,
  label,
  className,
}: {
  kind: "phone" | "email";
  value: string;
  label?: string;
  className?: string;
}) {
  const Icon = kind === "phone" ? Phone : Mail;
  return (
    <div className={cn("rounded-xl bg-white/55 px-3 py-2.5", className)}>
      {label ? (
        <p className="text-[11px] tracking-wide text-muted-foreground uppercase">{label}</p>
      ) : null}
      <button
        type="button"
        onClick={() => copy(value, kind === "phone" ? "Phone number copied" : "Email copied")}
        className="group mt-0.5 flex w-full min-w-0 items-center gap-2 text-left"
        title={`Copy ${kind}`}
      >
        <Icon className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate text-sm font-medium">{value}</span>
        <Copy className="size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-70" />
      </button>
    </div>
  );
}

/** Compact inline variant for headers. */
export function CopyChip({ kind, value }: { kind: "phone" | "email"; value: string }) {
  const Icon = kind === "phone" ? Phone : Mail;
  return (
    <button
      type="button"
      onClick={() => copy(value, kind === "phone" ? "Phone number copied" : "Email copied")}
      className="group inline-flex max-w-full items-center gap-1.5 rounded-full bg-white/60 px-2.5 py-1 text-xs font-medium hover:bg-mint/40"
      title={`Copy ${kind}`}
    >
      <Icon className="size-3 shrink-0 text-muted-foreground" />
      <span className="truncate">{value}</span>
      <Copy className="size-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-70" />
    </button>
  );
}
