import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { TaskForm } from "@/components/tasks/TaskForm";
import { TaskStatusBadge, TASK_STATUSES, getStatusLabel } from "@/components/tasks/TaskStatusBadge";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import {
  ArrowLeft,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  List,
  LayoutGrid,
  Calendar,
} from "lucide-react";

export const Route = createFileRoute("/_dashboard/projects/$id")({
  component: ProjectDetailPage,
});

type TaskStatus = "backlog" | "todo" | "in_progress" | "review" | "done";

function ProjectDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const projectId = id as Id<"projects">;

  const [editOpen, setEditOpen] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");

  const project = useQuery(api.projects.getProject, { projectId });
  const { results: tasks, status: tasksLoadStatus, loadMore } = usePaginatedQuery(
    api.tasks.getTasksByProject,
    {
      projectId,
      status: statusFilter === "all" ? undefined : statusFilter,
    },
    { initialNumItems: 20 }
  );

  const deleteProject = useMutation(api.projects.deleteProject);
  const updateTaskStatus = useMutation(api.tasks.updateTaskStatus);
  const deleteTask = useMutation(api.tasks.deleteTask);

  const handleDeleteProject = async () => {
    await deleteProject({ projectId });
    navigate({ to: "/projects" });
  };

  const handleStatusChange = async (taskId: Id<"tasks">, status: TaskStatus) => {
    await updateTaskStatus({ taskId, status });
  };

  if (project === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (project === null) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-xl font-semibold">Project not found</h2>
        <p className="text-muted-foreground mb-4">
          The project you&apos;re looking for doesn&apos;t exist or you don&apos;t have access.
        </p>
        <Button asChild>
          <Link to="/projects">Back to Projects</Link>
        </Button>
      </div>
    );
  }

  const canEdit =
    project.permission === "admin" || project.permission === "team_leader";

  const completionRate =
    project.taskStats.total > 0
      ? Math.round((project.taskStats.done / project.taskStats.total) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/projects">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            {project.permission !== "member" && (
              <Badge variant="outline">
                {project.permission === "admin" ? "Admin" : "Team Leader"}
              </Badge>
            )}
          </div>
          {project.description && (
            <p className="text-muted-foreground ml-10">{project.description}</p>
          )}
        </div>

        {canEdit && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit Project
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteOpen(true)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Stats */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>{project.taskStats.done} of {project.taskStats.total} tasks completed</span>
            <span className="font-medium">{completionRate}%</span>
          </div>
          <Progress value={completionRate} className="h-2" />
        </CardContent>
      </Card>

      {/* Tasks Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Tasks</h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                className="rounded-none"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "kanban" ? "default" : "ghost"}
                size="sm"
                className="rounded-none"
                onClick={() => setViewMode("kanban")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={() => setCreateTaskOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
        </div>

        {viewMode === "kanban" ? (
          tasksLoadStatus === "LoadingFirstPage" ? (
            <div className="flex gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-64 w-72 shrink-0" />
              ))}
            </div>
          ) : (
            <KanbanBoard tasks={tasks} canEdit={canEdit} />
          )
        ) : (
          <>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
              >
                All ({project.taskStats.total})
              </Button>
              {TASK_STATUSES.map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                >
                  {getStatusLabel(status)} ({project.taskStats[status]})
                </Button>
              ))}
            </div>

            {tasksLoadStatus === "LoadingFirstPage" ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : tasks.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <p className="text-muted-foreground mb-4">
                    {statusFilter === "all"
                      ? "No tasks yet. Create your first task!"
                      : `No tasks with status "${getStatusLabel(statusFilter)}"`}
                  </p>
                  {statusFilter === "all" && (
                    <Button onClick={() => setCreateTaskOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Task
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="space-y-2">
                  {tasks.map((task) => (
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
                          {task.dueDate && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <Calendar className="h-3 w-3" />
                              Due: {new Date(task.dueDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {TASK_STATUSES.filter((s) => s !== task.status).map((status) => (
                              <DropdownMenuItem
                                key={status}
                                onClick={() => handleStatusChange(task._id, status)}
                              >
                                Move to {getStatusLabel(status)}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {tasksLoadStatus === "CanLoadMore" && (
                  <div className="flex justify-center">
                    <Button variant="outline" onClick={() => loadMore(20)}>
                      Load More Tasks
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Dialogs */}
      <ProjectForm
        open={editOpen}
        onOpenChange={setEditOpen}
        project={project}
      />

      <TaskForm
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
        projectId={projectId}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{project.name}&quot; and all its tasks.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
