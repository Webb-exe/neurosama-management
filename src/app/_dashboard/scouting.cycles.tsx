import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { Plus } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { useScoutingLayout } from "@/components/scouting/ScoutingLayoutContext";
import { parseCycleSearch } from "@/components/scouting/search";
import { useAuthContext } from "@/context/AuthContext";
import { PERMISSIONS } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_dashboard/scouting/cycles")({
  validateSearch: parseCycleSearch,
  component: ScoutingCyclesPage,
});

function ScoutingCyclesPage() {
  const { resolvedCycleId, changeCycle } = useScoutingLayout();
  const { hasPermission } = useAuthContext();
  const canManage = hasPermission(PERMISSIONS.scoutingCyclesManage);
  const createCycle = useMutation(api.scouting.cycles.createCycle);
  const renameCycle = useMutation(api.scouting.cycles.renameCycle);
  const archiveCycle = useMutation(api.scouting.cycles.archiveCycle);
  const cycles = useQuery(api.scouting.cycles.listCycles, {});
  const [newCycleName, setNewCycleName] = useState("");
  const [renameDrafts, setRenameDrafts] = useState<Record<string, string>>({});

  if (!canManage) {
    return (
      <Card className="rounded-xl">
        <CardHeader className="p-4">
          <CardTitle className="text-base">Not authorized</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 text-sm text-muted-foreground">
          You do not have permission to create or archive scouting cycles.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">Cycles</h2>
        <p className="text-sm text-muted-foreground">Create and manage scouting periods.</p>
      </div>
      <Card className="rounded-xl border-border/60 shadow-sm">
        <CardContent className="flex gap-2 p-4">
          <Input
            value={newCycleName}
            onChange={(event) => setNewCycleName(event.target.value)}
            placeholder="New cycle name…"
            className="h-9"
          />
          <Button
            size="sm"
            disabled={!newCycleName.trim()}
            onClick={async () => {
              const name = newCycleName.trim();
              if (!name) return;
              const createdId = await createCycle({ name });
              setNewCycleName("");
              changeCycle(String(createdId));
            }}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Create
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {cycles === undefined ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))
        ) : cycles.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No cycles yet. Create the first one above.
          </p>
        ) : (
          cycles.map((cycle) => {
            const renameValue = renameDrafts[cycle._id] ?? cycle.name;
            const isSelected = resolvedCycleId === String(cycle._id);
            return (
              <Card
                key={cycle._id}
                className={`rounded-xl border-border/60 shadow-sm ${isSelected ? "ring-1 ring-primary/30" : ""}`}
              >
                <CardContent className="flex flex-col gap-3 p-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{cycle.name}</p>
                    <Badge
                      variant={cycle.status === "active" ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      {cycle.status}
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
                    <Input
                      value={renameValue}
                      onChange={(event) =>
                        setRenameDrafts((current) => ({
                          ...current,
                          [cycle._id]: event.target.value,
                        }))
                      }
                      className="h-8 w-full text-sm sm:w-40"
                    />
                    <div className="flex gap-1.5">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() =>
                          renameCycle({
                            cycleId: cycle._id as Id<"scoutingCycles">,
                            name: renameValue,
                          })
                        }
                      >
                        Rename
                      </Button>
                      {cycle.status === "active" && (
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() =>
                            archiveCycle({
                              cycleId: cycle._id as Id<"scoutingCycles">,
                            })
                          }
                        >
                          Archive
                        </Button>
                      )}
                      {!isSelected && (
                        <Button
                          variant="secondary"
                          size="xs"
                          onClick={() => changeCycle(String(cycle._id))}
                        >
                          Select
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
