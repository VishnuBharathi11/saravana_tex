import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CalendarPlus, Save, Search } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/common/glass";
import { CustomerLeadSearch } from "@/components/common/customer-lead-search";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { customers } from "@/data/mock";
import { TEXTILE_TYPES, TEXTILE_UNITS } from "@/lib/constants";
import { toast } from "sonner";

export const Route = createFileRoute("/leads/new")({
  head: () => ({
    meta: [
      { title: "New lead · Saravana Traders CRM" },
      { name: "description", content: "Capture a new enquiry or link it to an existing customer." },
      { property: "og:title", content: "New lead · Saravana Traders CRM" },
      { property: "og:description", content: "Enquiry capture form for the sales team." },
    ],
  }),
  component: NewLead,
});

const UNITS = TEXTILE_UNITS;
const DURATIONS = ["Immediate", "1 Week", "2 Weeks", "1 Month", "Quarterly"];

function NewLead() {
  const user = useRequireAuth();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);

  if (!user) return null;



  return (
    <AppShell>
      <div className="space-y-4">
        <Button variant="ghost" className="gap-2 pl-0" onClick={() => navigate({ to: "/leads" })}>
          <ArrowLeft className="size-4" /> Back
        </Button>

        <PageHeader
          title="Create lead"
          subtitle="Search an existing customer or capture a fresh enquiry"
        />

        <div className="glass rounded-2xl p-4">
          <Label>Search existing customer</Label>
          <div className="mt-1.5">
            <CustomerLeadSearch
              value={null}
              onChange={(id) => {
                if (id) navigate({ to: "/customers/$id", params: { id } });
              }}
              typeFilter="Customer"
              placeholder="Type a customer or company name…"
            />
          </div>
        </div>

        <form
          className="glass rounded-2xl p-4"
          onSubmit={(e) => {
            e.preventDefault();
            setSaved(true);
            toast.success("Lead saved successfully");
          }}
        >
          <p className="text-sm font-semibold">New lead details</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {[
              { id: "name", label: "Name", ph: "Contact person" },
              { id: "company", label: "Company", ph: "Company name" },
              { id: "phone", label: "Phone", ph: "+91 …" },
              { id: "email", label: "Email", ph: "name@company.in" },
              { id: "material", label: "Material required", ph: "Grey Fabric" },
              { id: "quantity", label: "Quantity", ph: "250" },
            ].map((f) => (
              <div key={f.id} className="space-y-1.5">
                <Label htmlFor={f.id}>{f.label}</Label>
                <Input
                  id={f.id}
                  placeholder={f.ph}
                  className="glass-soft h-10 border-0"
                  required={f.id === "name"}
                />
              </div>
            ))}

            <div className="space-y-1.5">
              <Label>Units</Label>
              <Select>
                <SelectTrigger className="glass-soft h-10 w-full border-0">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Duration</Label>
              <Select>
                <SelectTrigger className="glass-soft h-10 w-full border-0">
                  <SelectValue placeholder="Requirement window" />
                </SelectTrigger>
                <SelectContent>
                  {DURATIONS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select>
                <SelectTrigger className="glass-soft h-10 w-full border-0">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {TEXTILE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="Street, city, state"
                className="glass-soft h-10 border-0"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                rows={3}
                placeholder="Requirement details, pricing expectations…"
                className="glass-soft border-0"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="submit" className="gap-2 rounded-xl">
              <Save className="size-4" /> Save lead
            </Button>
            {saved && (
              <Button
                type="button"
                variant="outline"
                className="glass-soft gap-2 rounded-xl border-0"
                onClick={() => navigate({ to: "/calendar" })}
              >
                <CalendarPlus className="size-4" /> Create follow-up
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl"
              onClick={() => navigate({ to: "/leads" })}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
