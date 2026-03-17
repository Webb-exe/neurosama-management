import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  ExternalLink,
  Link2,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
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
import { useFtcScoutTeamPage } from "@/lib/ftcScout/hooks";
import {
  formatAnswerForDisplay,
  getQuestions,
  normalizeFormItems,
  type ScoutingFormItem,
} from "@/lib/scouting";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_dashboard/scouting/team/$number")({
  validateSearch: parseCycleSearch,
  component: ScoutingTeamPage,
});

function ScoutingTeamPage() {
  const params = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const teamNumber = Number(params.number);
  const { user } = useAuthContext();
  const canManage = user?.role === "owner" || user?.role === "admin";
  const [manualTagKey, setManualTagKey] = useState("");
  const [manualTagValue, setManualTagValue] = useState("");
  const [selectedFormId, setSelectedFormId] = useState("");
  const [modalLink, setModalLink] = useState<string | null>(null);
  const [selectedResponseId, setSelectedResponseId] = useState<Id<"scoutingSessions"> | null>(null);

  const changeCycle = (cycleId: string) => {
    navigate({
      to: "/scouting/team/$number",
      params,
      search: (previous) => mergeScoutingSearch(previous, { cycleId }),
    });
  };

  const { resolvedCycleId } = useCycleSelection(search.cycleId, changeCycle);
  const teamPage = useFtcScoutTeamPage(teamNumber);
  const teamSummary = useQuery(
    api.scouting.teams.getTeamSummary,
    resolvedCycleId
      ? { cycleId: resolvedCycleId as Id<"scoutingCycles">, teamNumber }
      : "skip",
  );
  const forms = useQuery(api.scouting.forms.listPublishedForms, canManage ? {} : "skip");
  const suggestions = useQuery(
    api.scouting.tags.getTagValueSuggestions,
    canManage && resolvedCycleId && manualTagKey.trim()
      ? { cycleId: resolvedCycleId as Id<"scoutingCycles">, key: manualTagKey.trim() }
      : "skip",
  );
  const responseDetail = useQuery(
    api.scouting.sessions.getResponseDetail,
    canManage && selectedResponseId ? { sessionId: selectedResponseId } : "skip",
  );

  const upsertManualTeamTag = useMutation(api.scouting.tags.upsertManualTeamTag);
  const deleteManualTeamTag = useMutation(api.scouting.tags.deleteManualTeamTag);
  const generateSessionLink = useMutation(api.scouting.sessions.generateSessionLink);
  const quickStats = teamPage.data?.quickStats;
  const responseQuestions = responseDetail
    ? getQuestions(normalizeFormItems(responseDetail.questions as ScoutingFormItem[]))
    : [];

  return (
    <ScoutingFrame
      title={`Team ${teamNumber}`}
      description="Tags, responses, external stats, and scout link generation for this team."
      active="overview"
      cycleId={resolvedCycleId}
      onCycleChange={changeCycle}
    >
      {/* Back button + team name */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link to="/scouting" search={getScoutingSearch(resolvedCycleId)}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold leading-tight">
            {teamPage.data?.name ?? `Team ${teamNumber}`}
          </h2>
          <p className="text-xs text-muted-foreground">FTC #{teamNumber}</p>
        </div>
        {teamPage.data?.website && (
          <a
            className="ml-auto inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs hover:bg-muted/40"
            href={teamPage.data.website}
            rel="noreferrer"
            target="_blank"
          >
            Website <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {quickStats ? (
          <>
            <MiniStat label="Total OPR" value={fmt(quickStats.tot.value)} hint={`#${quickStats.tot.rank}`} />
            <MiniStat label="Auto OPR" value={fmt(quickStats.auto.value)} hint={`#${quickStats.auto.rank}`} />
            <MiniStat label="DC OPR" value={fmt(quickStats.dc.value)} hint={`#${quickStats.dc.rank}`} />
            <MiniStat label="EG OPR" value={fmt(quickStats.eg.value)} hint={`#${quickStats.eg.rank}`} />
          </>
        ) : (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5">
              <Skeleton className="h-3 w-14 rounded" />
              <Skeleton className="mt-2 h-5 w-10 rounded" />
              <Skeleton className="mt-1.5 h-2.5 w-8 rounded" />
            </div>
          ))
        )}
      </div>

      {/* Main content grid */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        {/* Left column */}
        <div className="space-y-4">
          {/* Cycle tags */}
          <Card className="rounded-xl border-border/60 shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Cycle tags</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {teamSummary === undefined ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full rounded-lg" />
                  ))}
                </div>
              ) : Object.keys(teamSummary.team.tags).length > 0 ? (
                <div className="space-y-1.5">
                  {Object.entries(teamSummary.team.tags).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between gap-2 rounded-lg border border-border/50 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{key}</p>
                        <p className="truncate text-xs text-muted-foreground">{value}</p>
                      </div>
                      {canManage && resolvedCycleId && (
                        <Button
                          variant="ghost"
                          size="xs"
                          className="shrink-0 text-destructive hover:text-destructive"
                          onClick={() =>
                            deleteManualTeamTag({
                              cycleId: resolvedCycleId as Id<"scoutingCycles">,
                              teamNumber,
                              key,
                            })
                          }
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-3 text-center text-sm text-muted-foreground">
                  No tags in this cycle.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Responses */}
          <Card className="rounded-xl border-border/60 shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Responses</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {teamSummary === undefined ? (
                <div className="space-y-2">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-lg" />
                  ))}
                </div>
              ) : teamSummary.responses.length === 0 ? (
                <p className="py-3 text-center text-sm text-muted-foreground">
                  No responses in this cycle.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {teamSummary.responses.map((response) => (
                    <div
                      key={response._id}
                      className="rounded-lg border border-border/50 p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">
                          {response.formName}
                          <span className="ml-1 text-xs text-muted-foreground">
                            v{response.formVersionNumber}
                          </span>
                        </p>
                        <Badge variant="secondary" className="text-[10px]">
                          {response.status}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                        {response.status === "submitted" && response.submittedAt
                          ? new Date(response.submittedAt).toLocaleString()
                          : `Autosaved ${new Date(response.lastAutosavedAt).toLocaleString()}`}
                      </p>
                      <div className="mt-2 flex gap-1.5">
                        {canManage && (
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => setSelectedResponseId(response._id)}
                          >
                            View
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => setModalLink(`${window.location.origin}${response.path}`)}
                        >
                          QR code
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4 xl:sticky xl:top-4 xl:self-start">
          {canManage && (
            <>
              {/* Manual tag */}
              <Card className="rounded-xl border-border/60 shadow-sm">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Add tag</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 p-4 pt-0">
                  <Input
                    placeholder="Key"
                    value={manualTagKey}
                    onChange={(event) => setManualTagKey(event.target.value)}
                    className="h-8 text-sm"
                  />
                  <Input
                    list="tag-suggestions"
                    placeholder="Value"
                    value={manualTagValue}
                    onChange={(event) => setManualTagValue(event.target.value)}
                    className="h-8 text-sm"
                  />
                  <datalist id="tag-suggestions">
                    {(suggestions ?? []).map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                  <Button
                    size="sm"
                    className="w-full"
                    disabled={!resolvedCycleId || !manualTagKey.trim()}
                    onClick={async () => {
                      await upsertManualTeamTag({
                        cycleId: resolvedCycleId as Id<"scoutingCycles">,
                        teamNumber,
                        key: manualTagKey,
                        value: manualTagValue,
                      });
                      setManualTagKey("");
                      setManualTagValue("");
                    }}
                  >
                    Save tag
                  </Button>
                </CardContent>
              </Card>

              {/* Generate link */}
              <Card className="rounded-xl border-border/60 shadow-sm">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Scout link</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 p-4 pt-0">
                  <Select
                    value={selectedFormId || "__none__"}
                    onValueChange={(v) => setSelectedFormId(v === "__none__" ? "" : v)}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Choose form" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Choose a form</SelectItem>
                      {(forms ?? []).map((form) => (
                        <SelectItem key={form._id} value={form._id}>
                          {form.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    className="w-full"
                    disabled={!resolvedCycleId || !selectedFormId}
                    onClick={async () => {
                      const result = await generateSessionLink({
                        cycleId: resolvedCycleId as Id<"scoutingCycles">,
                        formId: selectedFormId as Id<"scoutingForms">,
                        preselectedTeamNumber: teamNumber,
                      });
                      setModalLink(`${window.location.origin}${result.path}`);
                    }}
                  >
                    <Link2 className="mr-1.5 h-3.5 w-3.5" />
                    Generate link
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          {/* Event OPR */}
          <Card className="rounded-xl border-border/60 shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Events</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {teamPage.data == null ? (
                <div className="space-y-2">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : teamPage.data.events.length > 0 ? (
                <div className="space-y-1.5">
                  {teamPage.data.events.map((entry) => (
                    <Link
                      to="/events/$code"
                      params={{ code: entry.event.code }}
                      key={entry.event.code}
                      className="block rounded-lg border border-border/50 p-2.5 transition-colors hover:border-primary/40 hover:bg-muted/20"
                    >
                      <p className="text-xs font-medium">{entry.event.name}</p>
                      {entry.stats ? (
                        <div className="mt-1 flex gap-3 text-[11px] text-muted-foreground">
                          <span>OPR {fmt(entry.stats.opr.totalPointsNp)}</span>
                          <span>Rank #{entry.stats.rank}</span>
                        </div>
                      ) : (
                        <p className="mt-0.5 text-[11px] text-muted-foreground">No stats</p>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="py-3 text-center text-sm text-muted-foreground">
                  No events found.
                </p>
              )}
            </CardContent>
          </Card>

          {/* FTC Scout info */}
          <Card className="rounded-xl border-border/60 shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">FTC Scout</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 p-4 pt-0 text-xs text-muted-foreground">
              {teamPage.data == null ? (
                <div className="space-y-2">
                  <Skeleton className="h-3 w-32 rounded" />
                  <Skeleton className="h-3 w-24 rounded" />
                  <Skeleton className="h-3 w-40 rounded" />
                </div>
              ) : (
                <>
                  <p>Rookie year: {teamPage.data.rookieYear ?? "Unknown"}</p>
                  <p>School: {teamPage.data.schoolName ?? "Unknown"}</p>
                  <p>
                    Location:{" "}
                    {[
                      teamPage.data.location.city,
                      teamPage.data.location.state,
                      teamPage.data.location.country,
                    ]
                      .filter(Boolean)
                      .join(", ") || "Unknown"}
                  </p>
                  {quickStats && (
                    <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5 rounded-lg border border-border/50 p-2.5 text-[11px]">
                      <p>Total: {fmt(quickStats.tot.value)}</p>
                      <p>Rank #{quickStats.tot.rank}</p>
                      <p>Auto: {fmt(quickStats.auto.value)}</p>
                      <p>Rank #{quickStats.auto.rank}</p>
                      <p>DC: {fmt(quickStats.dc.value)}</p>
                      <p>Rank #{quickStats.dc.rank}</p>
                      <p>EG: {fmt(quickStats.eg.value)}</p>
                      <p>Rank #{quickStats.eg.rank}</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Response detail dialog */}
      <Dialog open={Boolean(selectedResponseId)} onOpenChange={(open) => !open && setSelectedResponseId(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Response detail</DialogTitle>
            <DialogDescription>
              Question-by-question answers from this scouting session.
            </DialogDescription>
          </DialogHeader>
          {responseDetail ? (
            <div className="space-y-2">
              <div className="rounded-lg border border-border/50 bg-muted/30 p-2.5 text-xs text-muted-foreground">
                {responseDetail.formName} · {responseDetail.cycleName} · v
                {responseDetail.formVersionNumber}
                {responseDetail.publicLink ? ` · ${responseDetail.publicLink.label}` : ""}
              </div>
              {responseQuestions.map((question) => (
                <div key={question.id} className="rounded-lg border border-border/50 p-2.5">
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
          ) : (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full rounded-lg" />
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* QR code dialog */}
      <Dialog open={Boolean(modalLink)} onOpenChange={(open) => !open && setModalLink(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Scout link</DialogTitle>
            <DialogDescription>Scan to open the scouting form for Team {teamNumber}.</DialogDescription>
          </DialogHeader>
          {modalLink && (
            <>
              <div className="flex flex-col items-center gap-2">
                <div className="rounded-xl bg-white p-3">
                  <QRCodeSVG value={modalLink} size={200} includeMargin />
                </div>
                <p className="w-full break-all text-center text-[10px] text-muted-foreground">{modalLink}</p>
              </div>
              <DialogFooter showCloseButton>
                <Button size="sm" asChild>
                  <a href={modalLink} target="_blank" rel="noreferrer">
                    Open link
                  </a>
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </ScoutingFrame>
  );
}

function fmt(value: number): string {
  return Number.isFinite(value) ? value.toFixed(1) : "—";
}

function MiniStat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tracking-tight">{value}</p>
      <p className="text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
}
