import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { TagAnalysisTable } from "@/components/scouting/TagAnalysisTable";
import { useScoutingLayout } from "@/components/scouting/ScoutingLayoutContext";
import { parseCycleSearch } from "@/components/scouting/search";
import { Skeleton } from "@/components/ui/skeleton";

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
        <AnalysisSkeleton />
      )}
    </div>
  );
}

function AnalysisSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card/90 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-5 w-48 rounded" />
          <Skeleton className="h-3.5 w-64 rounded" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-56 rounded-lg" />
          <Skeleton className="h-9 w-20 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-border/60">
        <div className="bg-muted/20 px-4 py-3">
          <div className="flex gap-8">
            <Skeleton className="h-4 w-16 rounded" />
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-4 w-20 rounded" />
          </div>
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-8 border-t border-border/40 px-4 py-3">
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-4 w-8 rounded" />
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
