import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GanttChart,
  Trophy,
  Bot,
  Flag,
  CheckCircle2,
  Circle,
  Clock,
} from "lucide-react";

export const Route = createFileRoute("/_dashboard/timeline")({
  component: TimelinePage,
});

const statusColors = {
  concept: "bg-slate-500",
  design: "bg-purple-500",
  prototyping: "bg-yellow-500",
  testing: "bg-blue-500",
  competition_ready: "bg-green-500",
  needs_repair: "bg-red-500",
};

function TimelinePage() {
  const competitions = useQuery(api.competitions.listCompetitions, {
    upcoming: true,
    paginationOpts: { numItems: 10, cursor: null },
  });
  const subsystems = useQuery(api.robot.listSubsystems);
  const readiness = useQuery(api.robot.getRobotReadiness);
  const seasonStats = useQuery(api.competitions.getSeasonStats);

  const now = Date.now();

  // Calculate season progress (assuming season is ~8 months from September to April)
  const seasonStart = new Date(new Date().getFullYear(), 8, 1).getTime(); // September
  const seasonEnd = new Date(new Date().getFullYear() + 1, 3, 30).getTime(); // April
  const seasonProgress = Math.min(
    100,
    Math.max(0, ((now - seasonStart) / (seasonEnd - seasonStart)) * 100)
  );

  if (
    competitions === undefined ||
    subsystems === undefined ||
    readiness === undefined
  ) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const upcomingCompetitions = competitions.page.filter(
    (c) => c.startDate >= now
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <GanttChart className="h-8 w-8 text-primary" />
          Season Timeline
        </h1>
        <p className="text-muted-foreground">
          Track your FTC season progress and milestones
        </p>
      </div>

      {/* Season Overview */}
      <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <h2 className="text-lg font-semibold mb-4">Season Progress</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Season Timeline</span>
                    <span className="font-medium">{Math.round(seasonProgress)}%</span>
                  </div>
                  <div className="relative h-6 bg-muted rounded-full overflow-hidden">
                    <div
                      className="absolute h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all"
                      style={{ width: `${seasonProgress}%` }}
                    />
                    {/* Competition markers */}
                    {upcomingCompetitions.map((comp) => {
                      const compProgress =
                        ((comp.startDate - seasonStart) / (seasonEnd - seasonStart)) * 100;
                      return (
                        <div
                          key={comp._id}
                          className="absolute top-0 h-full w-1 bg-orange-500"
                          style={{ left: `${compProgress}%` }}
                          title={comp.name}
                        />
                      );
                    })}
                    {/* Today marker */}
                    <div
                      className="absolute top-0 h-full w-0.5 bg-white"
                      style={{ left: `${seasonProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Sep (Kickoff)</span>
                    <span>Apr (Worlds)</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-primary">
                  {readiness.overallProgress}%
                </div>
                <p className="text-sm text-muted-foreground">Robot Ready</p>
              </div>
              <div>
                <div className="text-3xl font-bold">
                  {upcomingCompetitions.length}
                </div>
                <p className="text-sm text-muted-foreground">Competitions Left</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-500">
                  {seasonStats?.wins || 0}
                </div>
                <p className="text-sm text-muted-foreground">Wins</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Competition Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-orange-500" />
            Competition Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingCompetitions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No upcoming competitions scheduled
            </p>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
              <div className="space-y-6">
                {upcomingCompetitions.map((comp, index) => {
                  const daysUntil = Math.ceil(
                    (comp.startDate - now) / (1000 * 60 * 60 * 24)
                  );
                  const isFirst = index === 0;
                  
                  return (
                    <div key={comp._id} className="relative pl-10">
                      <div
                        className={`absolute left-2 top-1 w-5 h-5 rounded-full flex items-center justify-center ${
                          isFirst ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}
                      >
                        {isFirst ? (
                          <Flag className="h-3 w-3" />
                        ) : (
                          <Circle className="h-2 w-2" />
                        )}
                      </div>
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{comp.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {comp.location}
                          </p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="capitalize">
                              {comp.type.replace("_", " ")}
                            </Badge>
                            <Badge
                              variant={
                                comp.registrationStatus === "confirmed"
                                  ? "default"
                                  : "secondary"
                              }
                              className="capitalize"
                            >
                              {comp.registrationStatus.replace("_", " ")}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{daysUntil}</div>
                          <p className="text-xs text-muted-foreground">days</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {new Date(comp.startDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subsystem Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Subsystem Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subsystems.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No subsystems tracked yet
            </p>
          ) : (
            <div className="space-y-4">
              {subsystems.map((subsystem) => {
                const statusColor =
                  statusColors[subsystem.status as keyof typeof statusColors] ||
                  "bg-slate-500";
                
                return (
                  <div key={subsystem._id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{subsystem.name}</span>
                        <Badge
                          variant="outline"
                          className={`${statusColor} bg-opacity-20 border-0 capitalize`}
                        >
                          <div
                            className={`w-2 h-2 rounded-full ${statusColor} mr-1.5`}
                          />
                          {subsystem.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <span className="text-sm font-medium">
                        {subsystem.progress}%
                      </span>
                    </div>
                    <div className="relative h-4 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`absolute h-full ${statusColor} transition-all`}
                        style={{ width: `${subsystem.progress}%` }}
                      />
                      {/* Milestones */}
                      <div className="absolute top-0 h-full w-px bg-border left-1/4" />
                      <div className="absolute top-0 h-full w-px bg-border left-1/2" />
                      <div className="absolute top-0 h-full w-px bg-border left-3/4" />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Concept</span>
                      <span>Design</span>
                      <span>Prototype</span>
                      <span>Testing</span>
                      <span>Ready</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Milestones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-green-500" />
            Season Milestones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Robot Design Complete", target: 25, icon: Bot },
              { label: "First Competition", target: 40, icon: Trophy },
              { label: "Robot Iteration Done", target: 60, icon: Clock },
              { label: "Competition Ready", target: 85, icon: CheckCircle2 },
            ].map((milestone) => {
              const achieved = seasonProgress >= milestone.target;
              const Icon = milestone.icon;
              
              return (
                <div
                  key={milestone.label}
                  className={`p-4 rounded-lg border ${
                    achieved
                      ? "border-green-500/50 bg-green-500/5"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon
                      className={`h-5 w-5 ${
                        achieved ? "text-green-500" : "text-muted-foreground"
                      }`}
                    />
                    {achieved && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <p className="font-medium">{milestone.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {milestone.target}% of season
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
