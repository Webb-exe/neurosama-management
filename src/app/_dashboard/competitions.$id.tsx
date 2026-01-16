import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Trophy, MapPin, Calendar, Clock } from "lucide-react";
import { FormattedDate } from "@/components/ui/timezone-date-input";

export const Route = createFileRoute("/_dashboard/competitions/$id")({
  component: CompetitionDetailPage,
});

function CompetitionDetailPage() {
  const { id } = Route.useParams();
  const competitionId = id as Id<"competitions">;

  const competition = useQuery(api.competitions.getCompetition, { competitionId });

  if (competition === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (competition === null) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-xl font-semibold">Competition not found</h2>
        <p className="text-muted-foreground mb-4">
          The competition you&apos;re looking for doesn&apos;t exist.
        </p>
        <Button asChild>
          <Link to="/competitions">Back to Competitions</Link>
        </Button>
      </div>
    );
  }

  const now = Date.now();
  const isPast = competition.endDate < now;
  const isOngoing = competition.startDate <= now && competition.endDate >= now;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/competitions">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Trophy className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">{competition.name}</h1>
            {isOngoing && <Badge className="bg-green-500">Ongoing</Badge>}
            {isPast && <Badge variant="secondary">Completed</Badge>}
          </div>
        </div>
      </div>

      {/* Competition Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              <Badge variant="secondary" className="capitalize mt-1">
                {competition.type.replace("_", " ")}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Registration Status</p>
              <Badge
                variant={competition.registrationStatus === "confirmed" ? "default" : "outline"}
                className="capitalize mt-1"
              >
                {competition.registrationStatus.replace("_", " ")}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Location & Dates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{competition.location}</span>
            </div>
            {competition.address && (
              <p className="text-sm text-muted-foreground ml-6">{competition.address}</p>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                <FormattedDate timestamp={competition.startDate} format="date" />
                {competition.startDate !== competition.endDate && (
                  <> - <FormattedDate timestamp={competition.endDate} format="date" /></>
                )}
              </span>
            </div>
            {competition.registrationDeadline && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  Registration Deadline: <FormattedDate timestamp={competition.registrationDeadline} format="date" />
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {competition.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{competition.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
