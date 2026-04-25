import { createFileRoute, Outlet } from "@tanstack/react-router";
import { InventoryShell } from "@/components/inventory/InventoryShell";

export const Route = createFileRoute("/_dashboard/inventory")({
  component: InventorySectionLayout,
});

function InventorySectionLayout() {
  return (
    <InventoryShell>
      <Outlet />
    </InventoryShell>
  );
}
