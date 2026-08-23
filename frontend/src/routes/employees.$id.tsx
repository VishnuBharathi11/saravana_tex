import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { GlassCard, PageHeader } from "@/components/common/glass";
import { EmployeeProfile } from "@/components/common/employee-profile";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { Button } from "@/components/ui/button";
import { getEmployee, updateEmployee, type UpdateEmployeeInput } from "@/api/employees";
import type { Employee } from "@/types";

export const Route = createFileRoute("/employees/$id")({
  head: () => ({
    meta: [
      { title: "Employee profile · Saravana Traders CRM" },
      {
        name: "description",
        content: "Assigned leads, orders and follow-ups per employee.",
      },
      { property: "og:title", content: "Employee profile · Saravana Traders CRM" },
      {
        property: "og:description",
        content: "Individual sales performance and workload breakdown.",
      },
    ],
  }),
  component: EmployeeDetail,
});

function EmployeeDetail() {
  const user = useRequireAuth();
  const { id } = useParams({ from: "/employees/$id" });
  const queryClient = useQueryClient();

  const employeeQuery = useQuery({
    queryKey: ["employees", id],
    queryFn: () => getEmployee(id),
    enabled: Boolean(user && id),
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: (patch: UpdateEmployeeInput) => updateEmployee(id, patch),
    onSuccess: async (updated) => {
      queryClient.setQueryData<Employee>(["employees", id], updated);
      queryClient.setQueryData<Employee[]>(["employees"], (current) =>
        current?.map((employee) => (employee.id === updated.id ? updated : employee)) ?? current,
      );
    },
  });

  if (!user) return null;

  if (employeeQuery.isPending) {
    return (
      <AppShell>
        <GlassCard className="p-10 text-center">
          <p className="text-sm text-muted-foreground">Loading employee...</p>
        </GlassCard>
      </AppShell>
    );
  }

  if (employeeQuery.isError || !employeeQuery.data) {
    return (
      <AppShell>
        <GlassCard className="p-10 text-center">
          <p className="font-semibold">Employee could not be loaded</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {employeeQuery.error instanceof Error
              ? employeeQuery.error.message
              : "Employee not found"}
          </p>
          <Link to="/employees" className="mt-3 inline-block text-sm text-primary underline">
            Back to employees
          </Link>
        </GlassCard>
      </AppShell>
    );
  }

  const employee = employeeQuery.data;
  const canEdit = user.role === "Admin" || user.id === employee.id;

  return (
    <AppShell>
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm" className="gap-2">
          <Link to="/employees">
            <ArrowLeft className="size-4" /> Employees
          </Link>
        </Button>

        <PageHeader title={`${employee.name}'s Profile`} subtitle="Employee details and CRM workload" />
        <EmployeeProfile
          employee={employee}
          editable={canEdit}
          isSaving={updateEmployeeMutation.isPending}
          onSave={async (patch) => {
            try {
              await updateEmployeeMutation.mutateAsync(patch);
            } catch {
              // The mutation error is surfaced below through the mutation state/toast-free UI.
            }
          }}
        />
        {updateEmployeeMutation.isError && (
          <p className="text-sm text-destructive">
            {updateEmployeeMutation.error instanceof Error
              ? updateEmployeeMutation.error.message
              : "Unable to save employee"}
          </p>
        )}
      </div>
    </AppShell>
  );
}
