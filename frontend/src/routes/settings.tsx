import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bell, Building2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { GlassCard, PageHeader } from "@/components/common/glass";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · Saravana Traders CRM" },
      {
        name: "description",
        content: "Company details, notification preferences and workspace options.",
      },
      { property: "og:title", content: "Settings · Saravana Traders CRM" },
      { property: "og:description", content: "Configure your Saravana Traders CRM workspace." },
    ],
  }),
  component: SettingsPage,
});

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Bell;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <GlassCard className="w-full min-w-0 p-5" hover={false}>
      <p className="flex items-center gap-2 font-display text-base font-bold">
        <Icon className="size-4 shrink-0 text-primary" /> <span className="truncate">{title}</span>
      </p>
      <div className="mt-4 w-full min-w-0 space-y-3">{children}</div>
    </GlassCard>
  );
}

function ToggleRow({
  label,
  hint,
  defaultOn = true,
}: {
  label: string;
  hint: string;
  defaultOn?: boolean;
}) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-white/55 px-3 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{label}</p>
        <p className="truncate text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch
        checked={on}
        onCheckedChange={(v) => {
          setOn(v);
          toast.success(`${label} ${v ? "enabled" : "disabled"}`);
        }}
      />
    </div>
  );
}

function SettingsPage() {
  const user = useRequireAuth();
  if (!user) return null;

  return (
    <AppShell>
      <div className="space-y-4">
        <PageHeader title="Settings" subtitle="Workspace preferences for Saravana Traders" />

        <div className="grid gap-4 lg:grid-cols-2">
          <Section icon={Building2} title="Company profile">
            <form
              className="grid w-full min-w-0 gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                toast.success("Company details saved");
              }}
            >
              <div className="w-full min-w-0 space-y-1.5">
                <Label htmlFor="c">Company name</Label>
                <Input
                  id="c"
                  defaultValue="Saravana Traders"
                  className="h-10 w-full min-w-0 max-w-full box-border bg-white/70"
                />
              </div>

              <div className="w-full min-w-0 space-y-1.5">
                <Label htmlFor="a">Registered address</Label>
                <Input
                  id="a"
                  defaultValue="112, Trichy Road, Coimbatore, Tamil Nadu 641018"
                  className="h-10 w-full min-w-0 max-w-full box-border bg-white/70"
                />
              </div>
              <Button type="submit" className="w-fit rounded-xl">
                Save company details
              </Button>
            </form>
          </Section>

          <Section icon={Bell} title="Notifications">
            <ToggleRow
              label="Follow-up reminders"
              hint="Alert 30 minutes before a scheduled follow-up"
            />
            <ToggleRow
              label="Missed follow-up alerts"
              hint="Notify when a follow-up rolls over to the next day"
            />
            <ToggleRow label="New lead assignment" hint="Ping when a lead is assigned to you" />
            <ToggleRow
              label="Order status changes"
              hint="Track dispatch and delivery updates"
              defaultOn={false}
            />
          </Section>
        </div>
      </div>
    </AppShell>
  );
}
