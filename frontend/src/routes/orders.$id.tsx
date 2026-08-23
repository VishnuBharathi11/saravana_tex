import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/orders/$id")({
  component: OrderLayout,
});

function OrderLayout() {
  return <Outlet />;
}
