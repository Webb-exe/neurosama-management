import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Eye } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { FormRenderer } from "@/components/scouting/FormRenderer";
import { parseCycleSearch } from "@/components/scouting/search";
import { useAuthContext } from "@/context/AuthContext";
import { PERMISSIONS } from "@/lib/permissions";
import {
  normalizeFormItems,
  stripHiddenQuestionAnswers,
  type ScoutingAnswers,
  type ScoutingFormItem,
} from "@/lib/scouting";
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
  const formId = params.formId as Id<"scoutingForms">;
  const { hasPermission } = useAuthContext();
  const canManage = hasPermission(PERMISSIONS.scoutingFormsManage);
  const formData = useQuery(
    api.scouting.forms.getFormEditor,
    canManage ? { formId } : "skip",
  );
  const [answers, setAnswers] = useState<ScoutingAnswers>({});
  const [selectedTeamNumber, setSelectedTeamNumber] = useState("");

  const items = useMemo(
    () =>
      formData?.draftVersion?.questions || formData?.form
        ? normalizeFormItems(formData?.draftVersion?.questions ?? [])
        : [],
    [formData],
  );
  const teamBindingMode = formData?.draftVersion?.teamBindingMode ?? "selectAtSubmission";

  useEffect(() => {
    setAnswers({});
    setSelectedTeamNumber("");
  }, [formId, formData?.draftVersion?._id, formData?.draftVersion?.updatedAt]);

  useEffect(() => {
    setAnswers((current) => stripHiddenQuestionAnswers(items, current));
  }, [items]);

  return (
    <>
      {!canManage ? (
        <Card>
          <CardHeader>
            <CardTitle>Not Authorized</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            You do not have permission to preview unpublished scouting forms.
          </CardContent>
        </Card>
      ) : null}

      {canManage ? (
        <div className="space-y-6">
          <Card className="rounded-[32px] border-border/70 bg-card shadow-sm">
            <CardHeader className="space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <Eye className="h-4 w-4" />
                <span className="text-sm font-medium">Preview mode</span>
              </div>
              <CardTitle className="text-2xl">
                {formData?.draftVersion?.title ?? formData?.form.name ?? "Untitled form"}
              </CardTitle>
              <CardDescription>
                Local draft preview. Nothing is saved and submit is disabled.
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="mx-auto max-w-5xl">
            <FormRenderer
              items={items as ScoutingFormItem[]}
              answers={answers}
              onAnswerChange={(questionId, value) =>
                setAnswers((current) =>
                  stripHiddenQuestionAnswers(items, {
                    ...current,
                    [questionId]: value,
                  }),
                )
              }
              teamBindingMode={teamBindingMode}
              selectedTeamNumber={selectedTeamNumber}
              onSelectedTeamNumberChange={setSelectedTeamNumber}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
