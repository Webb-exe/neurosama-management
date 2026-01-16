import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Users } from "lucide-react";

export const Route = createFileRoute("/_dashboard/teams/$id")({
  component: TeamDetailPage,
});

function TeamDetailPage() {
  const { id } = Route.useParams();
  const teamId = id as Id<"teams">;

  const team = useQuery(api.teams.getTeam, { teamId });

  if (team === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (team === null) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-xl font-semibold">Team not found</h2>
        <p className="text-muted-foreground mb-4">
          The team you&apos;re looking for doesn&apos;t exist.
        </p>
        <Button asChild>
          <Link to="/teams">Back to Teams</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/teams">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            {team.name}
          </h1>
        </div>
      </div>

      {/* Team Info */}
      <Card>
        <CardHeader>
          <CardTitle>Team Leader</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={team.leader.imageUrl ?? undefined} />
              <AvatarFallback>
                {(team.leader.firstName?.[0] || "") + (team.leader.lastName?.[0] || "")}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">
                {team.leader.firstName} {team.leader.lastName}
              </p>
              <p className="text-sm text-muted-foreground">Team Leader</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle>Members ({team.memberCount})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {team.members?.map((member) => (
              <div key={member._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={member.imageUrl ?? undefined} />
                  <AvatarFallback>
                    {(member.firstName?.[0] || "") + (member.lastName?.[0] || "")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">
                    {member.firstName} {member.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                </div>
                <Badge variant="secondary">{member.role}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
