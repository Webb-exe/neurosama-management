import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Id } from "@/convex/_generated/dataModel";

type ProjectCardProps = {
  project: {
    _id: Id<"projects">;
    name: string;
    description?: string;
    taskStats: {
      total: number;
      backlog: number;
      todo: number;
      in_progress: number;
      review: number;
      done: number;
    };
    permission: "admin" | "team_leader" | "member" | "none";
  };
};

export function ProjectCard({ project }: ProjectCardProps) {
  const completionRate =
    project.taskStats.total > 0
      ? Math.round((project.taskStats.done / project.taskStats.total) * 100)
      : 0;

  const activeTasks =
    project.taskStats.todo +
    project.taskStats.in_progress +
    project.taskStats.review;

  return (
    <Link to="/projects/$id" params={{ id: project._id }}>
      <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg line-clamp-1">{project.name}</CardTitle>
            {project.permission !== "member" && (
              <Badge variant="outline" className="text-xs shrink-0">
                {project.permission === "admin" ? "Admin" : "Leader"}
              </Badge>
            )}
          </div>
          {project.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {project.description}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{completionRate}%</span>
          </div>
          <Progress value={completionRate} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{project.taskStats.total} tasks</span>
            <span>{activeTasks} active</span>
            <span>{project.taskStats.done} done</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
