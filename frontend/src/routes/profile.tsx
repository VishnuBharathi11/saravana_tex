import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Camera, KeyRound, Save } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { GlassCard, PageHeader } from "@/components/common/glass";
import { StatusChip } from "@/components/common/status-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { followUps, leads, orders } from "@/data/mock";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My Profile · Saravana Traders CRM" },
      {
        name: "description",
        content: "Personal details, activity summary and password management.",
      },
      { property: "og:title", content: "My Profile · Saravana Traders CRM" },
      { property: "og:description", content: "Manage your CRM profile and review your activity." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const user = useRequireAuth();
  const [about, setAbout] = useState(
    "Handling industrial material sales across Coimbatore and Erode regions.",
  );

  if (!user) return null;

  const mine = {
    leads: leads.filter((l) => l.employeeId === user.id).length,
    orders: orders.filter((o) => o.employeeId === user.id).length,
    followUps: followUps.filter((f) => f.employeeId === user.id).length,
  };
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);

  return (
    <AppShell>
      <div className="space-y-4">
        <PageHeader title="My Profile" subtitle="Your account details and recent activity" />

        <GlassCard
          className="grid gap-4 p-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center"
          hover={false}
        >
          <div className="relative">
            <div className="grid size-20 place-items-center rounded-2xl bg-gradient-to-br from-mint via-teal/40 to-sky/50 text-2xl font-bold">
              {initials}
            </div>
            <button
              onClick={() => toast("Photo upload is mocked in this build")}
              className="absolute -right-1 -bottom-1 grid size-7 place-items-center rounded-full bg-primary text-primary-foreground"
            >
              <Camera className="size-3.5" />
            </button>
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-xl font-bold">{user.name}</p>
            <p className="truncate text-sm text-muted-foreground">
              {user.designation} · {user.email}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <StatusChip value={user.role} />
              <StatusChip value={user.status} />
            </div>
          </div>
        </GlassCard>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["Leads owned", mine.leads],
            ["Orders handled", mine.orders],
            ["Follow-ups", mine.followUps],
          ].map(([label, value]) => (
            <GlassCard key={label as string} className="p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-1 font-display text-2xl font-bold">{value}</p>
            </GlassCard>
          ))}
        </div>

        <GlassCard className="p-4" hover={false}>
          <Tabs defaultValue="details">
            <TabsList className="rounded-xl">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-4">
              <form
                className="grid gap-3 sm:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  toast.success("Profile updated");
                }}
              >
                <div className="space-y-1.5">
                  <Label htmlFor="n">Full name</Label>
                  <Input id="n" defaultValue={user.name} className="h-10 bg-white/70" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="e">Email</Label>
                  <Input
                    id="e"
                    type="email"
                    defaultValue={user.email}
                    className="h-10 bg-white/70"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p">Phone</Label>
                  <Input id="p" defaultValue={user.phone} className="h-10 bg-white/70" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="d">Designation</Label>
                  <Input id="d" defaultValue={user.designation} className="h-10 bg-white/70" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="a">About</Label>
                  <Textarea
                    id="a"
                    rows={3}
                    value={about}
                    onChange={(ev) => setAbout(ev.target.value)}
                    className="bg-white/70"
                  />
                </div>
                <Button type="submit" className="gap-2 rounded-xl sm:col-span-2 sm:w-fit">
                  <Save className="size-4" /> Save changes
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="security" className="mt-4">
              <form
                className="grid max-w-md gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  toast.success("Password changed");
                }}
              >
                {["Current password", "New password", "Confirm new password"].map((l) => (
                  <div key={l} className="space-y-1.5">
                    <Label>{l}</Label>
                    <Input type="password" placeholder="••••••••" className="h-10 bg-white/70" />
                  </div>
                ))}
                <Button type="submit" className="w-fit gap-2 rounded-xl">
                  <KeyRound className="size-4" /> Update password
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </GlassCard>
      </div>
    </AppShell>
  );
}
