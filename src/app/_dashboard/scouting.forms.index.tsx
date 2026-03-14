import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { FileStack, Plus, Sparkles } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { ScoutingFrame } from "@/components/scouting/ScoutingFrame";
import {
  getScoutingSearch,
  mergeScoutingSearch,
  parseCycleSearch,
} from "@/components/scouting/search";
import { useCycleSelection } from "@/components/scouting/useCycleSelection";
import { useAuthContext } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_dashboard/scouting/forms/")({
  validateSearch: parseCycleSearch,
  component: ScoutingFormsPage,
});

function ScoutingFormsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const canManage = user?.role === "owner" || user?.role === "admin";
  const forms = useQuery(api.scouting.forms.listForms, canManage ? {} : "skip");
  const createForm = useMutation(api.scouting.forms.createForm);
  const [newFormName, setNewFormName] = useState("");

  const changeCycle = (cycleId: string) => {
    navigate({
      to: "/scouting/forms",
      search: (previous) => mergeScoutingSearch(previous, { cycleId }),
    });
  };

  const { resolvedCycleId } = useCycleSelection(search.cycleId, changeCycle);

  return (
    <ScoutingFrame
      title="Scouting Forms"
      description="Create polished scout workflows, version them safely, and publish links against active cycles."
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
            Only admins can create and edit scouting forms.
          </CardContent>
        </Card>
      ) : null}

      {canManage ? (
        <>
          <Card className="rounded-[32px] border-border/70 bg-card shadow-sm">
            <CardHeader className="space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">New workflow</span>
              </div>
              <CardTitle className="text-3xl">Create a Scout Form</CardTitle>
              <CardDescription className="max-w-2xl text-base leading-relaxed">
                Start with a clean builder, add section pages for scouts, and publish immutable
                versions when the workflow is ready.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 md:flex-row">
              <Input
                value={newFormName}
                onChange={(event) => setNewFormName(event.target.value)}
                placeholder="Pit Scouting"
                className="h-12 rounded-2xl"
              />
              <Button
                className="h-12 px-5"
                disabled={!canManage || !newFormName.trim()}
                onClick={async () => {
                  const formId = await createForm({ name: newFormName.trim() });
                  setNewFormName("");
                  navigate({
                    to: "/scouting/forms/$formId",
                    params: { formId: String(formId) },
                    search: getScoutingSearch(resolvedCycleId),
                  });
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Form
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-2">
            {(forms ?? []).map((form) => (
              <Card key={form._id} className="rounded-[28px] border-border/70 shadow-sm">
                <CardHeader className="space-y-3">
                  <div className="flex items-center gap-2 text-primary">
                    <FileStack className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {form.latestPublishedVersionNumber
                        ? `Published v${form.latestPublishedVersionNumber}`
                        : "Draft only"}
                    </span>
                  </div>
                  <CardTitle className="text-2xl">{form.name}</CardTitle>
                  <CardDescription className="min-h-12 text-base leading-relaxed">
                    {form.description || "No description yet."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-3 border-t border-border/60 pt-5">
                  <div className="text-sm text-muted-foreground">
                    {form.hasDraft ? "Draft in progress" : "No draft pending"}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() =>
                      navigate({
                        to: "/scouting/forms/$formId",
                        params: { formId: String(form._id) },
                        search: getScoutingSearch(resolvedCycleId),
                      })
                    }
                  >
                    Open Builder
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {forms && forms.length === 0 ? (
            <Card className="rounded-[28px] border-dashed">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No scouting forms yet. Create the first one above.
              </CardContent>
            </Card>
          ) : null}
        </>
      ) : null}
    </ScoutingFrame>
  );
}
