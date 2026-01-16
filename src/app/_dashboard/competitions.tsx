import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { usePaginatedQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Trophy,
  Plus,
  Calendar,
  MapPin,
  Clock,
} from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { FormattedDate } from "@/components/ui/timezone-date-input";
import { useTimezone } from "@/context/TimezoneContext";
import { ScrollArea } from "@/components/ui/scroll-area";

export const Route = createFileRoute("/_dashboard/competitions")({
  component: CompetitionsPage,
});

const competitionTypes = [
  { value: "scrimmage", label: "Scrimmage" },
  { value: "league_meet", label: "League Meet" },
  { value: "qualifier", label: "Qualifier" },
  { value: "championship", label: "Championship" },
  { value: "worlds", label: "Worlds" },
];

const registrationStatuses = [
  { value: "not_started", label: "Not Started" },
  { value: "registered", label: "Registered" },
  { value: "waitlisted", label: "Waitlisted" },
  { value: "confirmed", label: "Confirmed" },
];

function CompetitionCard({ competition }: { competition: {
  _id: string;
  name: string;
  type: string;
  location: string;
  startDate: number;
  endDate: number;
  registrationStatus: string;
}}) {
  const now = Date.now();
  const isPast = competition.endDate < now;
  const isOngoing = competition.startDate <= now && competition.endDate >= now;
  const daysUntil = Math.ceil((competition.startDate - now) / (1000 * 60 * 60 * 24));

  return (
    <Link to="/competitions/$id" params={{ id: competition._id }}>
      <Card className={`hover:border-primary/50 transition-colors cursor-pointer ${isPast ? "opacity-60" : ""}`}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Trophy className={`h-5 w-5 ${isOngoing ? "text-green-500" : isPast ? "text-muted-foreground" : "text-primary"}`} />
              <CardTitle className="text-lg">{competition.name}</CardTitle>
            </div>
            {isOngoing && <Badge className="bg-green-500">Ongoing</Badge>}
            {isPast && <Badge variant="secondary">Completed</Badge>}
            {!isPast && !isOngoing && (
              <Badge variant="outline">{daysUntil}d</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <Badge variant="secondary" className="capitalize">
            {competition.type.replace("_", " ")}
          </Badge>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {competition.location}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <FormattedDate timestamp={competition.startDate} format="weekday" />
            {competition.startDate !== competition.endDate && (
              <> - <FormattedDate timestamp={competition.endDate} format="weekday" /></>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Badge
              variant={competition.registrationStatus === "confirmed" ? "default" : "outline"}
              className="capitalize"
            >
              {competition.registrationStatus.replace("_", " ")}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function CompetitionsPage() {
  const { dateToUtcTimestamp } = useTimezone();
  const [showUpcoming, setShowUpcoming] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [registrationDeadline, setRegistrationDeadline] = useState<Date | undefined>(undefined);
  const [formData, setFormData] = useState({
    name: "",
    type: "qualifier" as const,
    location: "",
    address: "",
    registrationStatus: "not_started" as const,
    notes: "",
  });

  const { results, status, loadMore } = usePaginatedQuery(
    api.competitions.listCompetitions,
    { upcoming: showUpcoming },
    { initialNumItems: 12 }
  );

  const createCompetition = useMutation(api.competitions.createCompetition);

  const handleCreate = async () => {
    if (!formData.name || !formData.location || !startDate) return;

    await createCompetition({
      name: formData.name,
      type: formData.type,
      location: formData.location,
      address: formData.address || undefined,
      startDate: dateToUtcTimestamp(startDate),
      endDate: endDate ? dateToUtcTimestamp(endDate) : dateToUtcTimestamp(startDate),
      registrationDeadline: registrationDeadline ? dateToUtcTimestamp(registrationDeadline) : undefined,
      registrationStatus: formData.registrationStatus,
      notes: formData.notes || undefined,
    });

    setFormData({
      name: "",
      type: "qualifier",
      location: "",
      address: "",
      registrationStatus: "not_started",
      notes: "",
    });
    setStartDate(undefined);
    setEndDate(undefined);
    setRegistrationDeadline(undefined);
    setCreateOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Trophy className="h-8 w-8 text-primary" />
            Competitions
          </h1>
          <p className="text-muted-foreground">
            Track your FTC season events and results
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Competition
        </Button>
      </div>

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

      {/* Competition List */}
      {status === "LoadingFirstPage" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : results.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No competitions found</h3>
            <p className="text-muted-foreground mb-4">
              {showUpcoming
                ? "No upcoming competitions scheduled"
                : "Add your first competition to get started"}
            </p>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Competition
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((competition) => (
              <CompetitionCard key={competition._id} competition={competition} />
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

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Add Competition</DialogTitle>
            <DialogDescription>
              Add a new competition or event to your season calendar.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 max-h-[60vh]">
            <div className="space-y-4 py-4 pr-4">
              <div className="space-y-2">
                <Label>Competition Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Regional Qualifier #1"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) => setFormData({ ...formData, type: v as typeof formData.type })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {competitionTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Registration Status</Label>
                  <Select
                    value={formData.registrationStatus}
                    onValueChange={(v) =>
                      setFormData({ ...formData, registrationStatus: v as typeof formData.registrationStatus })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {registrationStatuses.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Location *</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Lincoln High School"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Full address"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <DatePicker
                    value={startDate}
                    onChange={setStartDate}
                    placeholder="Select start date"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <DatePicker
                    value={endDate}
                    onChange={setEndDate}
                    placeholder="Select end date"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Registration Deadline</Label>
                <DatePicker
                  value={registrationDeadline}
                  onChange={setRegistrationDeadline}
                  placeholder="Select deadline"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional notes..."
                  rows={3}
                />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formData.name || !formData.location || !startDate}
            >
              Add Competition
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
