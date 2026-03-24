import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { Plus, Trash2 } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { PublicLinkCard } from "@/components/scouting/PublicLinkCard";
import { ScoutingLoading } from "@/components/scouting/ScoutingLoading";
import { useScoutingLayout } from "@/components/scouting/ScoutingLayoutContext";
import { parseCycleSearch } from "@/components/scouting/search";
import { useAuthContext } from "@/context/AuthContext";
import { PERMISSIONS } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_dashboard/scouting/forms/$formId/links")({
  validateSearch: parseCycleSearch,
  component: ScoutingFormPublicLinksPage,
});

type EditableTeamRow = {
  id: string;
  teamNumber: string;
  sessionLimit: string;
};

function makeTeamRow(): EditableTeamRow {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    teamNumber: "",
    sessionLimit: "",
  };
}

function ScoutingFormPublicLinksPage() {
  const params = Route.useParams();
  const formId = params.formId as Id<"scoutingForms">;
  const { resolvedCycleId } = useScoutingLayout();
  const { hasPermission } = useAuthContext();
  const canManage = hasPermission(PERMISSIONS.scoutingFormsManage);
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [accessMode, setAccessMode] = useState<"anyTeam" | "selectedTeams">("anyTeam");
  const [anyTeamSessionLimit, setAnyTeamSessionLimit] = useState("");
  const [teamRows, setTeamRows] = useState<EditableTeamRow[]>([makeTeamRow()]);
  const [generatedLink, setGeneratedLink] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const formData = useQuery(
    api.scouting.forms.getFormEditor,
    canManage ? { formId } : "skip",
  );
  const publicLinks = useQuery(
    api.scouting.publicLinks.listFormPublicLinks,
    canManage ? { formId } : "skip",
  );
  const createPublicLink = useMutation(api.scouting.publicLinks.createPublicLink);
  const setPublicLinkStatus = useMutation(api.scouting.publicLinks.setPublicLinkStatus);

  const publishedVersionNumber = useMemo(
    () =>
      formData?.versions.find((version) => version._id === formData.form.latestPublishedVersionId)
        ?.versionNumber ?? null,
    [formData],
  );

  if (!canManage) {
    return (
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>Not authorized</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          You do not have permission to manage public form links.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{formData?.form.name ?? "Loading form…"}</h2>
        <p className="text-sm text-muted-foreground">
          {publishedVersionNumber
            ? `New public links use published version ${publishedVersionNumber}.`
            : "Publish this form before creating a reusable public link."}
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Create Public Link</CardTitle>
            <CardDescription>
              The public page asks for a team number first, checks access, then creates a locked
              scouting session and redirects into the form.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="public-link-label">Link name</Label>
              <Input
                id="public-link-label"
                placeholder="Example: Pit scouting intake"
                value={label}
                onChange={(event) => setLabel(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="public-link-description">Description</Label>
              <Textarea
                id="public-link-description"
                placeholder="Optional notes for admins using this link"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Who can create sessions?</Label>
              <Select
                value={accessMode}
                onValueChange={(value) =>
                  setAccessMode(value as "anyTeam" | "selectedTeams")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="anyTeam">Any team</SelectItem>
                  <SelectItem value="selectedTeams">Selected teams only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {accessMode === "anyTeam" ? (
              <div className="space-y-2">
                <Label htmlFor="any-team-limit">Session limit per team</Label>
                <Input
                  id="any-team-limit"
                  type="number"
                  min="1"
                  placeholder="Leave blank for unlimited"
                  value={anyTeamSessionLimit}
                  onChange={(event) => setAnyTeamSessionLimit(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Each team can create this many sessions from the link before it is blocked.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <Label>Allowed teams</Label>
                    <p className="text-xs text-muted-foreground">
                      Add each team and optionally set a different session cap for that team.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTeamRows((current) => [...current, makeTeamRow()])}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add team
                  </Button>
                </div>
                <div className="space-y-2">
                  {teamRows.map((row, index) => (
                    <div
                      key={row.id}
                      className="grid gap-2 rounded-xl border border-border/60 p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
                    >
                      <div className="space-y-1">
                        <Label htmlFor={`team-number-${row.id}`}>Team number</Label>
                        <Input
                          id={`team-number-${row.id}`}
                          type="number"
                          min="1"
                          placeholder="12345"
                          value={row.teamNumber}
                          onChange={(event) =>
                            setTeamRows((current) =>
                              current.map((entry) =>
                                entry.id === row.id
                                  ? { ...entry, teamNumber: event.target.value }
                                  : entry,
                              ),
                            )
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`team-limit-${row.id}`}>Session limit</Label>
                        <Input
                          id={`team-limit-${row.id}`}
                          type="number"
                          min="1"
                          placeholder="Unlimited"
                          value={row.sessionLimit}
                          onChange={(event) =>
                            setTeamRows((current) =>
                              current.map((entry) =>
                                entry.id === row.id
                                  ? { ...entry, sessionLimit: event.target.value }
                                  : entry,
                              ),
                            )
                          }
                        />
                      </div>
                      <div className="flex items-end justify-end">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={teamRows.length === 1}
                          onClick={() =>
                            setTeamRows((current) =>
                              current.length === 1
                                ? current
                                : current.filter((entry) => entry.id !== row.id),
                            )
                          }
                          aria-label={`Remove team row ${index + 1}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {createError ? (
              <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {createError}
              </div>
            ) : null}

            <Button
              className="w-full"
              disabled={!resolvedCycleId || !formData?.form.latestPublishedVersionId || isCreating}
              onClick={async () => {
                setCreateError(null);
                setIsCreating(true);
                try {
                  const result = await createPublicLink({
                    cycleId: resolvedCycleId as Id<"scoutingCycles">,
                    formId,
                    label,
                    description,
                    accessMode,
                    anyTeamSessionLimit:
                      accessMode === "anyTeam" && anyTeamSessionLimit.trim()
                        ? Number(anyTeamSessionLimit)
                        : undefined,
                    allowedTeams:
                      accessMode === "selectedTeams"
                        ? teamRows
                            .filter((row) => row.teamNumber.trim())
                            .map((row) => ({
                              teamNumber: Number(row.teamNumber),
                              sessionLimit: row.sessionLimit.trim()
                                ? Number(row.sessionLimit)
                                : undefined,
                            }))
                        : [],
                  });
                  setGeneratedLink(`${window.location.origin}${result.path}`);
                  setLabel("");
                  setDescription("");
                  setAnyTeamSessionLimit("");
                  setTeamRows([makeTeamRow()]);
                } catch (error) {
                  setCreateError(
                    error instanceof Error
                      ? error.message
                      : "Could not create the public link.",
                  );
                } finally {
                  setIsCreating(false);
                }
              }}
            >
              {isCreating ? "Creating..." : "Create Public Link"}
            </Button>

            {generatedLink ? (
              <div className="space-y-2 rounded-xl border border-border/60 bg-muted/20 p-3">
                <div className="flex items-center gap-2">
                  <Badge>New link</Badge>
                  <span className="text-sm text-muted-foreground">
                    Share this URL outside the dashboard.
                  </span>
                </div>
                <Input value={generatedLink} readOnly onFocus={(event) => event.target.select()} />
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>How this works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>1. Share the public URL with scouts or external users.</p>
            <p>2. The public page asks for a team number before opening the form.</p>
            <p>3. If the team is allowed and still under its session cap, a tracked session is created.</p>
            <p>4. The user is redirected into the normal scouting form with that team locked in.</p>
            <p>5. Every created and submitted session appears in the scouting admin dashboards.</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Existing Public Links</h3>
            <p className="text-sm text-muted-foreground">
              Review usage and disable links that should stop accepting new sessions.
            </p>
          </div>
          <Badge variant="outline">
            {publicLinks?.length ?? 0} link{publicLinks?.length === 1 ? "" : "s"}
          </Badge>
        </div>
        {publicLinks === undefined ? (
          <ScoutingLoading message="Loading public links…" variant="inline" />
        ) : publicLinks.length === 0 ? (
          <Card className="rounded-2xl border-dashed">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No public links yet for this form.
            </CardContent>
          </Card>
        ) : (
          publicLinks.map((link) => (
            <PublicLinkCard
              key={link._id}
              link={link}
              showCycleName
              onToggleStatus={async (publicLinkId, status) => {
                await setPublicLinkStatus({
                  publicLinkId: publicLinkId as Id<"scoutingPublicLinks">,
                  status,
                });
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}
