import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { usePaginatedQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TaskStatusBadge, TASK_STATUSES, getStatusLabel } from "@/components/tasks/TaskStatusBadge";
import { CheckSquare, MoreVertical, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_dashboard/tasks")({
  component: MyTasksPage,
});

type TaskStatus = "backlog" | "todo" | "in_progress" | "review" | "done";

function MyTasksPage() {
  const [statusFilter, setStatusFilter] = useState<TaskStatus | undefined>(undefined);

  const { results, status, loadMore } = usePaginatedQuery(
    api.tasks.listMyTasks,
    { status: statusFilter },
    { initialNumItems: 20 }
  );

  const updateTaskStatus = useMutation(api.tasks.updateTaskStatus);

  const handleStatusChange = async (taskId: Id<"tasks">, newStatus: TaskStatus) => {
    await updateTaskStatus({ taskId, status: newStatus });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
        <p className="text-muted-foreground">
          Tasks assigned to you across all projects
        </p>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={statusFilter === undefined ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter(undefined)}
        >
          All
        </Button>
        {TASK_STATUSES.map((s) => (
          <Button
            key={s}
            variant={statusFilter === s ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(s)}
          >
            {getStatusLabel(s)}
          </Button>
        ))}
      </div>

      {/* Task List */}
      {status === "LoadingFirstPage" ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <CheckSquare className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No tasks found</h3>
          <p className="text-muted-foreground">
            {statusFilter
              ? `No tasks with status "${getStatusLabel(statusFilter)}"`
              : "You don't have any tasks assigned yet."}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {results.map((task) => (
              <Card key={task._id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">{task.name}</h3>
                      <TaskStatusBadge status={task.status} />
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {task.description}
                      </p>
                    )}
                    <Link
                      to="/projects/$id"
                      params={{ id: task.projectId }}
                      className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1"
                    >
                      {task.projectName}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {TASK_STATUSES.filter((s) => s !== task.status).map((s) => (
                        <DropdownMenuItem
                          key={s}
                          onClick={() => handleStatusChange(task._id, s)}
                        >
                          Move to {getStatusLabel(s)}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            ))}
          </div>

          {status === "CanLoadMore" && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => loadMore(20)}>
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
    </div>
  );
}
