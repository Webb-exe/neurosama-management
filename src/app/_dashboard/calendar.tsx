import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  CalendarDays,
  Trophy,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { useTimezone } from "@/context/TimezoneContext";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";

export const Route = createFileRoute("/_dashboard/calendar")({
  component: CalendarPage,
});

// ==========================================
// TIMEZONE-AWARE DATE HELPERS
// ==========================================

/**
 * Get date parts (year, month, day, hour, minute) in a specific timezone
 */
function getDatePartsInTimezone(
  timestamp: number,
  timezone: string
): { year: number; month: number; day: number; hour: number; minute: number; weekday: number } {
  const date = new Date(timestamp);
  
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
    weekday: "short",
  });
  
  const parts = formatter.formatToParts(date);
  const getValue = (type: string) => {
    const part = parts.find((p) => p.type === type);
    return part ? parseInt(part.value, 10) : 0;
  };
  
  const weekdayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  const weekdayPart = parts.find((p) => p.type === "weekday");
  const weekday = weekdayPart ? weekdayMap[weekdayPart.value] ?? 0 : 0;
  
  return {
    year: getValue("year"),
    month: getValue("month"),
    day: getValue("day"),
    hour: getValue("hour") === 24 ? 0 : getValue("hour"), // Handle midnight
    minute: getValue("minute"),
    weekday,
  };
}

/**
 * Get a unique date key string for a timestamp in a specific timezone
 * Format: "YYYY-MM-DD"
 */
function getDateKeyInTimezone(timestamp: number, timezone: string): string {
  const { year, month, day } = getDatePartsInTimezone(timestamp, timezone);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Check if a date key represents "today" in the given timezone
 */
function isTodayInTimezone(dateKey: string, timezone: string): boolean {
  const todayKey = getDateKeyInTimezone(Date.now(), timezone);
  return dateKey === todayKey;
}

/**
 * Get the start of a day (midnight) in a specific timezone as a UTC timestamp
 */
function getStartOfDayInTimezone(dateKey: string, timezone: string): number {
  // Parse the dateKey
  const [_year, _month, day] = dateKey.split("-").map(Number);
  
  // Create an ISO string assuming the date is in the target timezone
  // We'll use a workaround by creating dates and comparing
  const testDate = new Date(`${dateKey}T12:00:00Z`); // Start at noon UTC
  
  // Get what date this appears as in the target timezone
  const testParts = getDatePartsInTimezone(testDate.getTime(), timezone);
  
  // Adjust by the difference in days
  const dayDiff = day - testParts.day;
  const adjustedDate = new Date(testDate.getTime() + dayDiff * 24 * 60 * 60 * 1000);
  
  // Now find midnight in the target timezone
  const parts = getDatePartsInTimezone(adjustedDate.getTime(), timezone);
  const hoursToSubtract = parts.hour;
  const minutesToSubtract = parts.minute;
  
  return adjustedDate.getTime() - (hoursToSubtract * 60 + minutesToSubtract) * 60 * 1000;
}

/**
 * Get hours and minutes from midnight for a timestamp in a specific timezone
 */
function getMinutesFromMidnight(timestamp: number, timezone: string): number {
  const { hour, minute } = getDatePartsInTimezone(timestamp, timezone);
  return hour * 60 + minute;
}

/**
 * Custom hook for timezone-aware date operations
 */
function useTimezoneDates() {
  const { timezone } = useTimezone();
  
  return useMemo(() => ({
    getDateKey: (timestamp: number) => getDateKeyInTimezone(timestamp, timezone),
    getDateParts: (timestamp: number) => getDatePartsInTimezone(timestamp, timezone),
    isToday: (dateKey: string) => isTodayInTimezone(dateKey, timezone),
    getTodayKey: () => getDateKeyInTimezone(Date.now(), timezone),
    getMinutesFromMidnight: (timestamp: number) => getMinutesFromMidnight(timestamp, timezone),
    getStartOfDay: (dateKey: string) => getStartOfDayInTimezone(dateKey, timezone),
    timezone,
  }), [timezone]);
}

// Type for calendar events from the backend
type CalendarEvent = {
  id: Id<"calendarEvents">;
  startDate: number;
  endDate: number;
  data:
    | {
        type: "FtcTeamEvent";
        eventCode: string;
        locationLabel: string;
        teamNumber: number;
        season: number;
      };
};

// ==========================================
// EVENT TYPE COMPONENTS
// ==========================================

// Get color config based on event type
function getEventColors(type: string) {
  switch (type) {
    case "FtcTeamEvent":
      return {
        bg: "bg-orange-500",
        bgLight: "bg-orange-100 dark:bg-orange-900/30",
        text: "text-orange-700 dark:text-orange-300",
        border: "border-orange-500",
      };
    default:
      return {
        bg: "bg-gray-500",
        bgLight: "bg-gray-100 dark:bg-gray-800",
        text: "text-gray-700 dark:text-gray-300",
        border: "border-gray-500",
      };
  }
}

// Get event display name
function getEventDisplayName(event: CalendarEvent) {
  switch (event.data.type) {
    case "FtcTeamEvent":
      return event.data.eventCode;
    default:
      return "Event";
  }
}

// Compact event pill for calendar grid
function EventPill({
  event,
  isDragging = false,
}: {
  event: CalendarEvent;
  isDragging?: boolean;
}) {
  const colors = getEventColors(event.data.type);

  return (
    <div
      className={cn(
        "px-2 py-0.5 rounded text-xs font-medium truncate cursor-grab active:cursor-grabbing",
        colors.bg,
        "text-white",
        isDragging && "opacity-50 ring-2 ring-primary"
      )}
    >
      {getEventDisplayName(event)}
    </div>
  );
}

// Draggable wrapper for events
function DraggableEvent({ event }: { event: CalendarEvent }) {
  const { attributes, listeners, setNodeRef, isDragging, transform } = useDraggable({
    id: event.id,
    data: { event },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 50 : undefined,
      }
    : undefined;

  // Merge listeners with our click handler to stop propagation
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handleClick}
      className={cn("relative", isDragging && "z-50")}
    >
      <div {...listeners} {...attributes}>
        <EventPill event={event} isDragging={isDragging} />
      </div>
    </div>
  );
}

// ==========================================
// RESIZABLE PANEL HOOK
// ==========================================

function useResizablePanel(
  initialWidth: number,
  minWidth: number,
  maxWidth: number
) {
  const [width, setWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(initialWidth);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);
      startXRef.current = e.clientX;
      startWidthRef.current = width;
    },
    [width]
  );

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = startXRef.current - e.clientX;
      const newWidth = Math.min(
        maxWidth,
        Math.max(minWidth, startWidthRef.current + deltaX)
      );
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, minWidth, maxWidth]);

  return { width, isResizing, handleMouseDown };
}

// ==========================================
// DAY VIEW SIDEBAR COMPONENTS
// ==========================================

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Format hour with timezone support
function useFormatHour() {
  const { timezone } = useTimezone();
  
  return useCallback((hour: number) => {
    // Create a formatter that shows just the hour in the target timezone
    // We use a fixed date and set it to the hour we want to display
    const formatter = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      timeZone: timezone,
    });
    
    // Create a date at the specified hour (we'll use a date where we know the hour)
    // Since we're just formatting the hour label (0-23), we create a UTC date at that hour
    const date = new Date(Date.UTC(2024, 0, 1, hour, 0, 0));
    
    // If timezone is UTC, this will show the hour correctly
    // For other timezones, we need to adjust
    if (timezone === "UTC") {
      return formatter.format(date);
    }
    
    // For non-UTC timezones, just format the hour number directly
    // since we're displaying a generic hour label, not a specific time
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour} ${ampm}`;
  }, [timezone]);
}

// Event block positioned in the day view
function DayViewEventBlock({
  event,
  selectedDateKey,
}: {
  event: CalendarEvent;
  selectedDateKey: string;
}) {
  const { formatDate } = useTimezone();
  const tzDates = useTimezoneDates();
  const colors = getEventColors(event.data.type);

  // Get event date keys in the selected timezone
  const startDateKey = tzDates.getDateKey(event.startDate);
  const endDateKey = tzDates.getDateKey(event.endDate);

  // Calculate position based on timezone-aware times
  // If event starts before this day (in the timezone), start at midnight
  // If event ends after this day (in the timezone), end at midnight
  const startsBeforeToday = startDateKey < selectedDateKey;
  const endsAfterToday = endDateKey > selectedDateKey;

  const startMinutes = startsBeforeToday 
    ? 0 
    : tzDates.getMinutesFromMidnight(event.startDate);
  
  const endMinutes = endsAfterToday 
    ? 24 * 60 
    : tzDates.getMinutesFromMidnight(event.endDate);

  const durationMinutes = Math.max(endMinutes - startMinutes, 30); // Min 30 min height

  // Each hour is 48px
  const hourHeight = 48;
  const top = (startMinutes / 60) * hourHeight;
  const height = (durationMinutes / 60) * hourHeight;

  const isMultiDay = startDateKey !== endDateKey;

  // Format time using timezone (use actual event start time)
  const formattedTime = formatDate(event.startDate, {
    hour: "numeric",
    minute: "2-digit",
    year: undefined,
    month: undefined,
    day: undefined,
  });

  return (
    <div
      className={cn(
        "absolute left-12 right-2 rounded px-2 py-1 text-xs cursor-pointer transition-colors hover:opacity-90",
        colors.bg,
        "text-white"
      )}
      style={{
        top: `${top}px`,
        height: `${Math.max(height, 24)}px`,
        minHeight: "24px",
      }}
    >
      <div className="flex items-center gap-1">
        {event.data.type === "FtcTeamEvent" && (
          <Trophy className="h-3 w-3 shrink-0" />
        )}
        <span className="font-medium truncate">
          {getEventDisplayName(event)}
        </span>
      </div>
      {height >= 40 && (
        <div className="text-[10px] opacity-80 mt-0.5">
          {isMultiDay ? "All day" : formattedTime}
        </div>
      )}
    </div>
  );
}

// Current time indicator line
function CurrentTimeIndicator({ selectedDateKey }: { selectedDateKey: string }) {
  const tzDates = useTimezoneDates();
  const [nowTimestamp, setNowTimestamp] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNowTimestamp(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Only show if selected date is today in the selected timezone
  const todayKey = tzDates.getTodayKey();
  const isToday = selectedDateKey === todayKey;
  if (!isToday) return null;

  // Get current time in the selected timezone
  const minutes = tzDates.getMinutesFromMidnight(nowTimestamp);
  const hourHeight = 48;
  const top = (minutes / 60) * hourHeight;

  return (
    <div
      className="absolute left-0 right-0 z-10 pointer-events-none"
      style={{ top: `${top}px` }}
    >
      <div className="flex items-center">
        <div className="w-3 h-3 rounded-full bg-red-500 -ml-1.5" />
        <div className="flex-1 h-0.5 bg-red-500" />
      </div>
    </div>
  );
}

// Day view with hourly time slots
function DayViewSidebar({
  selectedDateKey,
  selectedDay,
  events,
  isLoading,
  onClose,
  width,
  onResizeStart,
  isResizing,
}: {
  selectedDateKey: string;
  selectedDay: number;
  events: CalendarEvent[];
  isLoading: boolean;
  onClose: () => void;
  width: number;
  onResizeStart: (e: React.MouseEvent) => void;
  isResizing: boolean;
}) {
  const tzDates = useTimezoneDates();
  const formatHour = useFormatHour();
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevDateKeyRef = useRef<string | null>(null);
  const isToday = tzDates.isToday(selectedDateKey);

  // Get weekday directly from the date key
  // The weekday of a calendar date is fixed (Feb 1, 2026 is always Sunday regardless of timezone)
  const formattedWeekday = useMemo(() => {
    const [year, month, day] = selectedDateKey.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return WEEKDAYS[date.getDay()];
  }, [selectedDateKey]);

  // Scroll to current time only when the date actually changes (not on other re-renders)
  useEffect(() => {
    // Only scroll when selectedDateKey changes, not when other dependencies change
    if (prevDateKeyRef.current === selectedDateKey) {
      return;
    }
    prevDateKeyRef.current = selectedDateKey;

    if (isToday && scrollRef.current) {
      const currentMinutes = tzDates.getMinutesFromMidnight(Date.now());
      const currentHour = Math.floor(currentMinutes / 60);
      const scrollTo = Math.max(0, (currentHour - 1) * 48);
      scrollRef.current.scrollTop = scrollTo;
    }
  }, [isToday, selectedDateKey, tzDates]);

  return (
    <div
      className="flex flex-col bg-background relative"
      style={{ width: `${width}px` }}
    >
      {/* Resize handle */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors z-20",
          isResizing && "bg-primary"
        )}
        onMouseDown={onResizeStart}
      >
      </div>

      {/* Header */}
      <div className="p-3 border-b border-l flex items-center justify-between shrink-0">
        <div className="text-center flex-1">
          <div className="text-sm font-medium text-muted-foreground">
            {formattedWeekday}
          </div>
          <div
            className={cn(
              "w-10 h-10 mx-auto flex items-center justify-center rounded-full text-xl font-semibold",
              isToday && "bg-red-500 text-white"
            )}
          >
            {selectedDay}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Time grid */}
      <div ref={scrollRef} className="flex-1 overflow-auto border-l">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="relative" style={{ height: `${24 * 48}px` }}>
            {/* Hour rows */}
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute left-0 right-0 border-b border-border/30"
                style={{ top: `${hour * 48}px`, height: "48px" }}
              >
                <span className="absolute left-2 -top-2 text-[10px] text-muted-foreground">
                  {formatHour(hour)}
                </span>
              </div>
            ))}

            {/* Current time indicator */}
            <CurrentTimeIndicator selectedDateKey={selectedDateKey} />

            {/* Events */}
            {events.map((event) => (
              <DayViewEventBlock
                key={event.id}
                event={event}
                selectedDateKey={selectedDateKey}
              />
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="p-3 border-t border-l bg-muted/30 shrink-0">
        <p className="text-xs text-muted-foreground text-center">
          {events.length === 0
            ? "No events"
            : `${events.length} event${events.length !== 1 ? "s" : ""}`}
        </p>
      </div>
    </div>
  );
}

// ==========================================
// CALENDAR GRID COMPONENTS
// ==========================================

// Droppable day cell
function CalendarDayCell({
  dateKey,
  dayOfMonth,
  isCurrentMonth,
  isToday,
  isSelected,
  events,
  onSelect,
}: {
  dateKey: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  events: CalendarEvent[];
  onSelect: (dateKey: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: dateKey,
    data: { dateKey },
  });

  const maxVisibleEvents = 2;
  const visibleEvents = events.slice(0, maxVisibleEvents);
  const hiddenCount = events.length - maxVisibleEvents;

  return (
    <div
      ref={setNodeRef}
      onClick={() => onSelect(dateKey)}
      className={cn(
        "h-full p-1 border-b border-r border-border/50 cursor-pointer transition-colors",
        !isCurrentMonth && "bg-muted/30",
        isOver && "bg-primary/10",
        isSelected && "bg-primary/5 ring-2 ring-primary ring-inset"
      )}
    >
      <div
        className={cn(
          "w-6 h-6 flex items-center justify-center rounded-full text-xs mb-0.5",
          isToday && "bg-primary text-primary-foreground font-bold",
          !isToday && !isCurrentMonth && "text-muted-foreground",
          !isToday && isCurrentMonth && "hover:bg-accent"
        )}
      >
        {dayOfMonth}
      </div>
      <div className="space-y-0.5">
        {visibleEvents.map((event) => (
          <DraggableEvent key={event.id} event={event} />
        ))}
        {hiddenCount > 0 && (
          <div className="text-[10px] text-muted-foreground pl-1">
            +{hiddenCount} more
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// MAIN CALENDAR PAGE
// ==========================================

function CalendarPage() {
  const { timezone } = useTimezone();
  const tzDates = useTimezoneDates();
  
  // Store selected date as a date key (YYYY-MM-DD) in the selected timezone
  const [selectedDateKey, setSelectedDateKey] = useState<string>(() => 
    getDateKeyInTimezone(Date.now(), timezone)
  );
  
  // Store current month as year-month string
  const [currentYearMonth, setCurrentYearMonth] = useState<{ year: number; month: number }>(() => {
    const parts = getDatePartsInTimezone(Date.now(), timezone);
    return { year: parts.year, month: parts.month };
  });
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);

  // Note: We intentionally do NOT reset selectedDateKey or currentYearMonth when
  // timezone changes. Both are stored as calendar coordinates (year/month numbers
  // and "YYYY-MM-DD" date strings), not as timestamps, so they remain valid across
  // timezone changes. Resetting would cause the user to lose their current view.

  // Resizable sidebar - 320 default, 200 min, 600 max
  const { width: sidebarWidth, isResizing, handleMouseDown } = useResizablePanel(320, 200, 600);

  // Format month header
  const formattedMonth = useMemo(() => {
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return `${monthNames[currentYearMonth.month - 1]} ${currentYearMonth.year}`;
  }, [currentYearMonth]);

  // Drag and drop sensors - use multiple sensors for better support
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5, // Start drag after 5px movement
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // Long press to start drag on touch
        tolerance: 5,
      },
    }),
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // Calculate the start and end of the visible month range (including padding days)
  const dateRange = useMemo(() => {
    const { year, month } = currentYearMonth;
    
    // Get weekday of first day of month (calendar date weekday is timezone-independent)
    const firstOfMonth = new Date(year, month - 1, 1);
    const daysToGoBack = firstOfMonth.getDay(); // 0 = Sunday
    
    // Get last day of month
    const lastDayOfMonth = new Date(year, month, 0); // Day 0 of next month = last day of this month
    const daysInMonth = lastDayOfMonth.getDate();
    
    // Get weekday of last day of month
    const daysToGoForward = 6 - lastDayOfMonth.getDay();
    
    // Calculate start and end timestamps (use UTC for consistent event fetching)
    // Start: go back from the 1st
    const startTimestamp = Date.UTC(year, month - 1, 1 - daysToGoBack, 0, 0, 0);
    // End: go forward from last day
    const endTimestamp = Date.UTC(year, month - 1, daysInMonth + daysToGoForward, 23, 59, 59, 999);

    return {
      startDate: startTimestamp,
      endDate: endTimestamp,
    };
  }, [currentYearMonth]);

  // Calculate number of weeks to display
  const weeksCount = useMemo(() => {
    const days = Math.round((dateRange.endDate - dateRange.startDate) / (1000 * 60 * 60 * 24)) + 1;
    return Math.ceil(days / 7);
  }, [dateRange]);

  // Fetch events for the current view
  const events = useQuery(api.calender.main.getEvents, dateRange);

  // Generate calendar grid days as date keys
  const calendarDays = useMemo(() => {
    const { year, month } = currentYearMonth;
    const days: { dateKey: string; dayOfMonth: number; month: number }[] = [];
    
    // Get weekday of first day to know how many days to go back
    const firstOfMonth = new Date(year, month - 1, 1);
    const daysToGoBack = firstOfMonth.getDay();
    
    // Get last day of month
    const lastDayOfMonth = new Date(year, month, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const daysToGoForward = 6 - lastDayOfMonth.getDay();
    
    // Total days to display
    const totalDays = daysToGoBack + daysInMonth + daysToGoForward;
    
    // Start date (may be in previous month)
    const startDate = new Date(year, month - 1, 1 - daysToGoBack);
    
    for (let i = 0; i < totalDays; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const y = currentDate.getFullYear();
      const m = currentDate.getMonth() + 1;
      const d = currentDate.getDate();
      
      days.push({
        dateKey: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        dayOfMonth: d,
        month: m,
      });
    }

    return days;
  }, [currentYearMonth]);

  // Group events by date key (timezone-aware)
  const eventsByDate = useMemo(() => {
    if (!events) return new Map<string, CalendarEvent[]>();

    const map = new Map<string, CalendarEvent[]>();
    events.forEach((event) => {
      // Get start and end date keys in the selected timezone
      const startDateKey = getDateKeyInTimezone(event.startDate, timezone);
      const endDateKey = getDateKeyInTimezone(event.endDate, timezone);

      // Add event to all dates it spans
      // Parse start date key
      const [startYear, startMonth, startDay] = startDateKey.split("-").map(Number);
      const [endYear, endMonth, endDay] = endDateKey.split("-").map(Number);
      
      let currentDate = new Date(Date.UTC(startYear, startMonth - 1, startDay));
      const endDate = new Date(Date.UTC(endYear, endMonth - 1, endDay));

      while (currentDate <= endDate) {
        const dateKey = `${currentDate.getUTCFullYear()}-${String(currentDate.getUTCMonth() + 1).padStart(2, "0")}-${String(currentDate.getUTCDate()).padStart(2, "0")}`;
        const existing = map.get(dateKey) || [];
        if (!existing.find((e) => e.id === event.id)) {
          existing.push(event);
        }
        map.set(dateKey, existing);
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
      }
    });
    return map;
  }, [events, timezone]);

  // Get events for selected date
  const selectedDateEvents = useMemo(() => {
    return eventsByDate.get(selectedDateKey) || [];
  }, [selectedDateKey, eventsByDate]);

  // Navigation handlers
  const goToPreviousMonth = useCallback(() => {
    setCurrentYearMonth((prev) => {
      if (prev.month === 1) {
        return { year: prev.year - 1, month: 12 };
      }
      return { year: prev.year, month: prev.month - 1 };
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentYearMonth((prev) => {
      if (prev.month === 12) {
        return { year: prev.year + 1, month: 1 };
      }
      return { year: prev.year, month: prev.month + 1 };
    });
  }, []);

  const goToToday = useCallback(() => {
    const todayParts = getDatePartsInTimezone(Date.now(), timezone);
    setCurrentYearMonth({ year: todayParts.year, month: todayParts.month });
    setSelectedDateKey(getDateKeyInTimezone(Date.now(), timezone));
  }, [timezone]);

  // Drag handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const eventData = event.active.data.current?.event as
      | CalendarEvent
      | undefined;
    if (eventData) {
      setActiveEvent(eventData);
    }
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveEvent(null);

    const { active, over } = event;
    if (!over) return;

    // Get the event and target date key
    const draggedEvent = active.data.current?.event as
      | CalendarEvent
      | undefined;
    const targetDateKey = over.data.current?.dateKey as string | undefined;

    if (draggedEvent && targetDateKey) {
      // TODO: Implement mutation to update event date
      console.log(
        "Move event",
        draggedEvent.id,
        "to",
        targetDateKey
      );
    }
  }, []);

  const todayKey = tzDates.getTodayKey();
  const isLoading = events === undefined;
  
  // Get selected day number for sidebar display
  const selectedDay = useMemo(() => {
    const [, , day] = selectedDateKey.split("-").map(Number);
    return day;
  }, [selectedDateKey]);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* 
        Height calculation: 100vh - header (3.5rem/56px) - main padding (1.5rem*2 on md = 3rem)
        On mobile it's p-4 (1rem*2 = 2rem), on md+ it's p-6 (1.5rem*2 = 3rem)
      */}
      <div className="h-[calc(100vh-3.5rem-2rem)] md:h-[calc(100vh-3.5rem-3rem)] flex flex-col -m-4 md:-m-6">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b shrink-0 bg-background">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Calendar
            </h1>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={goToPreviousMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={goToToday}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={goToNextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <h2 className="text-base font-semibold">
              {formattedMonth}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? "Hide" : "Show"} Day
          </Button>
        </div>

        {/* Main content */}
        <div
          className={cn(
            "flex-1 flex overflow-hidden min-h-0",
            isResizing && "select-none"
          )}
        >
          {/* Calendar Grid */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 border-b shrink-0">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="py-1.5 text-center text-xs font-medium text-muted-foreground border-r border-border/50 last:border-r-0"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid - fixed height based on weeks */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {isLoading ? (
                <div className="grid grid-cols-7 h-full">
                  {Array.from({ length: weeksCount * 7 }).map((_, i) => (
                    <div
                      key={i}
                      className="p-1 border-b border-r border-border/50"
                    >
                      <Skeleton className="h-5 w-5 rounded-full mb-1" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className="grid grid-cols-7 h-full"
                  style={{ gridTemplateRows: `repeat(${weeksCount}, 1fr)` }}
                >
                  {calendarDays.map((day) => (
                    <CalendarDayCell
                      key={day.dateKey}
                      dateKey={day.dateKey}
                      dayOfMonth={day.dayOfMonth}
                      isCurrentMonth={day.month === currentYearMonth.month}
                      isToday={day.dateKey === todayKey}
                      isSelected={day.dateKey === selectedDateKey}
                      events={eventsByDate.get(day.dateKey) || []}
                      onSelect={setSelectedDateKey}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Day View Sidebar */}
          {sidebarOpen && (
            <DayViewSidebar
              selectedDateKey={selectedDateKey}
              selectedDay={selectedDay}
              events={selectedDateEvents}
              isLoading={isLoading}
              onClose={() => setSidebarOpen(false)}
              width={sidebarWidth}
              onResizeStart={handleMouseDown}
              isResizing={isResizing}
            />
          )}
        </div>

        {/* Drag overlay */}
        <DragOverlay>
          {activeEvent ? <EventPill event={activeEvent} /> : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}
