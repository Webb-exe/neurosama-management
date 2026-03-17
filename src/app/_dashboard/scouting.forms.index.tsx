import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { FileText, Plus } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { ScoutingFrame } from "@/components/scouting/ScoutingFrame";
import {
  getScoutingSearch,
  mergeScoutingSearch,
  parseCycleSearch,
} from "@/components/scouting/search";
import { useCycleSelection } from "@/components/scouting/useCycleSelection";
import { useAuthContext } from "@/context/AuthContext";
import { PERMISSIONS } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_dashboard/scouting/forms/")({
  validateSearch: parseCycleSearch,
  component: ScoutingFormsPage,
});

function ScoutingFormsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { hasPermission } = useAuthContext();
  const canManage = hasPermission(PERMISSIONS.scoutingFormsManage);
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

  if (!canManage) {
    return (
      <ScoutingFrame
        title="Forms"
        description="Create and manage scouting form workflows."
        active="forms"
        cycleId={resolvedCycleId}
        onCycleChange={changeCycle}
      >
        <Card className="rounded-xl">
          <CardHeader className="p-4">
            <CardTitle className="text-base">Not authorized</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 text-sm text-muted-foreground">
            You do not have permission to create or edit scouting forms.
          </CardContent>
        </Card>
      </ScoutingFrame>
    );
  }

  return (
    <ScoutingFrame
      title="Forms"
      description="Create and manage scouting form workflows."
      active="forms"
      cycleId={resolvedCycleId}
      onCycleChange={changeCycle}
    >
      <Card className="rounded-xl border-border/60 shadow-sm">
        <CardContent className="flex gap-2 p-4">
          <Input
            value={newFormName}
            onChange={(event) => setNewFormName(event.target.value)}
            placeholder="New form name…"
            className="h-9"
          />
          <Button
            size="sm"
            disabled={!newFormName.trim()}
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
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Create
          </Button>
        </CardContent>
      </Card>

      {forms === undefined ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : forms.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 py-10 text-center">
          <p className="text-sm text-muted-foreground">No forms yet. Create the first one above.</p>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {forms.map((form) => (
            <Card
              key={form._id}
              className="rounded-xl border-border/60 shadow-sm transition-shadow hover:shadow-md"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/60">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium">{form.name}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                        {form.description || "No description"}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <Badge
                      variant={form.latestPublishedVersionNumber ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      {form.latestPublishedVersionNumber
                        ? `v${form.latestPublishedVersionNumber}`
                        : "Draft"}
                    </Badge>
                    {form.hasDraft && form.latestPublishedVersionNumber && (
                      <span className="text-[10px] text-muted-foreground">+ draft</span>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap justify-end gap-2">
                  {form.latestPublishedVersionNumber ? (
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() =>
                        navigate({
                          to: "/scouting/forms/$formId/links",
                          params: { formId: String(form._id) },
                          search: getScoutingSearch(resolvedCycleId),
                        })
                      }
                    >
                      Public links
                    </Button>
                  ) : null}
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() =>
                      navigate({
                        to: "/scouting/forms/$formId",
                        params: { formId: String(form._id) },
                        search: getScoutingSearch(resolvedCycleId),
                      })
                    }
                  >
                    Open builder
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </ScoutingFrame>
  );
}
