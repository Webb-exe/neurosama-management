import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { ArrowRight, Search, Telescope } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { ScoutingFrame } from "@/components/scouting/ScoutingFrame";
import {
  getScoutingSearch,
  mergeScoutingSearch,
  parseCycleSearch,
} from "@/components/scouting/search";
import { useCycleSelection } from "@/components/scouting/useCycleSelection";
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

export const Route = createFileRoute("/_dashboard/scouting/")({
  validateSearch: parseCycleSearch,
  component: ScoutingHomePage,
});

function ScoutingHomePage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const canManage = user?.role === "owner" || user?.role === "admin";
  const [teamSearch, setTeamSearch] = useState(search.teamNumber ?? "");
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const resetAllScoutingData = useMutation(api.scouting.admin.resetAllScoutingData);

  const changeCycle = (cycleId: string) => {
    navigate({
      to: "/scouting",
      search: (previous) => mergeScoutingSearch(previous, { cycleId }),
    });
  };

  const { resolvedCycleId } = useCycleSelection(search.cycleId, changeCycle);
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
    if (!teamNumber) {
      return;
    }

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

  return (
    <ScoutingFrame
      title="Scouting"
      description="Open teams quickly, monitor the current cycle, and move between analysis, responses, and forms without getting trapped in small dashboard widgets."
      active="overview"
      cycleId={resolvedCycleId}
      onCycleChange={changeCycle}
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_360px]">
        <Card className="rounded-[32px] border-border/70 bg-card shadow-sm">
          <CardHeader className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Telescope className="h-3.5 w-3.5 text-primary" />
              Cycle at a glance
            </div>
            <CardTitle className="text-3xl">Current cycle</CardTitle>
            <CardDescription className="max-w-2xl text-base leading-relaxed">
              {cycle
                ? `${cycle.name} is active and ready for scouting work.`
                : "Select a cycle to load the active scouting workspace."}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <StatCard
              label="Cycle status"
              value={cycle ? cycle.status : "None"}
              hint={cycle ? "Selected scouting cycle" : "Choose a cycle above"}
            />
            <StatCard
              label="Scouted teams"
              value={String(analysis?.rows.length ?? 0)}
              hint="Teams with tags or responses"
            />
            <StatCard
              label="Forms"
              value={String(forms?.length ?? 0)}
              hint={canManage ? "Forms you can manage" : "Admin-managed forms"}
            />
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Open a Team</CardTitle>
            <CardDescription>
              Jump straight into the team page for tags, responses, and scout link generation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={handleTeamSearch}>
              <Input
                type="number"
                placeholder="Team number"
                value={teamSearch}
                onChange={(event) => setTeamSearch(event.target.value)}
                className="h-12 rounded-2xl"
              />
              <Button type="submit" className="w-full" disabled={!teamSearch.trim()}>
                <Search className="mr-2 h-4 w-4" />
                View Team
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <QuickLinkCard
          title="Scouting Analysis"
          description="Filter and sort teams by cycle-specific tags, then drill into the team page."
          to="/scouting/analysis"
          cycleId={resolvedCycleId}
        />
        <QuickLinkCard
          title="Responses"
          description="Inspect submitted and in-progress sessions with a cleaner master-detail view."
          to="/scouting/responses"
          cycleId={resolvedCycleId}
        />
        <QuickLinkCard
          title="Forms"
          description="Build scout forms with sections, headings, conditionals, preview, and publishing."
          to="/scouting/forms"
          cycleId={resolvedCycleId}
        />
        <QuickLinkCard
          title="Cycles"
          description="Create and manage the active scouting windows the team is working inside."
          to="/scouting/cycles"
          cycleId={resolvedCycleId}
        />
      </div>

      {canManage ? (
        <Card className="rounded-[28px] border-red-400/40 bg-red-50/30 shadow-sm dark:bg-red-900/10">
          <CardHeader>
            <CardTitle className="text-2xl text-red-700 dark:text-red-300">Scouting Danger Zone</CardTitle>
            <CardDescription>
              Reset all scouting data (cycles, forms, sessions, tags, and team scouting records).
              This cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => setResetDialogOpen(true)}
              disabled={isResetting}
            >
              Reset All Scouting Data
            </Button>
          </CardContent>
        </Card>
      ) : null}

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
              {isResetting ? "Resetting..." : "Reset Everything"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ScoutingFrame>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-[24px] border border-border/70 bg-background/70 p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function QuickLinkCard({
  title,
  description,
  to,
  cycleId,
}: {
  title: string;
  description: string;
  to: "/scouting/analysis" | "/scouting/responses" | "/scouting/forms" | "/scouting/cycles";
  cycleId?: string;
}) {
  return (
    <Card className="rounded-[28px] border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription className="text-base leading-relaxed">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild variant="outline">
          <Link to={to} search={getScoutingSearch(cycleId)}>
            Open Page
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
