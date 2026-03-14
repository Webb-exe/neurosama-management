import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { TagAnalysisTable } from "@/components/scouting/TagAnalysisTable";
import { ScoutingFrame } from "@/components/scouting/ScoutingFrame";
import { mergeScoutingSearch, parseCycleSearch } from "@/components/scouting/search";
import { useCycleSelection } from "@/components/scouting/useCycleSelection";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/_dashboard/scouting/analysis")({
  validateSearch: parseCycleSearch,
  component: ScoutingAnalysisPage,
});

function ScoutingAnalysisPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();

  const changeCycle = (cycleId: string) => {
    navigate({
      to: "/scouting/analysis",
      search: (previous) => mergeScoutingSearch(previous, { cycleId }),
    });
  };

  const { resolvedCycleId } = useCycleSelection(search.cycleId, changeCycle);
  const analysis = useQuery(
    api.scouting.teams.getAnalysis,
    resolvedCycleId
      ? {
          cycleId: resolvedCycleId as Id<"scoutingCycles">,
        }
      : "skip",
  );

  return (
    <ScoutingFrame
      title="Scouting Analysis"
      description="Browse the active scouting cycle in a proper table, sort by any tag, and manage reusable filters without the old one-off controls."
      active="analysis"
      cycleId={resolvedCycleId}
      onCycleChange={changeCycle}
    >
      {analysis ? (
        <TagAnalysisTable cycleId={resolvedCycleId ?? analysis.cycleId} data={analysis} />
      ) : (
        <Card className="rounded-[30px] border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Loading Analysis</CardTitle>
            <CardDescription>
              Pulling the current cycle tags and building the table view.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            This only takes a moment.
          </CardContent>
        </Card>
      )}
    </ScoutingFrame>
  );
}
