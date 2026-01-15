import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Bot,
  CheckSquare,
  Calendar,
  Activity,
  BookOpen,
  Package,
  Target,
  ArrowRight,
  Wrench,
  AlertTriangle,
} from "lucide-react";

export const Route = createFileRoute("/_dashboard/")({
  component: DashboardPage,
});

// Countdown Timer Component
function CountdownWidget() {
  const nextCompetition = useQuery(api.competitions.getNextCompetition);

  if (nextCompetition === undefined) {
    return (
      <Card className="col-span-full lg:col-span-2 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
        <CardContent className="p-6">
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (nextCompetition === null) {
    return (
      <Card className="col-span-full lg:col-span-2 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
        <CardContent className="p-6 text-center">
          <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold">No Upcoming Competitions</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add your first competition to start tracking
          </p>
          <Button asChild size="sm">
            <Link to="/competitions">Add Competition</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full lg:col-span-2 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Next Competition
            </p>
            <h2 className="text-2xl font-bold">{nextCompetition.name}</h2>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary">{nextCompetition.type.replace("_", " ")}</Badge>
              <span className="text-sm text-muted-foreground">{nextCompetition.location}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold text-primary">{nextCompetition.daysUntil}</div>
            <p className="text-sm text-muted-foreground">days to go</p>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Badge
            variant={nextCompetition.registrationStatus === "confirmed" ? "default" : "outline"}
          >
            {nextCompetition.registrationStatus.replace("_", " ")}
          </Badge>
          <Link
            to="/competitions"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            View Details <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// Robot Readiness Widget
function RobotReadinessWidget() {
  const readiness = useQuery(api.robot.getRobotReadiness);

  if (readiness === undefined) {
    return (
      <Card className="col-span-full lg:col-span-1">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const statusColors = {
    competition_ready: "bg-green-500",
    testing: "bg-blue-500",
    prototyping: "bg-yellow-500",
    design: "bg-purple-500",
    concept: "bg-slate-500",
    needs_repair: "bg-red-500",
  };

  return (
    <Card className="col-span-full lg:col-span-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          Robot Readiness
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-3xl font-bold">{readiness.overallProgress}%</span>
          <span className="text-sm text-muted-foreground">
            {readiness.subsystemsReady}/{readiness.totalSubsystems} ready
          </span>
        </div>
        <Progress value={readiness.overallProgress} className="h-2" />
        
        <div className="grid grid-cols-3 gap-2 text-center">
          {Object.entries(readiness.byStatus).map(([status, count]) => {
            if (count === 0) return null;
            return (
              <div key={status} className="text-xs">
                <div
                  className={`w-2 h-2 rounded-full ${statusColors[status as keyof typeof statusColors]} mx-auto mb-1`}
                />
                <span className="font-medium">{count}</span>
                <p className="text-muted-foreground truncate">
                  {status.replace("_", " ")}
                </p>
              </div>
            );
          })}
        </div>
        
        {readiness.needsAttention.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-yellow-500 flex items-center gap-1 mb-2">
              <AlertTriangle className="h-3 w-3" />
              Needs Attention
            </p>
            {readiness.needsAttention.slice(0, 2).map((s) => (
              <div key={s._id} className="text-xs text-muted-foreground">
                {s.name} ({s.progress}%)
              </div>
            ))}
          </div>
        )}
        
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link to="/robot">View All Subsystems</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

// Quick Stats Cards
function StatsCards() {
  const taskStats = useQuery(api.tasks.getDashboardStats);
  const competitionStats = useQuery(api.competitions.getSeasonStats);
  const inventoryStats = useQuery(api.inventory.getInventoryStats);
  const meetingStats = useQuery(api.meetings.getMeetingStats);

  if (
    taskStats === undefined ||
    competitionStats === undefined ||
    inventoryStats === undefined ||
    meetingStats === undefined
  ) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: "My Tasks",
      value: taskStats.myTasks,
      description: `${taskStats.tasksByStatus.in_progress} in progress`,
      icon: CheckSquare,
      href: "/tasks",
      color: "text-blue-500",
    },
    {
      title: "Competitions",
      value: competitionStats.upcomingCompetitions,
      description: `${competitionStats.wins}W-${competitionStats.losses}L record`,
      icon: Trophy,
      href: "/competitions",
      color: "text-orange-500",
    },
    {
      title: "Parts",
      value: inventoryStats.totalParts,
      description: inventoryStats.lowStockCount > 0 ? `${inventoryStats.lowStockCount} low stock` : "All stocked",
      icon: Package,
      href: "/inventory",
      color: inventoryStats.lowStockCount > 0 ? "text-yellow-500" : "text-green-500",
    },
    {
      title: "Meetings",
      value: meetingStats.upcomingMeetings,
      description: `${meetingStats.avgAttendance}% avg attendance`,
      icon: Calendar,
      href: "/meetings",
      color: "text-purple-500",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Link key={stat.title} to={stat.href}>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

// Activity Feed Widget
function ActivityFeedWidget() {
  const activities = useQuery(api.activity.getRecentActivity, { limit: 6 });

  if (activities === undefined) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "task_created":
      case "task_completed":
      case "task_updated":
        return <CheckSquare className="h-4 w-4 text-blue-500" />;
      case "notebook_entry":
        return <BookOpen className="h-4 w-4 text-purple-500" />;
      case "subsystem_update":
        return <Wrench className="h-4 w-4 text-green-500" />;
      case "competition_result":
      case "award_won":
        return <Trophy className="h-4 w-4 text-orange-500" />;
      case "part_added":
        return <Package className="h-4 w-4 text-cyan-500" />;
      case "meeting_scheduled":
        return <Calendar className="h-4 w-4 text-pink-500" />;
      case "scouting_report":
        return <Target className="h-4 w-4 text-yellow-500" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatTime = (timestamp: number) => {
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
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Recent Activity
          </CardTitle>
          <Link to="/activity" className="text-xs text-primary hover:underline">
            View All
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No recent activity
          </p>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity._id} className="flex items-start gap-3">
                <div className="mt-0.5">{getActivityIcon(activity.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{activity.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{activity.userName}</span>
                    <span>·</span>
                    <span>{formatTime(activity.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Upcoming Events Widget
function UpcomingEventsWidget() {
  const events = useQuery(api.calendar.getUpcomingEventsSummary, { limit: 5 });

  if (events === undefined) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Upcoming Events
          </CardTitle>
          <Link to="/calendar" className="text-xs text-primary hover:underline">
            View Calendar
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No upcoming events
          </p>
        ) : (
          <div className="space-y-2">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div
                  className="w-1 h-8 rounded-full"
                  style={{ backgroundColor: event.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{event.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.startDate).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {event.daysUntil === 0
                    ? "Today"
                    : event.daysUntil === 1
                    ? "Tomorrow"
                    : `${event.daysUntil}d`}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Task Status Overview
function TaskOverviewWidget() {
  const stats = useQuery(api.tasks.getDashboardStats);

  if (stats === undefined) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const statusLabels = {
    backlog: { label: "Backlog", color: "bg-slate-500" },
    todo: { label: "To Do", color: "bg-blue-500" },
    in_progress: { label: "In Progress", color: "bg-yellow-500" },
    review: { label: "Review", color: "bg-purple-500" },
    done: { label: "Done", color: "bg-green-500" },
  };

  const completionRate =
    stats.totalTasks > 0
      ? Math.round((stats.tasksByStatus.done / stats.totalTasks) * 100)
      : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            Task Overview
          </CardTitle>
          <Link to="/tasks" className="text-xs text-primary hover:underline">
            View Tasks
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span>Completion Rate</span>
          <span className="font-medium">{completionRate}%</span>
        </div>
        <Progress value={completionRate} className="h-2" />
        
        <div className="grid grid-cols-5 gap-2 text-center">
          {(Object.keys(statusLabels) as (keyof typeof statusLabels)[]).map(
            (status) => (
              <div key={status}>
                <div
                  className={`w-2 h-2 rounded-full ${statusLabels[status].color} mx-auto mb-1`}
                />
                <div className="text-lg font-bold">{stats.tasksByStatus[status]}</div>
                <div className="text-[10px] text-muted-foreground">
                  {statusLabels[status].label}
                </div>
              </div>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Recent Notebook Entries Widget
function RecentNotebookWidget() {
  const entries = useQuery(api.notebook.getRecentEntries, { limit: 4 });

  if (entries === undefined) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const categoryColors: Record<string, string> = {
    design: "bg-purple-500",
    build: "bg-orange-500",
    code: "bg-blue-500",
    outreach: "bg-pink-500",
    business: "bg-green-500",
    team: "bg-cyan-500",
    strategy: "bg-yellow-500",
    testing: "bg-red-500",
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Engineering Notebook
          </CardTitle>
          <Link to="/notebook" className="text-xs text-primary hover:underline">
            View All
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-2">
              No notebook entries yet
            </p>
            <Button asChild size="sm" variant="outline">
              <Link to="/notebook">Create Entry</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <Link
                key={entry._id}
                to="/notebook/$id"
                params={{ id: entry._id }}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div
                  className={`w-2 h-8 rounded-full ${categoryColors[entry.category]}`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{entry.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.authorName} ·{" "}
                    {new Date(entry.entryDate).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs capitalize">
                  {entry.category}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Main Dashboard
function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s your FTC team overview.
        </p>
      </div>

      {/* Top Row - Countdown & Robot Readiness */}
      <div className="grid gap-4 lg:grid-cols-3">
        <CountdownWidget />
        <RobotReadinessWidget />
      </div>

      {/* Stats Cards */}
      <StatsCards />

      {/* Main Content Grid */}
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <TaskOverviewWidget />
        <UpcomingEventsWidget />
        <ActivityFeedWidget />
        <RecentNotebookWidget />
      </div>
    </div>
  );
}
