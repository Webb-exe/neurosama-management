import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { CheckCircle2, Copy, Eye, LoaderCircle, SendHorizontal } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { FormBuilder } from "@/components/scouting/FormBuilder";
import { ScoutingFrame } from "@/components/scouting/ScoutingFrame";
import {
  mergeScoutingSearch,
  parseCycleSearch,
} from "@/components/scouting/search";
import { useCycleSelection } from "@/components/scouting/useCycleSelection";
import { useAuthContext } from "@/context/AuthContext";
import {
  normalizeFormItems,
  type ScoutingFormItem,
} from "@/lib/scouting";
import { Button } from "@/components/ui/button";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_dashboard/scouting/forms/$formId/")({
  validateSearch: parseCycleSearch,
  component: ScoutingFormDetailPage,
});

function ScoutingFormDetailPage() {
  const params = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const formId = params.formId as Id<"scoutingForms">;
  const { user } = useAuthContext();
  const canManage = user?.role === "owner" || user?.role === "admin";
  const formData = useQuery(
    api.scouting.forms.getFormEditor,
    canManage ? { formId } : "skip",
  );
  const saveDraft = useMutation(api.scouting.forms.saveFormDraft);
  const publishDraft = useMutation(api.scouting.forms.publishDraft);
  const generateSessionLink = useMutation(api.scouting.sessions.generateSessionLink);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [teamBindingMode, setTeamBindingMode] = useState<
    "preselected" | "selectAtSubmission"
  >("selectAtSubmission");
  const [items, setItems] = useState<ScoutingFormItem[]>([]);
  const [linkTeamNumber, setLinkTeamNumber] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [selectedPublishedVersionId, setSelectedPublishedVersionId] = useState<
    Id<"scoutingFormVersions"> | null
  >(null);
  const [copyConfirmOpen, setCopyConfirmOpen] = useState(false);
  const [copyingVersion, setCopyingVersion] = useState(false);
  const initializedRef = useRef(false);
  const lastSavedFingerprintRef = useRef("");
  const saveSequenceRef = useRef(0);

  const changeCycle = (cycleId: string) => {
    navigate({
      to: "/scouting/forms/$formId",
      params,
      search: (previous) => mergeScoutingSearch(previous, { cycleId }),
    });
  };

  const { resolvedCycleId } = useCycleSelection(search.cycleId, changeCycle);

  useEffect(() => {
    initializedRef.current = false;
    lastSavedFingerprintRef.current = "";
    saveSequenceRef.current = 0;
    setGeneratedLink("");
    setSelectedPublishedVersionId(null);
    setCopyConfirmOpen(false);
    setCopyingVersion(false);
  }, [formId]);

  useEffect(() => {
    initializedRef.current = false;
    saveSequenceRef.current = 0;
  }, [selectedPublishedVersionId]);

  useEffect(() => {
    if (!formData || !selectedPublishedVersionId) {
      return;
    }

    const selectedStillExists = formData.versions.some(
      (version) => version._id === selectedPublishedVersionId && version.status === "published",
    );
    if (!selectedStillExists) {
      setSelectedPublishedVersionId(null);
    }
  }, [formData, selectedPublishedVersionId]);

  const selectedPublishedVersion =
    formData?.versions.find(
      (version) => version._id === selectedPublishedVersionId && version.status === "published",
    ) ?? null;
  const isViewingPublishedVersion = Boolean(selectedPublishedVersion);

  useEffect(() => {
    if (!formData || initializedRef.current) {
      return;
    }

    const sourceVersion = selectedPublishedVersion ?? formData.draftVersion;
    const nextName = sourceVersion?.title ?? formData.form.name;
    const nextDescription = sourceVersion?.description ?? formData.form.description;
    const nextTeamBindingMode = sourceVersion?.teamBindingMode ?? "selectAtSubmission";
    const nextItems = normalizeFormItems(sourceVersion?.questions ?? []);

    setName(nextName);
    setDescription(nextDescription);
    setTeamBindingMode(nextTeamBindingMode);
    setItems(nextItems);
    setLastSavedAt(sourceVersion?.updatedAt ?? formData.form.updatedAt);
    lastSavedFingerprintRef.current = JSON.stringify({
      name: nextName,
      description: nextDescription,
      teamBindingMode: nextTeamBindingMode,
      items: nextItems,
    });
    setSaveState("idle");
    setGeneratedLink("");
    initializedRef.current = true;
  }, [formData, selectedPublishedVersion]);

  const persistDraft = async () => {
    if (isViewingPublishedVersion) {
      throw new Error("Cannot save while viewing a published version");
    }

    const result = await saveDraft({
      formId,
      name,
      description,
      teamBindingMode,
      questions: items,
    });
    const now = Date.now();
    setLastSavedAt(now);
    lastSavedFingerprintRef.current = JSON.stringify({
      name,
      description,
      teamBindingMode,
      items,
    });
    setSaveState("saved");
    return result;
  };

  useEffect(() => {
    if (!canManage || !initializedRef.current || isViewingPublishedVersion) {
      return;
    }

    const fingerprint = JSON.stringify({
      name,
      description,
      teamBindingMode,
      items,
    });
    if (fingerprint === lastSavedFingerprintRef.current) {
      return;
    }

    const sequence = saveSequenceRef.current + 1;
    saveSequenceRef.current = sequence;

    const timeout = window.setTimeout(async () => {
      try {
        setSaveState("saving");
        await saveDraft({
          formId,
          name,
          description,
          teamBindingMode,
          questions: items,
        });

        if (saveSequenceRef.current !== sequence) {
          return;
        }

        lastSavedFingerprintRef.current = fingerprint;
        setLastSavedAt(Date.now());
        setSaveState("saved");
      } catch {
        if (saveSequenceRef.current === sequence) {
          setSaveState("error");
        }
      }
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [canManage, description, formId, isViewingPublishedVersion, items, name, saveDraft, teamBindingMode]);

  const handleCopyPublishedToDraft = async () => {
    if (!selectedPublishedVersion) {
      return;
    }

    setCopyingVersion(true);
    setSaveState("saving");
    try {
      const nextName = selectedPublishedVersion.title;
      const nextDescription = selectedPublishedVersion.description;
      const nextTeamBindingMode = selectedPublishedVersion.teamBindingMode;
      const nextItems = normalizeFormItems(
        selectedPublishedVersion.questions as ScoutingFormItem[],
      );

      await saveDraft({
        formId,
        name: nextName,
        description: nextDescription,
        teamBindingMode: nextTeamBindingMode,
        questions: nextItems,
      });

      const now = Date.now();
      setName(nextName);
      setDescription(nextDescription);
      setTeamBindingMode(nextTeamBindingMode);
      setItems(nextItems);
      setLastSavedAt(now);
      lastSavedFingerprintRef.current = JSON.stringify({
        name: nextName,
        description: nextDescription,
        teamBindingMode: nextTeamBindingMode,
        items: nextItems,
      });
      setSaveState("saved");
      setGeneratedLink("");
      setCopyConfirmOpen(false);
    } catch {
      setSaveState("error");
    } finally {
      setCopyingVersion(false);
    }
  };

  return (
    <ScoutingFrame
      title="Form Builder"
      description="Design a sectioned scouting form, preview the scout flow, and publish versioned releases."
      active="forms"
      cycleId={resolvedCycleId}
      onCycleChange={changeCycle}
    >
      {!canManage ? (
        <Card>
          <CardHeader>
            <CardTitle>Not Authorized</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Only admins can edit or publish scouting forms.
          </CardContent>
        </Card>
      ) : null}

      {canManage ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="xl:col-span-2 space-y-6">
            <Card className="rounded-[32px] border-border/70 bg-card shadow-sm">
              <CardHeader className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-2">
                    <CardTitle className="text-2xl">
                      {name || formData?.form.name || "Untitled form"}
                    </CardTitle>
                    <CardDescription>
                      Build the exact scout flow with pages, nested sections, and question-level
                      conditions. Preview opens the real form shell without autosave or submit.
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={async () => {
                        setSaveState("saving");
                        try {
                          await persistDraft();
                          navigate({
                            to: "/scouting/forms/$formId/preview" as never,
                            params: { formId: String(formId) } as never,
                            search: mergeScoutingSearch(search, {
                              cycleId: resolvedCycleId ?? undefined,
                            }) as never,
                          });
                        } catch {
                          setSaveState("error");
                        }
                      }}
                      disabled={items.length === 0 || isViewingPublishedVersion}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Open Preview
                    </Button>
                    <Button
                      variant="outline"
                      onClick={async () => {
                        if (isViewingPublishedVersion) {
                          return;
                        }
                        setSaveState("saving");
                        try {
                          await persistDraft();
                        } catch {
                          setSaveState("error");
                        }
                      }}
                      disabled={isViewingPublishedVersion}
                    >
                      {saveState === "saving" ? (
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                      )}
                      Save Draft
                    </Button>
                    <Button
                      onClick={async () => {
                        if (isViewingPublishedVersion) {
                          return;
                        }
                        setSaveState("saving");
                        try {
                          await persistDraft();
                          await publishDraft({ formId });
                        } catch {
                          setSaveState("error");
                        }
                      }}
                      disabled={items.length === 0 || isViewingPublishedVersion}
                    >
                      Publish Draft
                    </Button>
                  </div>
                </div>
                {isViewingPublishedVersion ? (
                  <div className="rounded-2xl border border-amber-300/70 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200">
                    Viewing Published v{selectedPublishedVersion?.versionNumber ?? "?"} in read-only
                    mode. Select Draft to continue editing.
                  </div>
                ) : null}
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span>
                  {saveState === "saving"
                    ? "Saving..."
                    : saveState === "error"
                      ? "Autosave failed. Use Save Draft to retry."
                      : saveState === "saved"
                        ? "All changes saved."
                        : "Autosave ready."}
                </span>
                <span>
                  Last saved: {lastSavedAt ? new Date(lastSavedAt).toLocaleString() : "Not yet"}
                </span>
              </CardContent>
            </Card>

            <FormBuilder
              name={name}
              description={description}
              teamBindingMode={teamBindingMode}
              items={items}
              onNameChange={(value) => {
                if (isViewingPublishedVersion) {
                  return;
                }
                setName(value);
              }}
              onDescriptionChange={(value) => {
                if (isViewingPublishedVersion) {
                  return;
                }
                setDescription(value);
              }}
              onTeamBindingModeChange={(value) => {
                if (isViewingPublishedVersion) {
                  return;
                }
                setTeamBindingMode(value);
              }}
              onItemsChange={(nextItems) => {
                if (isViewingPublishedVersion) {
                  return;
                }
                setItems(nextItems);
              }}
            />

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <Card className="rounded-[28px] border-border/70 shadow-sm">
                <CardHeader>
                  <CardTitle>Version History</CardTitle>
                  <CardDescription>
                    Published versions stay immutable so old links remain reproducible.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Draft is editable. Published versions are read-only snapshots.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedPublishedVersionId(null)}
                    className={`w-full rounded-2xl border p-3 text-left text-sm transition hover:bg-muted/40 ${
                      selectedPublishedVersionId === null
                        ? "border-primary/80 bg-primary/5"
                        : "border-border/70"
                    }`}
                  >
                    <div className="font-medium">Draft</div>
                    <div className="mt-1 text-muted-foreground">
                      {formData?.draftVersion
                        ? `Updated ${new Date(formData.draftVersion.updatedAt).toLocaleString()}`
                        : "No draft yet"}
                    </div>
                  </button>
                  {(formData?.versions ?? [])
                    .filter((version) => version.status === "published")
                    .map((version) => (
                    <button
                      key={version._id}
                      type="button"
                      onClick={() => setSelectedPublishedVersionId(version._id)}
                      className={`w-full rounded-2xl border p-3 text-left text-sm transition hover:bg-muted/40 ${
                        selectedPublishedVersionId === version._id
                          ? "border-primary/80 bg-primary/5"
                          : "border-border/70"
                      }`}
                    >
                      <div className="font-medium">
                        {`Published v${version.versionNumber ?? "?"}`}
                      </div>
                      <div className="mt-1 text-muted-foreground">
                        Updated {new Date(version.updatedAt).toLocaleString()}
                      </div>
                      {version.publishedAt ? (
                        <div className="text-muted-foreground">
                          Published {new Date(version.publishedAt).toLocaleString()}
                        </div>
                      ) : null}
                    </button>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={!selectedPublishedVersion || copyingVersion}
                    onClick={() => setCopyConfirmOpen(true)}
                  >
                    {copyingVersion ? (
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Copy className="mr-2 h-4 w-4" />
                    )}
                    {selectedPublishedVersion
                      ? `Copy Published v${selectedPublishedVersion.versionNumber ?? "?"} to Draft`
                      : "Select a published version to copy"}
                  </Button>
                </CardContent>
              </Card>

              <Card className="rounded-[28px] border-border/70 shadow-sm">
                <CardHeader>
                  <CardTitle>Generate Scout Link</CardTitle>
                  <CardDescription>
                    Creates a one-time link against the current active cycle and latest published
                    version.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {teamBindingMode === "preselected" ? (
                    <Input
                      type="number"
                      placeholder="Preselected team number"
                      value={linkTeamNumber}
                      onChange={(event) => setLinkTeamNumber(event.target.value)}
                    />
                  ) : null}
                  <Button
                    className="w-full"
                    disabled={!resolvedCycleId || !formData?.form.latestPublishedVersionId}
                    onClick={async () => {
                      const result = await generateSessionLink({
                        cycleId: resolvedCycleId as Id<"scoutingCycles">,
                        formId,
                        preselectedTeamNumber:
                          teamBindingMode === "preselected" && linkTeamNumber.trim()
                            ? Number(linkTeamNumber)
                            : undefined,
                      });
                      setGeneratedLink(`${window.location.origin}${result.path}`);
                    }}
                  >
                    <SendHorizontal className="mr-2 h-4 w-4" />
                    Generate Link
                  </Button>
                  {generatedLink ? (
                    <div className="space-y-2">
                      <Input
                        value={generatedLink}
                        readOnly
                        onFocus={(event) => event.target.select()}
                      />
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={async () => {
                          await navigator.clipboard.writeText(generatedLink);
                        }}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Link
                      </Button>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : null}
      <AlertDialog open={copyConfirmOpen} onOpenChange={setCopyConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Overwrite current draft?</AlertDialogTitle>
            <AlertDialogDescription>
              This copies the selected published version into your draft and replaces any unsaved
              draft edits.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={copyingVersion}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCopyPublishedToDraft} disabled={copyingVersion}>
              {copyingVersion ? "Copying..." : "Overwrite Draft"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ScoutingFrame>
  );
}
