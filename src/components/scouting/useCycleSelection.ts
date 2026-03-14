import { useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useCycleSelection(
  cycleId: string | undefined,
  onCycleChange: (cycleId: string) => void,
) {
  const cycles = useQuery(api.scouting.cycles.listCycles, {});
  const activeCycle = useQuery(api.scouting.cycles.getActiveCycleDetail, {});

  useEffect(() => {
    if (!cycleId && activeCycle?._id) {
      onCycleChange(String(activeCycle._id));
      return;
    }

    if (!cycleId && activeCycle === null && cycles && cycles.length > 0) {
      onCycleChange(String(cycles[0]._id));
    }
  }, [activeCycle, cycleId, cycles, onCycleChange]);

  return {
    cycles,
    resolvedCycleId:
      cycleId ??
      (activeCycle?._id ? String(activeCycle._id) : undefined) ??
      (cycles?.[0]?._id ? String(cycles[0]._id) : undefined),
  };
}
