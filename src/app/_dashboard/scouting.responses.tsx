import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { ScoutingFrame } from "@/components/scouting/ScoutingFrame";
import { mergeScoutingSearch, parseCycleSearch } from "@/components/scouting/search";
import { useCycleSelection } from "@/components/scouting/useCycleSelection";
import { useAuthContext } from "@/context/AuthContext";
import {
  formatAnswerForDisplay,
  getQuestions,
  normalizeFormItems,
  type ScoutingFormItem,
} from "@/lib/scouting";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_dashboard/scouting/responses")({
  validateSearch: parseCycleSearch,
  component: ScoutingResponsesPage,
});

function ScoutingResponsesPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [selectedResponseId, setSelectedResponseId] = useState<string | null>(null);
  const { user } = useAuthContext();
  const canManage = user?.role === "owner" || user?.role === "admin";

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

  return (
    <ScoutingFrame
      title="Scouting Responses"
      description="Inspect submitted sessions and optionally include unfinished links in a cleaner review flow."
      active="responses"
      cycleId={resolvedCycleId}
      onCycleChange={changeCycle}
    >
      {!canManage ? (
        <Card>
          <CardHeader>
            <CardTitle>Not Authorized</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Only admins can inspect the full response dashboard.
          </CardContent>
        </Card>
      ) : null}

      {canManage ? (
        <>
          <Card className="rounded-[30px] border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>
                Narrow the response list by team, form, or include in-progress sessions.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-4">
              <Input
                type="number"
                placeholder="Team number"
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
              <select
                className="border-input bg-background flex h-10 rounded-2xl border px-3 py-2 text-sm"
                value={search.formId ?? ""}
                onChange={(event) =>
                  navigate({
                    to: "/scouting/responses",
                    search: (previous) =>
                      mergeScoutingSearch(previous, {
                        cycleId: resolvedCycleId,
                        formId: event.target.value || undefined,
                      }),
                  })
                }
              >
                <option value="">All forms</option>
                {(forms ?? []).map((form) => (
                  <option key={form._id} value={form._id}>
                    {form.name}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 rounded-2xl border border-border/70 px-4 py-2 text-sm">
                <input
                  type="checkbox"
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
                Include unfinished sessions
              </label>
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
            <Card className="rounded-[30px] border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle>Responses</CardTitle>
                <CardDescription>
                  {responses?.length ?? 0} response{responses?.length === 1 ? "" : "s"} in the
                  selected cycle.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(responses ?? []).map((response) => (
                  <button
                    key={response._id}
                    type="button"
                    className={[
                      "w-full rounded-[22px] border p-4 text-left transition-colors",
                      selectedResponseId === String(response._id)
                        ? "border-primary/30 bg-primary/5"
                        : "border-border/70 bg-background/80 hover:bg-muted/40",
                    ].join(" ")}
                    onClick={() => setSelectedResponseId(String(response._id))}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{response.formName}</p>
                        <p className="text-sm text-muted-foreground">
                          Team {response.selectedTeamNumber ?? "Unassigned"} | v
                          {response.formVersionNumber}
                        </p>
                      </div>
                      <span className="text-xs uppercase text-muted-foreground">
                        {response.status}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {response.submittedAt
                        ? `Submitted ${new Date(response.submittedAt).toLocaleString()}`
                        : `Last autosave ${new Date(response.lastAutosavedAt).toLocaleString()}`}
                    </p>
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-[30px] border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle>Response Detail</CardTitle>
                <CardDescription>
                  Review answers and the stored output from the selected session.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {responseDetail ? (
                  <>
                    <div className="rounded-[22px] border border-border/70 bg-background/80 p-4 text-sm text-muted-foreground">
                      {responseDetail.formName} | {responseDetail.cycleName} | v
                      {responseDetail.formVersionNumber}
                    </div>
                    {responseQuestions.map((question) => (
                      <div
                        key={question.id}
                        className="rounded-[22px] border border-border/70 bg-background/80 p-4"
                      >
                        <p className="font-medium">{question.title}</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {formatAnswerForDisplay(
                            question,
                            (responseDetail.answers as Record<string, unknown>)[question.id] as never,
                          )}
                        </p>
                      </div>
                    ))}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Select a response to inspect the saved answers and tag writes.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </ScoutingFrame>
  );
}
