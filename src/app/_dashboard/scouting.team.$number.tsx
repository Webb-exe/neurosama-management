import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Trophy,
  Users,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Globe,
  MessageSquare,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { useTimezone } from "@/context/TimezoneContext";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { useFtcScoutTeamPage } from "@/lib/ftcScout/hooks";
import type {
  FtcTeamPageAward,
  FtcTeamPageEvent,
  FtcTeamSummary,
} from "@/lib/ftcScout/queries";

export const Route = createFileRoute("/_dashboard/scouting/team/$number")({
  component: ScoutingTeamPage,
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function formatLocation(location: FtcTeamSummary["location"]): string {
  const parts = [location.city, location.state, location.country].filter(
    Boolean
  );
  return parts.join(", ");
}

// ==========================================
// COMPONENTS
// ==========================================

function TeamHeader({
  team,
  onRefresh,
  isRefreshing,
}: {
  team: FtcTeamSummary;
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/scouting">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Team {team.number}
            </h1>
            <Badge variant="outline">Since {team.rookieYear}</Badge>
          </div>
          <p className="text-muted-foreground ml-10">{team.name}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Location Card */}
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-primary/10 p-2">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Location</p>
              <p className="font-medium truncate">
                {formatLocation(team.location)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* School Card */}
        {team.schoolName && (
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-primary/10 p-2">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">School</p>
                <p className="font-medium truncate">{team.schoolName}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats Card */}
        {team.quickStats && (
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-primary/10 p-2">
                <Trophy className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">OPR</p>
                <p className="font-medium">
                  {team.quickStats.tot.value.toFixed(1)}
                  <span className="text-xs text-muted-foreground ml-1">
                    (#{team.quickStats.tot.rank})
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Website Card */}
        {team.website && (
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-primary/10 p-2">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Website</p>
                <a
                  href={team.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary hover:underline flex items-center gap-1"
                >
                  Visit <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function EventCard({
  eventCode,
  event,
}: {
  eventCode: string;
  event: FtcTeamPageEvent;
}) {
  const { formatDate } = useTimezone();
  const navigate = useNavigate();

  const startDate = new Date(event.start);
  const endDate = new Date(event.end);
  const isSameDay = event.start === event.end;

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() =>
        navigate({
          to: "/events/$code",
          params: { code: eventCode },
        })
      }
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
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
        </div>
      </CardContent>
    </Card>
  );
}

function EventsTab({
  events,
}: {
  events: Array<{
    eventCode: string;
    eventData: FtcTeamPageEvent;
  }>;
}) {
  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Trophy className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No events found for this team.</p>
        </CardContent>
      </Card>
    );
  }

  return (
      <div className="grid gap-3 md:grid-cols-2">
      {events.map((event) => (
        <EventCard
          key={event.eventCode}
          eventCode={event.eventCode}
          event={event.eventData}
        />
      ))}
    </div>
  );
}

function AwardsTab({ awards }: { awards: FtcTeamPageAward[] }) {
  if (awards.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Trophy className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No awards found for this team.</p>
        </CardContent>
      </Card>
    );
  }

  return (
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {awards.map((award, idx) => (
        <Card key={idx}>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-amber-100 dark:bg-amber-900/30 p-3">
              <Trophy className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{award.type}</h3>
                {award.placement > 0 && (
                  <Badge variant="outline">#{award.placement}</Badge>
                )}
              </div>
              {award.personName && (
                <p className="text-sm text-muted-foreground">
                  {award.personName}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ScoutingNotesTab({ teamNumber }: { teamNumber: number }) {
  const { formatDate } = useTimezone();
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState<Id<"teamComments"> | null>(null);
  const [editContent, setEditContent] = useState("");

  // Fetch scouting data
  const scoutingData = useQuery(api.scouting.scouting.getTeamScouting, {
    teamNumber,
  });

  // Mutations
  const addComment = useMutation(api.scouting.scouting.addTeamComment);
  const deleteComment = useMutation(api.scouting.scouting.deleteTeamComment);
  const updateComment = useMutation(api.scouting.scouting.updateTeamComment);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    await addComment({ teamNumber, comment: newComment.trim() });
    setNewComment("");
  };

  const handleDelete = async (commentId: Id<"teamComments">) => {
    await deleteComment({ commentId });
  };

  const handleEdit = (commentId: Id<"teamComments">, content: string) => {
    setEditingId(commentId);
    setEditContent(content);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editContent.trim()) return;
    await updateComment({ commentId: editingId, comment: editContent.trim() });
    setEditingId(null);
    setEditContent("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  return (
    <div className="space-y-4">
      {/* Add new note */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Scouting Note
          </CardTitle>
          <CardDescription>
            Add observations, strengths, weaknesses, or any other notes about
            this team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Enter your scouting notes here..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={4}
          />
          <Button onClick={handleAddComment} disabled={!newComment.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Note
          </Button>
        </CardContent>
      </Card>

      {/* Notes list */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Scouting Notes
            {scoutingData?.comments && (
              <Badge variant="secondary">{scoutingData.comments.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {scoutingData === undefined ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : !scoutingData || scoutingData.comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <MessageSquare className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground text-center">
                No scouting notes yet. Add your first note above!
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {scoutingData.comments.map((comment) => (
                  <Card key={comment.id} className="bg-muted/50">
                    <CardContent className="p-4">
                      {editingId === comment.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleSaveEdit}>
                              <Check className="h-4 w-4 mr-1" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelEdit}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm whitespace-pre-wrap">
                            {comment.comment}
                          </p>
                          <div className="flex items-center justify-between mt-3 pt-2 border-t">
                            <span className="text-xs text-muted-foreground">
                              {formatDate(comment.createdAt, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </span>
                            <div className="flex gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() =>
                                  handleEdit(comment.id, comment.comment)
                                }
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => handleDelete(comment.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatsTab({ team }: { team: FtcTeamSummary }) {
  const stats = team.quickStats;

  if (!stats) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Trophy className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">
            No statistics available for this team yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">
            Total OPR
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.tot.value.toFixed(1)}</div>
          <p className="text-sm text-muted-foreground">Rank #{stats.tot.rank}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Auto OPR</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.auto.value.toFixed(1)}</div>
          <p className="text-sm text-muted-foreground">
            Rank #{stats.auto.rank}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">
            TeleOp OPR
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.dc.value.toFixed(1)}</div>
          <p className="text-sm text-muted-foreground">Rank #{stats.dc.rank}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">
            Endgame OPR
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.eg.value.toFixed(1)}</div>
          <p className="text-sm text-muted-foreground">Rank #{stats.eg.rank}</p>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm">
              Based on <strong>{stats.count}</strong> matches in the{" "}
              <strong>{stats.season}</strong> season.
            </p>
            <Separator />
            <div className="grid gap-4 md:grid-cols-3 pt-2">
              <div>
                <p className="text-sm text-muted-foreground">Auto Contribution</p>
                <p className="text-lg font-medium">
                  {((stats.auto.value / stats.tot.value) * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  TeleOp Contribution
                </p>
                <p className="text-lg font-medium">
                  {((stats.dc.value / stats.tot.value) * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Endgame Contribution
                </p>
                <p className="text-lg font-medium">
                  {((stats.eg.value / stats.tot.value) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ==========================================
// MAIN PAGE COMPONENT
// ==========================================

function ScoutingTeamPage() {
  const params = Route.useParams();
  const teamNumber = parseInt(params.number);
  const {
    data: teamData,
    error: teamError,
    isLoading,
    refetch,
  } = useFtcScoutTeamPage(teamNumber);

  // Invalid team number
  if (isNaN(teamNumber) || teamNumber <= 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Invalid Team Number</h2>
        <p className="text-muted-foreground mb-4">
          Please enter a valid team number.
        </p>
        <Button asChild>
          <Link to="/scouting">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Scouting
          </Link>
        </Button>
      </div>
    );
  }

  // Loading state
  if (isLoading && !teamData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!teamData) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Team Not Found</h2>
        <p className="text-muted-foreground mb-4 text-center max-w-md">
          {teamError ||
            `Team ${teamNumber} could not be found. Please check the team number and try again.`}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/scouting">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Scouting
            </Link>
          </Button>
          <Button onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const team = teamData;
  const events = team.events.map((event) => ({
    eventCode: event.event.code,
    eventData: event.event,
  }));
  const awards = team.events.flatMap((event) => event.awards);

  return (
    <div className="space-y-6">
      <TeamHeader team={team} onRefresh={refetch} isRefreshing={isLoading} />

      <Tabs defaultValue="scouting" className="w-full">
        <TabsList>
          <TabsTrigger value="scouting" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Scouting Notes
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2">
            <Trophy className="h-4 w-4" />
            Stats
          </TabsTrigger>
          <TabsTrigger value="events" className="gap-2">
            <Calendar className="h-4 w-4" />
            Events ({events.length})
          </TabsTrigger>
          <TabsTrigger value="awards" className="gap-2">
            <Trophy className="h-4 w-4" />
            Awards ({awards.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scouting" className="mt-4">
          <ScoutingNotesTab teamNumber={teamNumber} />
        </TabsContent>

        <TabsContent value="stats" className="mt-4">
          <StatsTab team={team} />
        </TabsContent>

        <TabsContent value="events" className="mt-4">
          <EventsTab events={events} />
        </TabsContent>

        <TabsContent value="awards" className="mt-4">
          <AwardsTab awards={awards} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
