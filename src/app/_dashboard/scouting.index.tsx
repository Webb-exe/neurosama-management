import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { Search } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { useScoutingLayout } from "@/components/scouting/ScoutingLayoutContext";
import { getScoutingSearch, parseCycleSearch } from "@/components/scouting/search";
import { useAuthContext } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PERMISSIONS, userHasPermission } from "@/lib/permissions";

export const Route = createFileRoute("/_dashboard/scouting/")({
  validateSearch: parseCycleSearch,
  component: ScoutingHomePage,
});

function ScoutingHomePage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { resolvedCycleId } = useScoutingLayout();
  const { user } = useAuthContext();
  const canManage = userHasPermission(user, PERMISSIONS.scoutingFormsManage);
  const canReset = userHasPermission(user, PERMISSIONS.scoutingReset);
  const [teamSearch, setTeamSearch] = useState(search.teamNumber ?? "");
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const resetAllScoutingData = useMutation(api.scouting.admin.resetAllScoutingData);
  const cycle = useQuery(
    api.scouting.cycles.getActiveCycleDetail,
    resolvedCycleId ? { cycleId: resolvedCycleId as Id<"scoutingCycles"> } : "skip",
  );
  const analysis = useQuery(
    api.scouting.teams.getAnalysis,
    resolvedCycleId ? { cycleId: resolvedCycleId as Id<"scoutingCycles"> } : "skip",
  );
  const forms = useQuery(api.scouting.forms.listForms, canManage ? {} : "skip");

  useEffect(() => {
    setTeamSearch(search.teamNumber ?? "");
  }, [search.teamNumber]);

  const handleTeamSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const teamNumber = teamSearch.trim();
    if (!teamNumber) return;
    navigate({
      to: "/scouting/team/$number",
      params: { number: teamNumber },
      search: getScoutingSearch(resolvedCycleId),
    });
  };

  const handleResetAllScoutingData = async () => {
    setIsResetting(true);
    try {
      await resetAllScoutingData({});
      setResetDialogOpen(false);
    } finally {
      setIsResetting(false);
    }
  };

  const isLoading = cycle === undefined && resolvedCycleId;

  return (
    <>
      <div className="mb-4">
        <h2 className="text-base font-semibold">Home</h2>
        <p className="text-sm text-muted-foreground">
          Snapshot for the selected cycle, team lookup, and shortcuts to data views.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <Card className="rounded-xl border-border/60 shadow-sm">
          <CardHeader className="p-4">
            <CardTitle className="text-base">Cycle snapshot</CardTitle>
            <CardDescription className="text-sm">
              {cycle
                ? `${cycle.name} — ${cycle.status}`
                : resolvedCycleId
                  ? "Loading cycle…"
                  : "Select a cycle to get started."}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 p-4 pt-0 sm:grid-cols-3">
            {isLoading ? (
              <>
                <StatSkeleton />
                <StatSkeleton />
                <StatSkeleton />
              </>
            ) : (
              <>
                <StatCard
                  label="Status"
                  value={cycle ? cycle.status : "—"}
                />
                <StatCard
                  label="Scouted teams"
                  value={analysis !== undefined ? String(analysis.rows.length) : "—"}
                />
                <StatCard
                  label="Forms"
                  value={forms !== undefined ? String(forms.length) : "—"}
                />
              </>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/60 shadow-sm">
          <CardHeader className="p-4">
            <CardTitle className="text-base">Open a team</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <form className="space-y-2" onSubmit={handleTeamSearch}>
              <Input
                type="number"
                placeholder="Team number"
                value={teamSearch}
                onChange={(event) => setTeamSearch(event.target.value)}
                className="h-9"
              />
              <Button type="submit" size="sm" className="w-full" disabled={!teamSearch.trim()}>
                <Search className="mr-1.5 h-3.5 w-3.5" />
                View team
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {canReset && (
        <Card className="rounded-xl border-destructive/30 shadow-sm">
          <CardContent className="flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-destructive">Danger zone</p>
              <p className="text-sm text-muted-foreground">
                Reset all scouting data. This cannot be undone.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setResetDialogOpen(true)}
              disabled={isResetting}
            >
              Reset all data
            </Button>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset all scouting data?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes all scouting cycles, forms, form versions, sessions, tags, and team
              scouting records. Existing scout links and responses will stop working immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetAllScoutingData}
              disabled={isResetting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isResetting ? "Resetting…" : "Reset everything"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function StatSkeleton() {
  return (
    <div className="rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5">
      <Skeleton className="h-3 w-16 rounded" />
      <Skeleton className="mt-2 h-5 w-10 rounded" />
    </div>
  );
}
