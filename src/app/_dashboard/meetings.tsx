import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { usePaginatedQuery, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, Plus, MapPin, Clock, Users } from "lucide-react";
import { FormattedDate } from "@/components/ui/timezone-date-input";

export const Route = createFileRoute("/_dashboard/meetings")({
  component: MeetingsPage,
});

function MeetingsPage() {
  const [showUpcoming, setShowUpcoming] = useState(true);

  const { results, status, loadMore } = usePaginatedQuery(
    api.meetings.listMeetings,
    { upcoming: showUpcoming },
    { initialNumItems: 12 }
  );

  const stats = useQuery(api.meetings.getMeetingStats);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <CalendarDays className="h-8 w-8 text-primary" />
            Meetings
          </h1>
          <p className="text-muted-foreground">
            Schedule and track team meetings
          </p>
        </div>
        <Button asChild>
          <Link to="/meetings/$id" params={{ id: "new" }}>
            <Plus className="h-4 w-4 mr-2" />
            Schedule Meeting
          </Link>
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.upcomingMeetings}</div>
              <p className="text-xs text-muted-foreground">Upcoming</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.thisWeek}</div>
              <p className="text-xs text-muted-foreground">This Week</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.totalMeetings}</div>
              <p className="text-xs text-muted-foreground">Total Meetings</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-500">{stats.avgAttendance}%</div>
              <p className="text-xs text-muted-foreground">Avg Attendance</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        <Button
          variant={showUpcoming ? "default" : "outline"}
          size="sm"
          onClick={() => setShowUpcoming(true)}
        >
          Upcoming
        </Button>
        <Button
          variant={!showUpcoming ? "default" : "outline"}
          size="sm"
          onClick={() => setShowUpcoming(false)}
        >
          All
        </Button>
      </div>

      {/* Meetings List */}
      {status === "LoadingFirstPage" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No meetings found</h3>
            <p className="text-muted-foreground mb-4">
              {showUpcoming
                ? "No upcoming meetings scheduled"
                : "Schedule your first meeting to get started"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((meeting) => (
              <Link key={meeting._id} to="/meetings/$id" params={{ id: meeting._id }}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{meeting.title}</CardTitle>
                      <Badge variant="outline" className="capitalize">
                        {meeting.type.replace("_", " ")}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <FormattedDate timestamp={meeting.startTime} format="datetime" />
                    </div>
                    {meeting.location && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {meeting.location}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {meeting.attendeeCount} attendees
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {status === "CanLoadMore" && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => loadMore(12)}>
                Load More
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
