import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

type TeamCardProps = {
  team: {
    _id: Id<"teams">;
    name: string;
    memberCount: number;
    leader: {
      _id: Id<"users">;
      firstName: string | null;
      lastName: string | null;
      imageUrl: string | null;
    };
  };
};

export function TeamCard({ team }: TeamCardProps) {
  const leaderName =
    team.leader.firstName || team.leader.lastName
      ? `${team.leader.firstName ?? ""} ${team.leader.lastName ?? ""}`.trim()
      : "Unknown";

  const initials = leaderName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Link to="/teams/$id" params={{ id: team._id }}>
      <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            {team.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={team.leader.imageUrl ?? undefined} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{leaderName}</p>
              <p className="text-xs text-muted-foreground">Team Leader</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <Badge variant="secondary">
              {team.memberCount} {team.memberCount === 1 ? "member" : "members"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
