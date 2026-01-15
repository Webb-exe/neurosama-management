import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, CalendarDays, MapPin, Clock } from "lucide-react";
import { FormattedDate } from "@/components/ui/timezone-date-input";

export const Route = createFileRoute("/_dashboard/meetings/$id")({
  component: MeetingDetailPage,
});

function MeetingDetailPage() {
  const { id } = Route.useParams();
  const meetingId = id as Id<"meetings">;

  const meeting = useQuery(api.meetings.getMeeting, { meetingId });

  if (meeting === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (meeting === null) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-xl font-semibold">Meeting not found</h2>
        <p className="text-muted-foreground mb-4">
          The meeting you&apos;re looking for doesn&apos;t exist.
        </p>
        <Button asChild>
          <Link to="/meetings">Back to Meetings</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/meetings">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <CalendarDays className="h-8 w-8 text-primary" />
            {meeting.title}
          </h1>
          <Badge variant="outline" className="capitalize mt-2">
            {meeting.type.replace("_", " ")}
          </Badge>
        </div>
      </div>

      {/* Meeting Info */}
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>
              <FormattedDate timestamp={meeting.startTime} format="datetime" />
              {meeting.endTime && (
                <> - <FormattedDate timestamp={meeting.endTime} format="time" /></>
              )}
            </span>
          </div>
          {meeting.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{meeting.location}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agenda */}
      {meeting.agenda && (
        <Card>
          <CardHeader>
            <CardTitle>Agenda</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{meeting.agenda}</p>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {meeting.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{meeting.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
