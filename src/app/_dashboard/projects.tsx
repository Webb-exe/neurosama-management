import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { Plus, FolderKanban } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";

export const Route = createFileRoute("/_dashboard/projects")({
  component: ProjectsPage,
});

function ProjectsPage() {
  const { user } = useAuthContext();
  const [createOpen, setCreateOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "my" | "team">("all");

  const { results, status, loadMore } = usePaginatedQuery(
    api.projects.listProjects,
    { filter },
    { initialNumItems: 12 }
  );

  const canCreate =
    user?.role === "owner" || user?.role === "admin" || user?.role === "member";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage your projects and tasks
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          All
        </Button>
        <Button
          variant={filter === "my" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("my")}
        >
          My Projects
        </Button>
        <Button
          variant={filter === "team" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("team")}
        >
          Team Projects
        </Button>
      </div>

      {status === "LoadingFirstPage" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No projects found</h3>
          <p className="text-muted-foreground mb-4">
            {filter === "all"
              ? "Get started by creating your first project."
              : "No projects match the selected filter."}
          </p>
          {canCreate && filter === "all" && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((project) => (
              <ProjectCard key={project._id} project={project} />
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

      <ProjectForm open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
