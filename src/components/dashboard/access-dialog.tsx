import { useState } from "react";
import { crm } from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { StatusChip } from "@/components/common/status-chip";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type AccessScope = "OWN" | "SHARED" | "FULL";

export function AccessDialog() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  // On mobile: "list" | "config"
  const [mobileView, setMobileView] = useState<"list" | "config">("list");

  const employees = crm.state.employees;
  const employeeAccess = crm.state.employeeAccess;

  const selectedAccess = selectedEmpId
    ? employeeAccess.find((ea) => ea.employeeId === selectedEmpId)
    : null;
  const selectedEmployee = selectedEmpId ? employees.find((e) => e.id === selectedEmpId) : null;

  const scopeLabel = (scope: string) =>
    scope === "FULL" ? "Full Access" : scope === "SHARED" ? "Shared Records" : "Own Records";

  function handleSelectEmployee(id: string) {
    setSelectedEmpId(id);
    setMobileView("config");
  }

  function handleBack() {
    setMobileView("list");
    setSelectedEmpId(null);
  }

  const filteredEmployees = employees.filter((e) =>
    `${e.name} ${e.email} ${e.role}`.toLowerCase().includes(search.toLowerCase()),
  );

  const EmployeeList = (
    <div className="flex min-w-0 flex-col">
      <div className="border-b p-4">
        <DialogTitle className="mb-2">Access Management</DialogTitle>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search employees…"
          className="h-9"
        />
      </div>
      <div className="no-scrollbar flex-1 space-y-1 overflow-y-auto p-2">
        {filteredEmployees.map((e) => {
          const access = employeeAccess.find((ea) => ea.employeeId === e.id);
          return (
            <button
              key={e.id}
              onClick={() => handleSelectEmployee(e.id)}
              className={cn(
                "flex w-full min-w-0 flex-col items-start gap-1 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                selectedEmpId === e.id ? "bg-muted font-medium" : "hover:bg-muted/50",
              )}
            >
              <div className="flex w-full min-w-0 items-center justify-between gap-2">
                <span className="min-w-0 truncate">{e.name}</span>
                <StatusChip value={e.role} />
              </div>
              <span className="text-xs text-muted-foreground">
                {scopeLabel(access?.scope ?? "OWN")}
              </span>
            </button>
          );
        })}
        {filteredEmployees.length === 0 && (
          <p className="px-3 py-4 text-center text-sm text-muted-foreground">No employees found</p>
        )}
      </div>
    </div>
  );

  const ConfigPanel = (
    <div className="flex min-w-0 flex-col">
      {selectedEmpId && selectedAccess ? (
        <div className="flex flex-1 flex-col p-4">
          <h3 className="mb-4 font-semibold">Access Scope for {selectedEmployee?.name}</h3>

          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <Label>Scope</Label>
              <Select
                value={selectedAccess.scope}
                onValueChange={(val: AccessScope) => {
                  crm.updateEmployeeAccess(selectedEmpId, { scope: val });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OWN">Own Records Only</SelectItem>
                  <SelectItem value="SHARED">Shared Records</SelectItem>
                  <SelectItem value="FULL">Full Access</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedAccess.scope === "SHARED" && (
              <div className="space-y-2">
                <Label>Can access records owned by:</Label>
                <div className="max-h-48 overflow-y-auto space-y-1 rounded-md border p-2">
                  {employees
                    .filter((e) => e.id !== selectedEmpId)
                    .map((e) => (
                      <label
                        key={e.id}
                        className="flex items-center gap-2 rounded p-1 text-sm hover:bg-muted"
                      >
                        <input
                          type="checkbox"
                          checked={selectedAccess.sharedEmployeeIds.includes(e.id)}
                          onChange={(ev) => {
                            const newIds = ev.target.checked
                              ? [...selectedAccess.sharedEmployeeIds, e.id]
                              : selectedAccess.sharedEmployeeIds.filter(
                                  (id: string) => id !== e.id,
                                );
                            crm.updateEmployeeAccess(selectedEmpId, {
                              sharedEmployeeIds: newIds,
                            });
                          }}
                        />
                        {e.name}
                      </label>
                    ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-auto pt-4">
            <Button
              className="w-full"
              onClick={() => {
                toast.success("Access permissions saved");
                setOpen(false);
              }}
            >
              Save Changes
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground p-8">
          Select an employee to configure access
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="glass-soft gap-2 rounded-xl border-0">
          <ShieldCheck className="size-4" /> Access
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl overflow-hidden bg-white p-0 max-h-[85vh]">
        <DialogHeader className="sr-only">
          <DialogTitle>Access Management</DialogTitle>
        </DialogHeader>

        {/* Desktop: two-column side-by-side */}
        <div className="hidden h-[520px] md:flex">
          <div className="w-[45%] min-w-0 border-r">{EmployeeList}</div>
          <div className="w-[55%] min-w-0">{ConfigPanel}</div>
        </div>

        {/* Mobile: single-column stacked flow */}
        <div className="flex flex-col md:hidden" style={{ maxHeight: "calc(85vh - 2rem)" }}>
          {mobileView === "list" ? (
            <div className="flex min-h-0 flex-col overflow-hidden">{EmployeeList}</div>
          ) : (
            <div className="flex min-h-0 flex-col overflow-hidden">
              <div className="border-b px-4 py-2">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1 text-sm text-primary"
                >
                  <ArrowLeft className="size-4" /> Back to employees
                </button>
              </div>
              <div className="overflow-y-auto">{ConfigPanel}</div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
