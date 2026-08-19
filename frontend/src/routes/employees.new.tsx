import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Save } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/common/glass";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { crm, newId } from "@/lib/store";
import { toast } from "sonner";
import type { Employee, Role } from "@/types";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const employeeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  role: z.enum(["Admin", "Sales Coordinator", "Employee"]),
  status: z.enum(["Active", "Inactive"]),
  designation: z.string().min(2, "Designation is required"),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

export const Route = createFileRoute("/employees/new")({
  head: () => ({
    meta: [
      { title: "New employee · Saravana Traders CRM" },
      { name: "description", content: "Add a new team member." },
    ],
  }),
  component: NewEmployee,
});

function NewEmployee() {
  const user = useRequireAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      role: "Employee",
      status: "Active",
      designation: "Sales Executive",
    },
  });

  if (!user) return null;

  if (user.role !== "Admin") {
    return (
      <AppShell>
        <div className="glass rounded-2xl p-10 text-center">
          <p className="font-semibold">Admin access required</p>
        </div>
      </AppShell>
    );
  }

  const onSubmit = (data: EmployeeFormValues) => {
    const newEmp: Employee = {
      id: newId("EMP"),
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role as Role,
      status: data.status,
      designation: data.designation,
      createdAt: new Date().toISOString().slice(0, 10),
      avatarHue: Math.floor(Math.random() * 360),
    };
    crm.addEmployee(newEmp);
    toast.success("Employee added successfully");
    navigate({ to: "/employees" });
  };

  return (
    <AppShell>
      <div className="space-y-4">
        <Button
          variant="ghost"
          className="gap-2 pl-0"
          onClick={() => navigate({ to: "/employees" })}
        >
          <ArrowLeft className="size-4" /> Back
        </Button>

        <PageHeader title="Add Employee" subtitle="Create a new team member profile" />

        <form className="glass rounded-2xl p-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                {...register("name")}
                className={`h-10 border bg-white/70 ${errors.name ? "border-destructive" : "border-transparent"}`}
                placeholder="e.g. Ramesh Iyer"
              />
              {errors.name && (
                <span className="text-xs text-destructive">{errors.name.message}</span>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                className={`h-10 border bg-white/70 ${errors.email ? "border-destructive" : "border-transparent"}`}
                placeholder="e.g. ramesh@saravanatraders.com"
              />
              {errors.email && (
                <span className="text-xs text-destructive">{errors.email.message}</span>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                {...register("phone")}
                className={`h-10 border bg-white/70 ${errors.phone ? "border-destructive" : "border-transparent"}`}
                placeholder="e.g. 9876543210"
              />
              {errors.phone && (
                <span className="text-xs text-destructive">{errors.phone.message}</span>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="designation">Designation</Label>
              <Input
                id="designation"
                {...register("designation")}
                className={`h-10 border bg-white/70 ${errors.designation ? "border-destructive" : "border-transparent"}`}
                placeholder="e.g. Sales Executive"
              />
              {errors.designation && (
                <span className="text-xs text-destructive">{errors.designation.message}</span>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Role</Label>
              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-10 w-full border-0 bg-white/70">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Sales Coordinator">Sales Coordinator</SelectItem>
                      <SelectItem value="Employee">Employee</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.role && (
                <span className="text-xs text-destructive">{errors.role.message}</span>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-10 w-full border-0 bg-white/70">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.status && (
                <span className="text-xs text-destructive">{errors.status.message}</span>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button type="submit" disabled={isSubmitting} className="gap-2 rounded-xl">
              <Save className="size-4" /> Save Employee
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl"
              onClick={() => navigate({ to: "/employees" })}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
