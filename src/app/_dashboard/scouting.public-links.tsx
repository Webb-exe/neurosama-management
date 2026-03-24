import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { PublicLinkCard } from "@/components/scouting/PublicLinkCard";
import { ScoutingFrame } from "@/components/scouting/ScoutingFrame";
import {
  mergeScoutingSearch,
  parseCycleSearch,
} from "@/components/scouting/search";
import { useCycleSelection } from "@/components/scouting/useCycleSelection";
import { useAuthContext } from "@/context/AuthContext";
import { PERMISSIONS } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_dashboard/scouting/public-links")({
  validateSearch: parseCycleSearch,
  component: ScoutingPublicLinksDashboardPage,
});

function ScoutingPublicLinksDashboardPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { hasPermission } = useAuthContext();
  const canManage = hasPermission(PERMISSIONS.scoutingFormsManage);
  const forms = useQuery(api.scouting.forms.listForms, canManage ? {} : "skip");
  const changeCycle = (cycleId: string) => {
    navigate({
      to: "/scouting/public-links",
      search: (previous) => mergeScoutingSearch(previous, { cycleId }),
    });
  };
  const { resolvedCycleId } = useCycleSelection(search.cycleId, changeCycle);
  const publicLinks = useQuery(
    api.scouting.publicLinks.listDashboardPublicLinks,
    canManage
      ? {
          cycleId: resolvedCycleId as Id<"scoutingCycles"> | undefined,
          formId: search.formId as Id<"scoutingForms"> | undefined,
        }
      : "skip",
  );
  const setPublicLinkStatus = useMutation(api.scouting.publicLinks.setPublicLinkStatus);
  const totalCreated = (publicLinks ?? []).reduce(
    (sum, link) => sum + link.totalSessionsCreated,
    0,
  );
  const totalSubmitted = (publicLinks ?? []).reduce(
    (sum, link) => sum + link.totalSessionsSubmitted,
    0,
  );
  const activeLinks = (publicLinks ?? []).filter((link) => link.status === "active").length;

  if (!canManage) {
    return (
      <ScoutingFrame
        title="Public Links"
        description="Track reusable public scouting links and session usage."
        active="publicLinks"
        cycleId={resolvedCycleId}
        onCycleChange={changeCycle}
      >
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>Not authorized</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            You do not have permission to manage scouting public links.
          </CardContent>
        </Card>
      </ScoutingFrame>
    );
  }

  return (
    <ScoutingFrame
      title="Public Links"
      description="Monitor reusable public links, team-level caps, and session creation across the current scouting cycle."
      active="publicLinks"
      cycleId={resolvedCycleId}
      onCycleChange={changeCycle}
    >
      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="w-56">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Form</label>
            <Select
              value={search.formId ?? "__all__"}
              onValueChange={(value) =>
                navigate({
                  to: "/scouting/public-links",
                  search: (previous) =>
                    mergeScoutingSearch(previous, {
                      cycleId: resolvedCycleId,
                      formId: value === "__all__" ? undefined : value,
                    }),
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All forms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All forms</SelectItem>
                {(forms ?? []).map((form) => (
                  <SelectItem key={form._id} value={form._id}>
                    {form.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-3">
            <SummaryCard label="Links" value={String(publicLinks?.length ?? 0)} />
            <SummaryCard label="Active" value={String(activeLinks)} />
            <SummaryCard label="Sessions created" value={String(totalCreated)} />
            <SummaryCard label="Sessions submitted" value={String(totalSubmitted)} />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Tracked Links</h3>
          <p className="text-sm text-muted-foreground">
            Each card shows who can use the link and how much each team has used it.
          </p>
        </div>
        <Badge variant="outline">
          {publicLinks?.length ?? 0} result{publicLinks?.length === 1 ? "" : "s"}
        </Badge>
      </div>

      {publicLinks === undefined ? (
        <Card className="rounded-2xl">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Loading public links...
          </CardContent>
        </Card>
      ) : publicLinks.length === 0 ? (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No public links match the selected cycle and filters.
          </CardContent>
        </Card>
      ) : (
        publicLinks.map((link) => (
          <PublicLinkCard
            key={link._id}
            link={link}
            showFormName
            onToggleStatus={async (publicLinkId, status) => {
              await setPublicLinkStatus({
                publicLinkId: publicLinkId as Id<"scoutingPublicLinks">,
                status,
              });
            }}
          />
        ))
      )}
    </ScoutingFrame>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
