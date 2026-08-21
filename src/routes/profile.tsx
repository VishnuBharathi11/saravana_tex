import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/common/glass";
import { EmployeeProfile } from "@/components/common/employee-profile";
import { useRequireAuth } from "@/hooks/use-require-auth";

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

  if (!user) return null;

  return (
    <AppShell>
      <div className="space-y-4">
        <PageHeader title="My Profile" subtitle="Your account details and recent activity" />
        <EmployeeProfile employee={user} editable={true} />
      </div>
    </AppShell>
  );
}
