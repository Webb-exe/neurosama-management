import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { CheckCircle2, CloudOff, LoaderCircle, ShieldCheck } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { FormRenderer } from "@/components/scouting/FormRenderer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  normalizeFormItems,
  stripHiddenQuestionAnswers,
  type ScoutingAnswers,
  type ScoutingFormItem,
} from "@/lib/scouting";

export const Route = createFileRoute("/scouting/session/$token")({
  component: PublicScoutingSessionPage,
});

function safeReadLocalDraft(key: string) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as {
      answers?: ScoutingAnswers;
      selectedTeamNumber?: string;
      lastAutosavedAt?: number;
    }) : null;
  } catch {
    return null;
  }
}

function formatTimestamp(timestamp: number | null) {
  return timestamp ? new Date(timestamp).toLocaleString() : "Not saved yet";
}

function PublicScoutingSessionPage() {
  const params = Route.useParams();
  const token = params.token;
  const session = useQuery(api.scouting.sessions.getPublicSession, { token });
  const autosaveSession = useMutation(api.scouting.sessions.autosaveSession);
  const submitSession = useMutation(api.scouting.sessions.submitSession);
  const [answers, setAnswers] = useState<ScoutingAnswers>({});
  const [selectedTeamNumber, setSelectedTeamNumber] = useState("");
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error" | "submitting"
  >("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [submittedTeamNumber, setSubmittedTeamNumber] = useState<number | null>(null);
  const initializedRef = useRef(false);
  const lastSavedFingerprintRef = useRef("");
  const saveSequenceRef = useRef(0);

  const localStorageKey = `scouting-session:${token}`;
  const items = useMemo(
    () =>
      session?.status === "open"
        ? normalizeFormItems(session.questions as ScoutingFormItem[])
        : [],
    [session],
  );
  const hasPreselectedTeamNumber = session?.status === "open" && session.preselectedTeamNumber != null;
  const effectiveTeamBindingMode =
    hasPreselectedTeamNumber ? "preselected" : session?.teamBindingMode ?? "selectAtSubmission";

  useEffect(() => {
    initializedRef.current = false;
    lastSavedFingerprintRef.current = "";
    saveSequenceRef.current = 0;
    setAnswers({});
    setSelectedTeamNumber("");
    setSaveState("idle");
    setSubmitError(null);
    setLastSavedAt(null);
    setSubmittedTeamNumber(null);
  }, [token]);

  useEffect(() => {
    if (session?.status !== "open" || initializedRef.current) {
      return;
    }

    const localDraft = safeReadLocalDraft(localStorageKey);
    const serverAnswers = (session.answers ?? {}) as ScoutingAnswers;
    const serverTeamNumber = session.selectedTeamNumber
      ? String(session.selectedTeamNumber)
      : "";
    const serverTimestamp = session.lastAutosavedAt ?? 0;
    const localTimestamp = localDraft?.lastAutosavedAt ?? 0;
    const localIsNewer = localTimestamp > serverTimestamp;

    const nextAnswers = localIsNewer ? localDraft?.answers ?? serverAnswers : serverAnswers;
    const nextSelectedTeamNumber = localIsNewer
      ? localDraft?.selectedTeamNumber ?? serverTeamNumber
      : serverTeamNumber;

    setAnswers(nextAnswers);
    setSelectedTeamNumber(nextSelectedTeamNumber);
    setLastSavedAt(localIsNewer ? localTimestamp : serverTimestamp);
    lastSavedFingerprintRef.current = localIsNewer
      ? ""
      : JSON.stringify({
          answers: serverAnswers,
          selectedTeamNumber:
            session.teamBindingMode === "selectAtSubmission" ? serverTeamNumber : "",
        });
    initializedRef.current = true;
  }, [localStorageKey, session]);

  useEffect(() => {
    if (session?.status !== "open" || !initializedRef.current) {
      return;
    }

    window.localStorage.setItem(
      localStorageKey,
      JSON.stringify({
        answers,
        selectedTeamNumber,
        lastAutosavedAt: lastSavedAt ?? Date.now(),
      }),
    );
  }, [answers, lastSavedAt, localStorageKey, selectedTeamNumber, session]);

  useEffect(() => {
    setAnswers((current) => stripHiddenQuestionAnswers(items, current));
  }, [items]);

  useEffect(() => {
    if (session?.status !== "open" || !initializedRef.current || saveState === "submitting") {
      return;
    }

    const selectedTeamValue =
      session.teamBindingMode === "selectAtSubmission" && selectedTeamNumber.trim()
        ? Number(selectedTeamNumber)
        : undefined;
    const payload = {
      answers,
      selectedTeamNumber: selectedTeamValue,
    };
    const fingerprint = JSON.stringify({
      answers,
      selectedTeamNumber:
        session.teamBindingMode === "selectAtSubmission" ? selectedTeamNumber : "",
    });

    if (fingerprint === lastSavedFingerprintRef.current) {
      return;
    }

    const sequence = saveSequenceRef.current + 1;
    saveSequenceRef.current = sequence;

    const timeout = window.setTimeout(async () => {
      try {
        setSaveState("saving");
        const result = await autosaveSession({
          token,
          ...payload,
        });

        if (saveSequenceRef.current !== sequence) {
          return;
        }

        lastSavedFingerprintRef.current = fingerprint;
        setLastSavedAt(result.lastAutosavedAt);
        setSaveState("saved");
        window.localStorage.setItem(
          localStorageKey,
          JSON.stringify({
            answers,
            selectedTeamNumber,
            lastAutosavedAt: result.lastAutosavedAt,
          }),
        );
      } catch {
        if (saveSequenceRef.current === sequence) {
          setSaveState("error");
        }
      }
    }, 800);

    return () => window.clearTimeout(timeout);
  }, [
    answers,
    autosaveSession,
    localStorageKey,
    saveState,
    selectedTeamNumber,
    session,
    token,
  ]);

  if (!session) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6 py-12">
          <p className="text-sm text-muted-foreground">Loading scouting session...</p>
        </div>
      </div>
    );
  }

  if (session.status === "invalid") {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6 py-12">
          <Card className="w-full rounded-[32px]">
            <CardHeader>
              <CardTitle>Invalid Link</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              This scouting link is invalid or no longer exists.
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (session.status === "closed" || submittedTeamNumber !== null) {
    const finalTeamNumber =
      submittedTeamNumber ?? null;
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6 py-12">
          <Card className="w-full rounded-[32px] border-border/70 shadow-sm">
            <CardHeader className="space-y-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <CardTitle>
                {submittedTeamNumber !== null ? "Submission Complete" : "Session Closed"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-center text-sm text-muted-foreground">
              <p>
                {session.formName} for {session.cycleName}
                {finalTeamNumber ? ` was submitted for team ${finalTeamNumber}.` : " is no longer open."}
              </p>
              {session.status === "closed" && session.submittedAt ? (
                <p>Submitted {new Date(session.submittedAt).toLocaleString()}</p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-6 sm:px-6 sm:py-10">
        <Card className="rounded-[36px] border-border/70 bg-card shadow-sm">
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
                Cycle: {session.cycleName}
              </span>
              <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
                Version {session.formVersionNumber}
              </span>
            </div>
            <CardTitle className="text-3xl sm:text-4xl">{session.title}</CardTitle>
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {session.description || "Complete the scouting form below."}
            </p>
          </CardHeader>
        </Card>

        <div className="space-y-4">
          <FormRenderer
            items={items}
            answers={answers}
            onAnswerChange={(questionId, value) =>
              setAnswers((current) =>
                stripHiddenQuestionAnswers(items, {
                  ...current,
                  [questionId]: value,
                }),
              )
            }
            teamBindingMode={effectiveTeamBindingMode}
            selectedTeamNumber={selectedTeamNumber}
            onSelectedTeamNumberChange={setSelectedTeamNumber}
            disabled={saveState === "submitting"}
            submitting={saveState === "submitting"}
            submitError={submitError}
            onSubmit={async () => {
              setSubmitError(null);
              setSaveState("submitting");
              try {
                const result = await submitSession({
                  token,
                  answers,
                  selectedTeamNumber:
                    effectiveTeamBindingMode === "selectAtSubmission"
                      ? Number(selectedTeamNumber)
                      : undefined,
                });
                window.localStorage.removeItem(localStorageKey);
                setSubmittedTeamNumber(result.teamNumber);
              } catch (error) {
                setSaveState("error");
                setSubmitError(
                  error instanceof Error ? error.message : "Could not submit this response.",
                );
              }
            }}
          />
          <div className="rounded-2xl border border-border/70 bg-card/80 px-4 py-3 text-sm text-muted-foreground">
            <div className="flex flex-wrap items-center gap-2">
              {saveState === "saving" ? (
                <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
              ) : saveState === "error" ? (
                <CloudOff className="h-4 w-4 text-destructive" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-primary" />
              )}
              <span>
                {saveState === "saving"
                  ? "Saving to server..."
                  : saveState === "error"
                    ? "Could not reach the server. Draft stays on this device."
                    : saveState === "saved"
                      ? "All progress saved."
                      : "Autosave is ready."}
              </span>
            </div>
            <p className="mt-2">Last saved: {formatTimestamp(lastSavedAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
