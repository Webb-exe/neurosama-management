import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamCard } from "@/components/teams/TeamCard";
import { TeamForm } from "@/components/teams/TeamForm";
import { Plus, Users } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";

export const Route = createFileRoute("/_dashboard/teams")({
  component: TeamsPage,
});

function TeamsPage() {
  const { user } = useAuthContext();
  const [createOpen, setCreateOpen] = useState(false);

  const { results, status, loadMore } = usePaginatedQuery(
    api.teams.listTeams,
    {},
    { initialNumItems: 12 }
  );

  const isAdmin = user?.role === "owner" || user?.role === "admin";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
          <p className="text-muted-foreground">
            {isAdmin ? "Manage all teams" : "Your teams"}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Team
          </Button>
        )}
      </div>

      {status === "LoadingFirstPage" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No teams found</h3>
          <p className="text-muted-foreground mb-4">
            {isAdmin
              ? "Get started by creating your first team."
              : "You're not a member of any teams yet."}
          </p>
          {isAdmin && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Team
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((team) => (
              <TeamCard key={team._id} team={team} />
            ))}
          </div>

          {status === "CanLoadMore" && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => loadMore(12)}>
                Load More
              </Button>
            </div>
          )}

          {status === "LoadingMore" && (
            <div className="flex justify-center">
              <Button variant="outline" disabled>
                Loading...
              </Button>
            </div>
          )}
        </>
      )}

      <TeamForm open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
