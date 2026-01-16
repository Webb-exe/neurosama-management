import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";

export const Route = createFileRoute("/_dashboard/calendar")({
  component: CalendarPage,
});

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

type CalendarEvent = {
  id: string;
  title: string;
  type: string;
  startDate: number;
  endDate: number | null;
  allDay: boolean;
  location: string | null;
  description: string | null;
  color: string;
  source: string;
  sourceId: string;
};

function EventBadge({ event }: { event: CalendarEvent }) {
  return (
    <div
      className="text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 transition-opacity"
      style={{ backgroundColor: event.color + "20", borderLeft: `3px solid ${event.color}` }}
    >
      <span className="font-medium" style={{ color: event.color }}>
        {event.title}
      </span>
    </div>
  );
}

function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week" | "agenda">("month");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first and last day of the visible calendar (including overflow days)
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startOfCalendar = new Date(firstDayOfMonth);
  startOfCalendar.setDate(startOfCalendar.getDate() - firstDayOfMonth.getDay());
  const endOfCalendar = new Date(lastDayOfMonth);
  endOfCalendar.setDate(endOfCalendar.getDate() + (6 - lastDayOfMonth.getDay()));

  const events = useQuery(api.calendar.getEventsInRange, {
    startDate: startOfCalendar.getTime(),
    endDate: endOfCalendar.getTime(),
  });

  const upcomingEvents = useQuery(api.calendar.getUpcomingEventsSummary, { limit: 10 });

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const days: Date[] = [];
    const current = new Date(startOfCalendar);
    while (current <= endOfCalendar) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  }, [startOfCalendar.getTime(), endOfCalendar.getTime()]);

  // Group events by date
  const eventsByDate = useMemo(() => {
    if (!events) return {};
    const grouped: Record<string, CalendarEvent[]> = {};
    for (const event of events) {
      const dateKey = new Date(event.startDate).toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    }
    return grouped;
  }, [events]);

  const navigateMonth = (delta: number) => {
    setCurrentDate(new Date(year, month + delta, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <CalendarIcon className="h-8 w-8 text-primary" />
            Calendar
          </h1>
          <p className="text-muted-foreground">
            View all events, competitions, and deadlines
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("month")}
          >
            Month
          </Button>
          <Button
            variant={view === "agenda" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("agenda")}
          >
            Agenda
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Calendar */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">
                {MONTHS[month]} {year}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={goToToday}>
                  Today
                </Button>
                <Button variant="ghost" size="icon" onClick={() => navigateMonth(-1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => navigateMonth(1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {events === undefined ? (
              <Skeleton className="h-96" />
            ) : view === "month" ? (
              <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
                {/* Day headers */}
                {DAYS.map((day) => (
                  <div
                    key={day}
                    className="bg-muted/50 p-2 text-center text-sm font-medium text-muted-foreground"
                  >
                    {day}
                  </div>
                ))}
                
                {/* Calendar days */}
                {calendarDays.map((date) => {
                  const isCurrentMonth = date.getMonth() === month;
                  const isToday = date.toDateString() === today.toDateString();
                  const dateEvents = eventsByDate[date.toDateString()] || [];
                  
                  return (
                    <div
                      key={date.toISOString()}
                      className={`min-h-[100px] bg-background p-1 ${
                        !isCurrentMonth ? "opacity-40" : ""
                      }`}
                    >
                      <div
                        className={`text-sm font-medium p-1 ${
                          isToday
                            ? "bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center"
                            : ""
                        }`}
                      >
                        {date.getDate()}
                      </div>
                      <div className="space-y-1 mt-1">
                        {dateEvents.slice(0, 3).map((event) => (
                          <EventBadge key={event.id} event={event} />
                        ))}
                        {dateEvents.length > 3 && (
                          <div className="text-xs text-muted-foreground pl-1">
                            +{dateEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(eventsByDate)
                  .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
                  .map(([dateStr, dayEvents]) => (
                    <div key={dateStr} className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-2">
                        {new Date(dateStr).toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })}
                      </h3>
                      <div className="space-y-2">
                        {dayEvents.map((event) => (
                          <div
                            key={event.id}
                            className="flex items-center gap-3 p-2 rounded hover:bg-accent/50"
                          >
                            <div
                              className="w-1 h-8 rounded-full"
                              style={{ backgroundColor: event.color }}
                            />
                            <div className="flex-1">
                              <p className="font-medium">{event.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {event.type.replace("_", " ")}
                                {event.location && ` · ${event.location}`}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                {Object.keys(eventsByDate).length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No events this month
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Upcoming
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingEvents === undefined ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : upcomingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No upcoming events
              </p>
            ) : (
              <div className="space-y-2">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50"
                  >
                    <div
                      className="w-1 h-10 rounded-full"
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
                    <Badge variant="outline" className="text-xs shrink-0">
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
      </div>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#f57e25]" />
              <span className="text-sm">Competitions</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#3b82f6]" />
              <span className="text-sm">Meetings</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#22c55e]" />
              <span className="text-sm">Build Days</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ef4444]" />
              <span className="text-sm">Deadlines</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#a855f7]" />
              <span className="text-sm">Outreach</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
