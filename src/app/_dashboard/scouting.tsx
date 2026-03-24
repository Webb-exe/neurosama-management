import { useCallback } from "react";
import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { ScoutingLayoutProvider } from "@/components/scouting/ScoutingLayoutContext";
import { ScoutingShell } from "@/components/scouting/ScoutingShell";
import {
  mergeScoutingSearch,
  parseCycleSearch,
  type ScoutingSearch,
} from "@/components/scouting/search";
import { useCycleSelection } from "@/components/scouting/useCycleSelection";

export const Route = createFileRoute("/_dashboard/scouting")({
  validateSearch: parseCycleSearch,
  component: ScoutingSectionLayout,
});

function ScoutingSectionLayout() {
  const search = Route.useSearch();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  const changeCycle = useCallback(
    (cycleId: string) => {
      navigate({
        to: pathname,
        search: (previous) =>
          mergeScoutingSearch(previous as Partial<ScoutingSearch>, { cycleId }),
      });
    },
    [navigate, pathname],
  );

  const { resolvedCycleId } = useCycleSelection(search.cycleId, changeCycle);

  return (
    <ScoutingLayoutProvider value={{ resolvedCycleId, changeCycle }}>
      <ScoutingShell cycleId={resolvedCycleId} onCycleChange={changeCycle}>
        <Outlet />
      </ScoutingShell>
    </ScoutingLayoutProvider>
  );
}
