import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { ArrowLeft, Eye } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { FormRenderer } from "@/components/scouting/FormRenderer";
import { ScoutingFrame } from "@/components/scouting/ScoutingFrame";
import {
  mergeScoutingSearch,
  parseCycleSearch,
} from "@/components/scouting/search";
import { useCycleSelection } from "@/components/scouting/useCycleSelection";
import { useAuthContext } from "@/context/AuthContext";
import {
  normalizeFormItems,
  type ScoutingAnswers,
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

export const Route = createFileRoute("/_dashboard/scouting/forms/$formId/preview")({
  validateSearch: parseCycleSearch,
  component: ScoutingFormPreviewPage,
});

function ScoutingFormPreviewPage() {
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
  const [answers, setAnswers] = useState<ScoutingAnswers>({});
  const [selectedTeamNumber, setSelectedTeamNumber] = useState("");

  const changeCycle = (cycleId: string) => {
    navigate({
      to: "/scouting/forms/$formId/preview",
      params,
      search: (previous) => mergeScoutingSearch(previous, { cycleId }),
    });
  };

  const { resolvedCycleId } = useCycleSelection(search.cycleId, changeCycle);
  const items =
    formData?.draftVersion?.questions || formData?.form
      ? normalizeFormItems(formData?.draftVersion?.questions ?? [])
      : [];
  const teamBindingMode = formData?.draftVersion?.teamBindingMode ?? "selectAtSubmission";

  useEffect(() => {
    setAnswers({});
    setSelectedTeamNumber("");
  }, [formId, formData?.draftVersion?._id, formData?.draftVersion?.updatedAt]);

  return (
    <ScoutingFrame
      title="Form Preview"
      description="Preview the draft in the real scout-facing page flow. This mode never autosaves and cannot submit a response."
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
            Only admins can preview unpublished scouting forms.
          </CardContent>
        </Card>
      ) : null}

      {canManage ? (
        <div className="space-y-6">
          <Card className="rounded-[32px] border-border/70 bg-card shadow-sm">
            <CardHeader className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-primary">
                    <Eye className="h-4 w-4" />
                    <span className="text-sm font-medium">Preview mode</span>
                  </div>
                  <CardTitle className="text-2xl">
                    {formData?.draftVersion?.title ?? formData?.form.name ?? "Untitled form"}
                  </CardTitle>
                  <CardDescription>
                    This is a local preview of the draft. Submit is intentionally unavailable.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() =>
                    navigate({
                      to: "/scouting/forms/$formId",
                      params,
                      search: (previous) => mergeScoutingSearch(previous, {}),
                    })
                  }
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Builder
                </Button>
              </div>
            </CardHeader>
          </Card>

          <div className="mx-auto max-w-5xl">
            <FormRenderer
              items={items as ScoutingFormItem[]}
              answers={answers}
              onAnswerChange={(questionId, value) =>
                setAnswers((current) => ({
                  ...current,
                  [questionId]: value,
                }))
              }
              teamBindingMode={teamBindingMode}
              selectedTeamNumber={selectedTeamNumber}
              onSelectedTeamNumberChange={setSelectedTeamNumber}
              preselectedTeamNumber={null}
            />
          </div>
        </div>
      ) : null}
    </ScoutingFrame>
  );
}
