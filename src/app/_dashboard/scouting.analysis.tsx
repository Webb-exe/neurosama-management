import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { TagAnalysisTable } from "@/components/scouting/TagAnalysisTable";
import { useScoutingLayout } from "@/components/scouting/ScoutingLayoutContext";
import { parseCycleSearch } from "@/components/scouting/search";
import { ScoutingLoading } from "@/components/scouting/ScoutingLoading";

export const Route = createFileRoute("/_dashboard/scouting/analysis")({
  validateSearch: parseCycleSearch,
  component: ScoutingAnalysisPage,
});

function ScoutingAnalysisPage() {
  const { resolvedCycleId } = useScoutingLayout();
  const analysis = useQuery(
    api.scouting.teams.getAnalysis,
    resolvedCycleId
      ? { cycleId: resolvedCycleId as Id<"scoutingCycles"> }
      : "skip",
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">Analysis</h2>
        <p className="text-sm text-muted-foreground">
          Sort by tags, filter by values, and open team pages from the table.
        </p>
      </div>
      {analysis ? (
        <TagAnalysisTable cycleId={resolvedCycleId ?? analysis.cycleId} data={analysis} />
      ) : (
        <ScoutingLoading message="Loading analysis…" />
      )}
    </div>
  );
}
