import { createFileRoute, Outlet } from "@tanstack/react-router";
import { FinanceShell } from "@/components/finance/FinanceShell";

export const Route = createFileRoute("/_dashboard/finance")({
  component: FinanceSectionLayout,
});

function FinanceSectionLayout() {
  return (
    <FinanceShell>
      <Outlet />
    </FinanceShell>
  );
}
