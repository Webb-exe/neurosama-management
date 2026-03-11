import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Trophy,
  Users,
  ArrowRight,
  Calendar,
  MapPin,
  MessageSquare,
} from "lucide-react";
import { useTimezone } from "@/context/TimezoneContext";
import { useState } from "react";
import { useFtcScoutConfiguredTeamEvents } from "@/lib/ftcScout/hooks";
import type { FtcConfiguredTeamEvent } from "@/lib/ftcScout/queries";

export const Route = createFileRoute("/_dashboard/scouting/")({
  component: ScoutingPage,
});

// ==========================================
// COMPONENTS
// ==========================================

function EventSearchCard({
  event,
  eventCode,
}: {
  event: FtcConfiguredTeamEvent;
  eventCode: string;
}) {
  const { formatDate } = useTimezone();
  const navigate = useNavigate();

  const startDate = new Date(event.start);
  const endDate = new Date(event.end);
  const isSameDay = event.start === event.end;

  const handleNavigate = () => {
    navigate({ to: "/events/$code", params: { code: eventCode } });
  };

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleNavigate}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="h-4 w-4 text-primary" />
              <Badge variant="outline" className="text-xs">
                {event.type}
              </Badge>
              {event.finished && (
                <Badge variant="secondary" className="text-xs">
                  Completed
                </Badge>
              )}
              {event.ongoing && (
                <Badge className="text-xs bg-green-600">Live</Badge>
              )}
            </div>
            <h3 className="font-semibold truncate">{event.name}</h3>
            <p className="text-sm text-muted-foreground">{eventCode}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {isSameDay
                  ? formatDate(startDate.getTime(), {
                      month: "short",
                      day: "numeric",
                    })
                  : `${formatDate(startDate.getTime(), {
                      month: "short",
                      day: "numeric",
                    })} - ${formatDate(endDate.getTime(), {
                      month: "short",
                      day: "numeric",
                    })}`}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {event.location.city}, {event.location.state}
              </span>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

function ScoutedTeamCard({
  teamCode,
  commentCount,
}: {
  teamCode: string;
  commentCount: number;
}) {
  const navigate = useNavigate();

  const handleNavigate = () => {
    navigate({
      to: "/scouting/team/$number",
      params: { number: teamCode },
    });
  };

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleNavigate}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Team {teamCode}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {commentCount} note{commentCount !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

// ==========================================
// MAIN PAGE COMPONENT
// ==========================================

function ScoutingPage() {
  const [eventSearch, setEventSearch] = useState("");
  const [teamSearch, setTeamSearch] = useState("");
  const navigate = useNavigate();
  const ftcSettings = useQuery(api.settings.settings.getFtcSettings, {});

  const { data: teamEventsData, isLoading: isEventsLoading } =
    useFtcScoutConfiguredTeamEvents(
      ftcSettings?.ftcTeamNumber ?? null,
    );

  const showTeamEventsLoading =
    ftcSettings === undefined || (isEventsLoading && !teamEventsData);

  const noConfiguredTeam = ftcSettings?.ftcTeamNumber === null;
  const teamEventsState = noConfiguredTeam ? null : teamEventsData;

  const scoutedTeams = useQuery(api.scouting.scouting.listScoutedTeams, {});

  const handleEventSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (eventSearch.trim()) {
      navigate({
        to: "/events/$code",
        params: { code: eventSearch.trim().toUpperCase() },
      });
    }
  };

  const handleTeamSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const teamNumber = parseInt(teamSearch.trim());
    if (!isNaN(teamNumber) && teamNumber > 0) {
      navigate({
        to: "/scouting/team/$number",
        params: { number: teamNumber.toString() },
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Search className="h-8 w-8" />
          Scouting
        </h1>
        <p className="text-muted-foreground">
          Search and scout FTC events and teams
        </p>
      </div>

      {/* Search Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Event Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Search Event
            </CardTitle>
            <CardDescription>
              Enter an event code to view event details, matches, and teams
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEventSearch} className="flex gap-2">
              <Input
                placeholder="Event code (e.g., USTXHOU)"
                value={eventSearch}
                onChange={(e) => setEventSearch(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={!eventSearch.trim()}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Team Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Search Team
            </CardTitle>
            <CardDescription>
              Enter a team number to view team info, history, and add scouting
              notes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTeamSearch} className="flex gap-2">
              <Input
                placeholder="Team number (e.g., 12345)"
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                type="number"
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={!teamSearch.trim() || isNaN(parseInt(teamSearch))}
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Recent/Team Events */}
      <Tabs defaultValue="team-events" className="w-full">
        <TabsList>
          <TabsTrigger value="team-events" className="gap-2">
            <Trophy className="h-4 w-4" />
            Team Events
          </TabsTrigger>
          <TabsTrigger value="scouted-teams" className="gap-2">
            <Users className="h-4 w-4" />
            Scouted Teams
          </TabsTrigger>
        </TabsList>

        {/* Team Events Tab */}
        <TabsContent value="team-events" className="mt-4">
          {showTeamEventsLoading ? (
            <div className="grid gap-3 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : noConfiguredTeam ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Trophy className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground text-center">
                  No team configured. Configure your team in admin settings to
                  see your events here.
                </p>
              </CardContent>
            </Card>
          ) : !teamEventsState || teamEventsState.events.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Trophy className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground text-center">
                  No team events were found in FTC Scout.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {teamEventsState.events.map((eventData) => (
                <EventSearchCard
                  key={eventData.event.code}
                  event={eventData.event}
                  eventCode={eventData.event.code}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Scouted Teams Tab */}
        <TabsContent value="scouted-teams" className="mt-4">
          {scoutedTeams === undefined ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-1/2 mb-2" />
                    <Skeleton className="h-4 w-1/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : scoutedTeams.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Users className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground text-center">
                  No teams scouted yet. Search for a team to start adding
                  scouting notes.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {scoutedTeams.map((team) => (
                <ScoutedTeamCard
                  key={team.id}
                  teamCode={team.teamCode}
                  commentCount={team.commentCount}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
