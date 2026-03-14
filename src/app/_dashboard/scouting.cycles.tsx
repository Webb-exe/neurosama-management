import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { ScoutingFrame } from "@/components/scouting/ScoutingFrame";
import { mergeScoutingSearch, parseCycleSearch } from "@/components/scouting/search";
import { useCycleSelection } from "@/components/scouting/useCycleSelection";
import { useAuthContext } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_dashboard/scouting/cycles")({
  validateSearch: parseCycleSearch,
  component: ScoutingCyclesPage,
});

function ScoutingCyclesPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const canManage = user?.role === "owner" || user?.role === "admin";
  const createCycle = useMutation(api.scouting.cycles.createCycle);
  const renameCycle = useMutation(api.scouting.cycles.renameCycle);
  const archiveCycle = useMutation(api.scouting.cycles.archiveCycle);
  const cycles = useQuery(api.scouting.cycles.listCycles, {});
  const [newCycleName, setNewCycleName] = useState("");
  const [renameDrafts, setRenameDrafts] = useState<Record<string, string>>({});

  const changeCycle = (cycleId: string) => {
    navigate({
      to: "/scouting/cycles",
      search: (previous) => mergeScoutingSearch(previous, { cycleId }),
    });
  };

  const { resolvedCycleId } = useCycleSelection(search.cycleId, changeCycle);

  return (
    <ScoutingFrame
      title="Scouting Cycles"
      description="Create manual scouting periods. New cycles always start empty."
      active="cycles"
      cycleId={resolvedCycleId}
      onCycleChange={changeCycle}
    >
      {!canManage ? (
        <Card>
          <CardHeader>
            <CardTitle>Not Authorized</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Only admins can create or archive scouting cycles.
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Create Cycle</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input
            value={newCycleName}
            onChange={(event) => setNewCycleName(event.target.value)}
            placeholder="League Meet 2"
          />
          <Button
            disabled={!canManage || !newCycleName.trim()}
            onClick={async () => {
              const name = newCycleName.trim();
              if (!name) {
                return;
              }
              const createdId = await createCycle({ name });
              setNewCycleName("");
              changeCycle(String(createdId));
            }}
          >
            Create
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {(cycles ?? []).map((cycle) => {
          const renameValue = renameDrafts[cycle._id] ?? cycle.name;
          return (
            <Card key={cycle._id}>
              <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <p className="font-medium">{cycle.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {cycle.status === "archived" ? "Archived" : "Active"}
                  </p>
                </div>
                <div className="flex flex-col gap-2 md:flex-row">
                  <Input
                    value={renameValue}
                    onChange={(event) =>
                      setRenameDrafts((current) => ({
                        ...current,
                        [cycle._id]: event.target.value,
                      }))
                    }
                  />
                  <Button
                    variant="outline"
                    disabled={!canManage}
                    onClick={() =>
                      renameCycle({
                        cycleId: cycle._id as Id<"scoutingCycles">,
                        name: renameValue,
                      })
                    }
                  >
                    Rename
                  </Button>
                  {cycle.status === "active" ? (
                    <Button
                      variant="outline"
                      disabled={!canManage}
                      onClick={() =>
                        archiveCycle({
                          cycleId: cycle._id as Id<"scoutingCycles">,
                        })
                      }
                    >
                      Archive
                    </Button>
                  ) : null}
                  <Button variant="secondary" onClick={() => changeCycle(String(cycle._id))}>
                    Select
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ScoutingFrame>
  );
}
