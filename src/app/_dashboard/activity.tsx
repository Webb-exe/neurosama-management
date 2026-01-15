import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Activity,
  CheckSquare,
  BookOpen,
  Wrench,
  Trophy,
  Package,
  Calendar,
  Target,
  Award,
  UserPlus,
} from "lucide-react";

export const Route = createFileRoute("/_dashboard/activity")({
  component: ActivityPage,
});

const activityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  task_created: CheckSquare,
  task_completed: CheckSquare,
  task_updated: CheckSquare,
  project_created: Activity,
  notebook_entry: BookOpen,
  subsystem_update: Wrench,
  competition_result: Trophy,
  part_added: Package,
  meeting_scheduled: Calendar,
  scouting_report: Target,
  award_won: Award,
  member_joined: UserPlus,
};

const activityColors: Record<string, string> = {
  task_created: "text-blue-500",
  task_completed: "text-green-500",
  task_updated: "text-yellow-500",
  project_created: "text-purple-500",
  notebook_entry: "text-purple-500",
  subsystem_update: "text-green-500",
  competition_result: "text-orange-500",
  part_added: "text-cyan-500",
  meeting_scheduled: "text-pink-500",
  scouting_report: "text-yellow-500",
  award_won: "text-amber-500",
  member_joined: "text-indigo-500",
};

function formatTime(timestamp: number) {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

function formatActivityType(type: string) {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function ActivityPage() {
  const activities = useQuery(api.activity.getRecentActivity, { limit: 50 });
  const stats = useQuery(api.activity.getActivityStats, { daysBack: 7 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Activity className="h-8 w-8 text-primary" />
          Activity Feed
        </h1>
        <p className="text-muted-foreground">
          Recent activity across your team
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">This Week</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-500">{stats.byType.tasks}</div>
              <p className="text-xs text-muted-foreground">Tasks</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-500">{stats.byType.notebook}</div>
              <p className="text-xs text-muted-foreground">Notebook</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-500">{stats.byType.robot}</div>
              <p className="text-xs text-muted-foreground">Robot</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-500">{stats.byType.competitions}</div>
              <p className="text-xs text-muted-foreground">Competitions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-pink-500">{stats.byType.meetings}</div>
              <p className="text-xs text-muted-foreground">Meetings</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Activity List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {activities === undefined ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No activity yet</h3>
              <p className="text-muted-foreground">
                Activity will appear here as your team works on projects
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {activities.map((activity, index) => {
                const Icon = activityIcons[activity.type] || Activity;
                const color = activityColors[activity.type] || "text-muted-foreground";
                
                return (
                  <div key={activity._id}>
                    <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={activity.userImage || undefined} />
                        <AvatarFallback>
                          {activity.userName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${color}`} />
                          <span className="font-medium">{activity.title}</span>
                        </div>
                        {activity.description && (
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {activity.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {activity.userName}
                          </span>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(activity.createdAt)}
                          </span>
                          <Badge variant="outline" className="text-xs ml-auto">
                            {formatActivityType(activity.type)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    {index < activities.length - 1 && (
                      <div className="ml-9 border-l-2 border-border h-4" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
