import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Bot } from "lucide-react";

export const Route = createFileRoute("/_dashboard/robot/$id")({
  component: SubsystemDetailPage,
});

function SubsystemDetailPage() {
  const { id } = Route.useParams();
  const subsystemId = id as Id<"robotSubsystems">;

  const subsystem = useQuery(api.robot.getSubsystem, { subsystemId });

  if (subsystem === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (subsystem === null) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-xl font-semibold">Subsystem not found</h2>
        <p className="text-muted-foreground mb-4">
          The subsystem you&apos;re looking for doesn&apos;t exist.
        </p>
        <Button asChild>
          <Link to="/robot">Back to Robot</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/robot">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="h-8 w-8 text-primary" />
            {subsystem.name}
          </h1>
          <Badge variant="secondary" className="capitalize mt-2">
            {subsystem.type}
          </Badge>
        </div>
      </div>

      {/* Status & Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {subsystem.status.replace("_", " ")}
            </Badge>
            {subsystem.currentVersion && (
              <span className="font-mono text-sm bg-accent px-2 py-0.5 rounded">
                {subsystem.currentVersion}
              </span>
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>Progress</span>
              <span className="font-medium">{subsystem.progress}%</span>
            </div>
            <Progress value={subsystem.progress} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      {subsystem.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{subsystem.description}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
