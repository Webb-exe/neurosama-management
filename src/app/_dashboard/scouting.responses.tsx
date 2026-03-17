import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { ScoutingFrame } from "@/components/scouting/ScoutingFrame";
import { mergeScoutingSearch, parseCycleSearch } from "@/components/scouting/search";
import { useCycleSelection } from "@/components/scouting/useCycleSelection";
import { useAuthContext } from "@/context/AuthContext";
import { PERMISSIONS } from "@/lib/permissions";
import {
  formatAnswerForDisplay,
  getQuestions,
  normalizeFormItems,
  type ScoutingFormItem,
} from "@/lib/scouting";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_dashboard/scouting/responses")({
  validateSearch: parseCycleSearch,
  component: ScoutingResponsesPage,
});

function ScoutingResponsesPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [selectedResponseId, setSelectedResponseId] = useState<string | null>(null);
  const { hasPermission } = useAuthContext();
  const canManage = hasPermission(PERMISSIONS.scoutingResponsesView);

  const changeCycle = (cycleId: string) => {
    navigate({
      to: "/scouting/responses",
      search: (previous) => mergeScoutingSearch(previous, { cycleId }),
    });
  };

  const { resolvedCycleId } = useCycleSelection(search.cycleId, changeCycle);
  const responses = useQuery(
    api.scouting.sessions.listResponses,
    canManage && resolvedCycleId
      ? {
          cycleId: resolvedCycleId as Id<"scoutingCycles">,
          formId: search.formId as Id<"scoutingForms"> | undefined,
          teamNumber: search.teamNumber ? Number(search.teamNumber) : undefined,
          includeOpen: search.showOpen,
        }
      : "skip",
  );
  const forms = useQuery(api.scouting.forms.listForms, canManage ? {} : "skip");
  const responseDetail = useQuery(
    api.scouting.sessions.getResponseDetail,
    canManage && selectedResponseId
      ? { sessionId: selectedResponseId as Id<"scoutingSessions"> }
      : "skip",
  );

  const responseQuestions = responseDetail
    ? getQuestions(normalizeFormItems(responseDetail.questions as ScoutingFormItem[]))
    : [];

  if (!canManage) {
    return (
      <ScoutingFrame
        title="Responses"
        description="Inspect submitted sessions and review answers."
        active="responses"
        cycleId={resolvedCycleId}
        onCycleChange={changeCycle}
      >
        <Card className="rounded-xl">
          <CardHeader className="p-4">
            <CardTitle className="text-base">Not authorized</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 text-sm text-muted-foreground">
            You do not have permission to inspect the response dashboard.
          </CardContent>
        </Card>
      </ScoutingFrame>
    );
  }

  return (
    <ScoutingFrame
      title="Responses"
      description="Inspect submitted sessions and review answers."
      active="responses"
      cycleId={resolvedCycleId}
      onCycleChange={changeCycle}
    >
      <Card className="rounded-xl border-border/60 shadow-sm">
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="w-36">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Team</label>
            <Input
              type="number"
              placeholder="Any"
              className="h-9"
              value={search.teamNumber ?? ""}
              onChange={(event) =>
                navigate({
                  to: "/scouting/responses",
                  search: (previous) =>
                    mergeScoutingSearch(previous, {
                      cycleId: resolvedCycleId,
                      teamNumber: event.target.value || undefined,
                    }),
                })
              }
            />
          </div>
          <div className="w-48">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Form</label>
            <Select
              value={search.formId ?? "__all__"}
              onValueChange={(value) =>
                navigate({
                  to: "/scouting/responses",
                  search: (previous) =>
                    mergeScoutingSearch(previous, {
                      cycleId: resolvedCycleId,
                      formId: value === "__all__" ? undefined : value,
                    }),
                })
              }
            >
              <SelectTrigger className="h-9">
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
          <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-border/60 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted/30">
            <input
              type="checkbox"
              className="accent-primary"
              checked={search.showOpen}
              onChange={(event) =>
                navigate({
                  to: "/scouting/responses",
                  search: (previous) =>
                    mergeScoutingSearch(previous, {
                      cycleId: resolvedCycleId,
                      showOpen: event.target.checked,
                    }),
                })
              }
            />
            Unfinished
          </label>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
        <Card className="rounded-xl border-border/60 shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {responses !== undefined
                ? `${responses.length} response${responses.length === 1 ? "" : "s"}`
                : "Loading…"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 p-3 pt-0">
            {responses === undefined ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))
            ) : responses.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No responses match these filters.
              </p>
            ) : (
              responses.map((response) => (
                <button
                  key={response._id}
                  type="button"
                  className={cn(
                    "w-full rounded-lg border p-3 text-left transition-colors",
                    selectedResponseId === String(response._id)
                      ? "border-primary/30 bg-primary/5"
                      : "border-border/50 hover:bg-muted/30",
                  )}
                  onClick={() => setSelectedResponseId(String(response._id))}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">{response.formName}</p>
                    <span className="shrink-0 rounded bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
                      {response.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Team {response.selectedTeamNumber ?? "—"} · v{response.formVersionNumber}
                  </p>
                  {response.publicLinkLabel ? (
                    <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                      Source link: {response.publicLinkLabel}
                    </p>
                  ) : null}
                  <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                    {response.submittedAt
                      ? new Date(response.submittedAt).toLocaleString()
                      : `Autosaved ${new Date(response.lastAutosavedAt).toLocaleString()}`}
                  </p>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/60 shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Response detail
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {selectedResponseId === null ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Select a response on the left to view answers.
              </p>
            ) : responseDetail === undefined ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full rounded-lg" />
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-xs text-muted-foreground">
                  {responseDetail.formName} · {responseDetail.cycleName} · v
                  {responseDetail.formVersionNumber}
                  {responseDetail.publicLink ? ` · ${responseDetail.publicLink.label}` : ""}
                </div>
                {responseQuestions.map((question) => (
                  <div
                    key={question.id}
                    className="rounded-lg border border-border/50 p-3"
                  >
                    <p className="text-sm font-medium">{question.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatAnswerForDisplay(
                        question,
                        (responseDetail.answers as Record<string, unknown>)[question.id] as never,
                      )}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ScoutingFrame>
  );
}
