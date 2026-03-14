import { type ReactNode, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  ExternalLink,
  Hash,
  Link2,
  TrendingUp,
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
  CardDescription,
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
import { Input } from "@/components/ui/input";

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
  const [selectedResponseId, setSelectedResponseId] = useState<Id<"scoutingSessions"> | null>(
    null,
  );

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
      ? {
          cycleId: resolvedCycleId as Id<"scoutingCycles">,
          teamNumber,
        }
      : "skip",
  );
  const forms = useQuery(api.scouting.forms.listPublishedForms, canManage ? {} : "skip");
  const suggestions = useQuery(
    api.scouting.tags.getTagValueSuggestions,
    canManage && resolvedCycleId && manualTagKey.trim()
      ? {
          cycleId: resolvedCycleId as Id<"scoutingCycles">,
          key: manualTagKey.trim(),
        }
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
      description="Everything for a single team in the selected cycle: tags, responses, external context, and scout link generation."
      active="overview"
      cycleId={resolvedCycleId}
      onCycleChange={changeCycle}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon-sm" asChild>
            <Link to="/scouting" search={getScoutingSearch(resolvedCycleId)}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">
              {teamPage.data?.name ? `${teamPage.data.name}` : `Team ${teamNumber}`}
            </h2>
            <p className="text-sm text-muted-foreground">FTC Team {teamNumber}</p>
          </div>
        </div>
        {teamPage.data?.website ? (
          <a
            className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-4 py-2 text-sm hover:bg-muted/40"
            href={teamPage.data.website}
            rel="noreferrer"
            target="_blank"
          >
            Visit website <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : null}
      </div>

      {quickStats ? (
        <div className="grid gap-4 lg:grid-cols-4">
          <TeamStatCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="Total OPR"
            value={formatNumber(quickStats.tot.value)}
            hint={`Rank #${quickStats.tot.rank}`}
          />
          <TeamStatCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="Auto OPR"
            value={formatNumber(quickStats.auto.value)}
            hint={`Rank #${quickStats.auto.rank}`}
          />
          <TeamStatCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="DC OPR"
            value={formatNumber(quickStats.dc.value)}
            hint={`Rank #${quickStats.dc.rank}`}
          />
          <TeamStatCard
            icon={<Hash className="h-4 w-4" />}
            label="EG OPR"
            value={formatNumber(quickStats.eg.value)}
            hint={`Rank #${quickStats.eg.rank}`}
          />
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card className="rounded-[30px] border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>Cycle Tags</CardTitle>
              <CardDescription>
                Tags written by forms or entered manually for the currently selected cycle.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {teamSummary && Object.keys(teamSummary.team.tags).length > 0 ? (
                Object.entries(teamSummary.team.tags).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between gap-3 rounded-[22px] border border-border/70 bg-background/80 p-4"
                  >
                    <div>
                      <p className="font-medium">{key}</p>
                      <p className="text-sm text-muted-foreground">{value}</p>
                    </div>
                    {canManage && resolvedCycleId ? (
                      <Button
                        variant="ghost"
                        size="sm"
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
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No tags for this team in the selected cycle yet.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[30px] border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>Responses in This Cycle</CardTitle>
              <CardDescription>
                Recent form activity tied to this team inside the selected cycle.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(teamSummary?.responses ?? []).map((response) => (
                    <div
                      key={response._id}
                      className="rounded-[22px] border border-border/70 bg-background/80 p-4"
                    >
                      <p className="font-medium">
                        {response.formName} (v{response.formVersionNumber}) 
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Status: {response.status}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {response.status === "submitted" && response.submittedAt
                          ? `Submitted ${new Date(response.submittedAt).toLocaleString()}`
                          : `Last autosave ${new Date(response.lastAutosavedAt).toLocaleString()}`}
                      </p>
                      {canManage ? (
                        <div className="mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedResponseId(response._id)}
                          >
                            View Response
                          </Button>
                        </div>
                      ) : null}
                      <div className="mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setModalLink(`${window.location.origin}${response.path}`)}
                        >
                          Open QR Code
                        </Button>
                      </div>
                    </div>
              ))}
              {teamSummary && teamSummary.responses.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No responses for this team in the selected cycle.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          {canManage ? (
            <>
              <Card className="rounded-[30px] border-border/70 shadow-sm">
                <CardHeader>
                  <CardTitle>Manual Tag Management</CardTitle>
                  <CardDescription>
                    Add or override a team tag directly for the current cycle.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    placeholder="Tag key"
                    value={manualTagKey}
                    onChange={(event) => setManualTagKey(event.target.value)}
                  />
                  <Input
                    list="tag-suggestions"
                    placeholder="Tag value"
                    value={manualTagValue}
                    onChange={(event) => setManualTagValue(event.target.value)}
                  />
                  <datalist id="tag-suggestions">
                    {(suggestions ?? []).map((suggestion) => (
                      <option key={suggestion} value={suggestion} />
                    ))}
                  </datalist>
                  <Button
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
                    Save Tag
                  </Button>
                </CardContent>
              </Card>

              <Card className="rounded-[30px] border-border/70 shadow-sm">
                <CardHeader>
                  <CardTitle>Generate Team Link</CardTitle>
                  <CardDescription>
                    Create a prefilled scout link for this team from any published form.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <select
                    className="border-input bg-background flex h-10 w-full rounded-2xl border px-3 py-2 text-sm"
                    value={selectedFormId}
                    onChange={(event) => setSelectedFormId(event.target.value)}
                  >
                    <option value="">Choose a published form</option>
                    {(forms ?? []).map((form) => (
                      <option key={form._id} value={form._id}>
                        {form.name}
                      </option>
                    ))}
                  </select>
                  <Button
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
                    <Link2 className="mr-2 h-4 w-4" />
                    Generate Team Link
                  </Button>
                </CardContent>
              </Card>
            </>
          ) : null}

          <Card className="rounded-[30px] border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>Event OPR Breakdown</CardTitle>
              <CardDescription>
                Event-by-event OPR and rank for this team in the selected season.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(teamPage.data?.events ?? []).length > 0 ? (
                teamPage.data?.events.map((entry) => (
                  <Link
                  to="/events/$code"
                  params={{ code: entry.event.code }}
                  key={entry.event.code}
                  className="p-1"
                >
                  <div
                    key={entry.event.code}
                    className="rounded-[18px] border border-border/70 bg-background/80 p-3 hover:border-primary/50"
                  >
                    <p className="text-sm font-medium">
                      {entry.event.name} ({entry.event.code})
                    </p>
                    {entry.stats ? (
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <p>Total OPR: {formatNumber(entry.stats.opr.totalPointsNp)}</p>
                        <p>Rank: {entry.stats.rank}</p>
                      </div>
                    ) : (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Event OPR stats are not available for this event.
                      </p>
                    )}
                  </div>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No event participations found for this team.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[30px] border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>FTC Scout Snapshot</CardTitle>
              <CardDescription>
                Reference data from the FTC Scout integration.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Rookie year: {teamPage.data?.rookieYear ?? "Unknown"}</p>
              <p>School: {teamPage.data?.schoolName ?? "Unknown"}</p>
              <p>
                Location:{" "}
                {teamPage.data
                  ? [
                      teamPage.data.location.city,
                      teamPage.data.location.state,
                      teamPage.data.location.country,
                    ]
                      .filter(Boolean)
                      .join(", ")
                  : "Unknown"}
              </p>
              <div className="mt-3 rounded-[18px] border border-border/70 bg-background/80 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-foreground">
                  Team OPR + Rank (Season {quickStats?.season ?? "N/A"})
                </p>
                {quickStats ? (
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <p>Total OPR: {formatNumber(quickStats.tot.value)}</p>
                    <p>Total Rank: {quickStats.tot.rank}</p>
                    <p>Auto OPR: {formatNumber(quickStats.auto.value)}</p>
                    <p>Auto Rank: {quickStats.auto.rank}</p>
                    <p>DC OPR: {formatNumber(quickStats.dc.value)}</p>
                    <p>DC Rank: {quickStats.dc.rank}</p>
                    <p>EG OPR: {formatNumber(quickStats.eg.value)}</p>
                    <p>EG Rank: {quickStats.eg.rank}</p>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Team OPR stats are not available yet.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Dialog open={Boolean(selectedResponseId)} onOpenChange={(open) => !open && setSelectedResponseId(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Response Detail</DialogTitle>
            <DialogDescription>
              Review question-by-question answers from this scouting response.
            </DialogDescription>
          </DialogHeader>
          {responseDetail ? (
            <div className="space-y-4">
              <div className="rounded-[18px] border border-border/70 bg-background/80 p-3 text-sm text-muted-foreground">
                {responseDetail.formName} | {responseDetail.cycleName} | v
                {responseDetail.formVersionNumber}
              </div>
              {responseQuestions.map((question) => (
                <div
                  key={question.id}
                  className="rounded-[18px] border border-border/70 bg-background/80 p-3"
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
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Loading response details...</p>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(modalLink)} onOpenChange={(open) => !open && setModalLink(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Team Link QR Code</DialogTitle>
            <DialogDescription>
              Scan this QR code to open the scouting link for Team {teamNumber}.
            </DialogDescription>
          </DialogHeader>
          {modalLink ? (
            <>
              <div className="flex flex-col items-center gap-3">
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <QRCodeSVG value={modalLink} size={240} includeMargin />
                </div>
                <p className="w-full break-all text-xs text-muted-foreground">{modalLink}</p>
              </div>
              <DialogFooter showCloseButton>
                <Button asChild>
                  <a href={modalLink} target="_blank" rel="noreferrer">
                    Open Link
                  </a>
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </ScoutingFrame>
  );
}

function formatNumber(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : "N/A";
}

function TeamStatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="rounded-[24px] border-border/70 shadow-sm">
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
          <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
        </div>
        <div className="rounded-2xl bg-muted/70 p-3 text-primary">{icon}</div>
      </CardContent>
    </Card>
  );
}
