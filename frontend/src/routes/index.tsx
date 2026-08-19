import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Lock, Mail, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/lib/auth";
import { employees } from "@/data/mock";

import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in · Saravana Traders CRM" },
      {
        name: "description",
        content:
          "Sign in to the Saravana Traders CRM to manage enquiries, leads, orders, follow-ups and sales analytics.",
      },
      { property: "og:title", content: "Sign in · Saravana Traders CRM" },
      {
        property: "og:description",
        content: "Enterprise CRM workspace for enquiries, leads, orders and follow-ups.",
      },
    ],
  }),
  component: LoginPage,
});

const demoAccounts = [
  employees.find((e) => e.role === "Admin"),
  employees.find((e) => e.role === "Sales Coordinator"),
  employees.find((e) => e.role === "Employee" && e.status === "Active"),
]
  .filter((e): e is (typeof employees)[number] => Boolean(e))
  .map((e) => ({
    id: e.id,
    name: e.name,
    email: e.email,
    role: e.role,
    initials: e.name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2),
  }));

function LoginPage() {
  const { login, loginAs, user, ready } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (ready && user) navigate({ to: "/dashboard" });
  }, [ready, user, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center overflow-x-hidden p-4">
      <div className="glass page-enter grid mx-auto w-full max-w-sm lg:max-w-5xl overflow-hidden rounded-3xl lg:grid-cols-2">
        <div className="hidden flex-col justify-between bg-gradient-to-br from-mint/60 via-primary/15 to-sky/25 p-10 lg:flex">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-primary to-teal font-display font-bold text-primary-foreground">
              ST
            </span>
            <div>
              <p className="font-display text-lg font-bold">Saravana Traders</p>
              <p className="text-xs text-muted-foreground">CRM & Sales Management</p>
            </div>
          </div>

          <div>
            <h2 className="font-display text-3xl leading-tight font-bold">
              Every enquiry, follow-up and order in one calm workspace.
            </h2>
            <div className="mt-8 space-y-4 text-sm">
              {[
                { icon: TrendingUp, text: "Live pipeline, revenue and conversion analytics" },
                {
                  icon: Sparkles,
                  text: "Colour-coded follow-up calendar with missed-task rollover",
                },
                { icon: ShieldCheck, text: "Role based access for admins and sales coordinators" },
              ].map((f) => (
                <div key={f.text} className="flex items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/70 text-primary">
                    <f.icon className="size-4" />
                  </span>
                  <span className="text-muted-foreground">{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">Coimbatore · Tamil Nadu · Est. 1998</p>
        </div>

        <form
          className="p-5 sm:p-8 flex flex-col min-w-0"
          onSubmit={(e) => {
            e.preventDefault();
            login(email);
            toast.success("Welcome back to Saravana Traders CRM");
            navigate({ to: "/dashboard" });
          }}
        >
          <h1 className="font-display text-2xl font-bold">Sign in</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Use any email to explore. Leave blank to sign in as Admin.
          </p>

          <div className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@saravanatraders.in"
                  className="glass-soft h-11 border-0 pl-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="glass-soft h-11 border-0 pl-9"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <label className="flex items-center gap-2 text-muted-foreground whitespace-nowrap">
                <Checkbox defaultChecked /> Remember me
              </label>
              <button
                type="button"
                onClick={() => toast("Password reset link sent to your email")}
                className="font-medium text-primary hover:underline whitespace-nowrap"
              >
                Forgot password?
              </button>
            </div>

            <Button type="submit" className="h-11 w-full gap-2 rounded-xl">
              Sign in <ArrowRight className="size-4" />
            </Button>
          </div>

          <div className="mt-6">
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-[11px] tracking-wide text-muted-foreground uppercase">
                Or sign in as
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <div className="mt-3 space-y-2">
              {demoAccounts.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    loginAs(d.id);
                    toast.success(`Signed in as ${d.name} · ${d.role}`);
                    navigate({ to: "/dashboard" });
                  }}
                  className="glass-soft lift flex w-full min-w-0 items-center gap-2 rounded-xl px-3 py-2.5 text-left"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-mint to-sky/60 text-[11px] font-bold">
                    {d.initials}
                  </span>
                  <span className="min-w-0 flex-1 overflow-hidden">
                    <span className="block truncate text-sm font-medium">{d.name}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {d.email}
                    </span>
                  </span>
                  <span className="shrink-0 max-w-[90px] truncate rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-medium text-primary text-center">
                    {d.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
