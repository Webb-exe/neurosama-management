import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type TimezoneMode = "local" | "utc" | "custom";

interface TimezoneContextType {
  timezone: string;
  timezoneMode: TimezoneMode;
  setTimezone: (tz: string) => void;
  setTimezoneMode: (mode: TimezoneMode) => void;
  formatDate: (timestamp: number, options?: Intl.DateTimeFormatOptions) => string;
  formatDateForInput: (timestamp: number) => string;
  formatTimeForInput: (timestamp: number) => string;
  parseInputToTimestamp: (dateStr: string, timeStr?: string, useUtc?: boolean) => number;
  getTimezoneLabel: () => string;
  getTimezoneOffset: () => string;
  // New helpers for DatePicker
  dateToUtcTimestamp: (date: Date, timeStr?: string) => number;
  utcTimestampToDate: (timestamp: number) => Date;
}

const TimezoneContext = createContext<TimezoneContextType | null>(null);

const TIMEZONE_STORAGE_KEY = "robotics-team-manager-timezone";
const TIMEZONE_MODE_STORAGE_KEY = "robotics-team-manager-timezone-mode";

function getBrowserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function getStoredTimezone(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TIMEZONE_STORAGE_KEY);
}

function getStoredTimezoneMode(): TimezoneMode {
  if (typeof window === "undefined") return "local";
  const stored = localStorage.getItem(TIMEZONE_MODE_STORAGE_KEY);
  if (stored === "utc" || stored === "custom") return stored;
  return "local";
}

export function TimezoneProvider({ children }: { children: ReactNode }) {
  const [timezone, setTimezoneState] = useState<string>(getBrowserTimezone());
  const [timezoneMode, setTimezoneModeState] = useState<TimezoneMode>("local");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Load from localStorage on mount
    const storedTz = getStoredTimezone();
    const storedMode = getStoredTimezoneMode();

    if (storedMode === "utc") {
      setTimezoneState("UTC");
    } else if (storedMode === "custom" && storedTz) {
      setTimezoneState(storedTz);
    } else {
      setTimezoneState(getBrowserTimezone());
    }

    setTimezoneModeState(storedMode);
    setMounted(true);
  }, []);

  const setTimezone = (tz: string) => {
    setTimezoneState(tz);
    localStorage.setItem(TIMEZONE_STORAGE_KEY, tz);
  };

  const setTimezoneMode = (mode: TimezoneMode) => {
    setTimezoneModeState(mode);
    localStorage.setItem(TIMEZONE_MODE_STORAGE_KEY, mode);

    if (mode === "utc") {
      setTimezoneState("UTC");
    } else if (mode === "local") {
      setTimezoneState(getBrowserTimezone());
    }
  };

  const formatDate = (timestamp: number, options?: Intl.DateTimeFormatOptions): string => {
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: timezone,
      ...options,
    };

    return new Date(timestamp).toLocaleString("en-US", defaultOptions);
  };

  const formatDateForInput = (timestamp: number): string => {
    if (!timestamp) return "";

    const date = new Date(timestamp);

    if (timezone === "UTC") {
      return date.toISOString().split("T")[0];
    }

    // Format in the selected timezone
    const formatter = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: timezone,
    });

    return formatter.format(date);
  };

  const formatTimeForInput = (timestamp: number): string => {
    if (!timestamp) return "";

    const date = new Date(timestamp);

    if (timezone === "UTC") {
      return date.toISOString().split("T")[1].substring(0, 5);
    }

    const formatter = new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: timezone,
    });

    return formatter.format(date);
  };

  const parseInputToTimestamp = (dateStr: string, timeStr?: string, useUtc?: boolean): number => {
    if (!dateStr) return 0;

    const effectiveTimezone = useUtc ? "UTC" : timezone;

    if (effectiveTimezone === "UTC") {
      const isoStr = timeStr ? `${dateStr}T${timeStr}:00.000Z` : `${dateStr}T00:00:00.000Z`;
      return new Date(isoStr).getTime();
    }

    // Parse in the local timezone
    const dateTimeStr = timeStr ? `${dateStr}T${timeStr}` : `${dateStr}T00:00:00`;
    const localDate = new Date(dateTimeStr);

    // For simplicity, we'll use the browser's interpretation
    // A more robust solution would use a library like date-fns-tz
    return localDate.getTime();
  };

  const getTimezoneLabel = (): string => {
    if (timezoneMode === "utc") return "UTC";
    if (timezoneMode === "local") return `${timezone} (Browser)`;
    return timezone;
  };

  const getTimezoneOffset = (): string => {
    if (timezone === "UTC") return "+00:00";

    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "longOffset",
    });

    const parts = formatter.formatToParts(now);
    const offsetPart = parts.find((p) => p.type === "timeZoneName");
    return offsetPart?.value?.replace("GMT", "") || "";
  };

  /**
   * Convert a Date object (from DatePicker) to a UTC timestamp for storage.
   * The Date represents a date in the user's selected timezone.
   * We want to store the UTC timestamp that represents midnight (or specified time)
   * in that timezone.
   */
  const dateToUtcTimestamp = (date: Date, timeStr?: string): number => {
    if (!date) return 0;

    // Get the date parts as they appear in the selected timezone
    const formatter = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: timezone,
    });
    
    const dateStr = formatter.format(date);
    const time = timeStr || "00:00";

    if (timezone === "UTC") {
      return new Date(`${dateStr}T${time}:00.000Z`).getTime();
    }

    // For non-UTC timezones, we need to calculate the offset
    // Create a date string and let the browser parse it
    // Then adjust based on the timezone offset
    const localDateStr = `${dateStr}T${time}:00`;
    const localDate = new Date(localDateStr);
    
    // Get the offset for the target timezone at this date
    const targetFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "longOffset",
    });
    const parts = targetFormatter.formatToParts(localDate);
    const offsetPart = parts.find((p) => p.type === "timeZoneName");
    const offsetStr = offsetPart?.value?.replace("GMT", "") || "+00:00";
    
    // Parse offset like "+05:30" or "-08:00"
    const match = offsetStr.match(/([+-])(\d{2}):(\d{2})/);
    if (!match) return localDate.getTime();
    
    const sign = match[1] === "+" ? 1 : -1;
    const hours = parseInt(match[2], 10);
    const minutes = parseInt(match[3], 10);
    const offsetMs = sign * (hours * 60 + minutes) * 60 * 1000;
    
    // Get browser's local offset
    const browserOffsetMs = localDate.getTimezoneOffset() * 60 * 1000;
    
    // Adjust: UTC = local + browserOffset - targetOffset
    return localDate.getTime() + browserOffsetMs - offsetMs;
  };

  /**
   * Convert a UTC timestamp to a Date object for display in the DatePicker.
   * The returned Date should display the correct date in the user's timezone.
   */
  const utcTimestampToDate = (timestamp: number): Date => {
    if (!timestamp) return new Date();
    
    // The timestamp is already UTC, so we just create a Date from it
    // The DatePicker will use the timeZone prop to display it correctly
    return new Date(timestamp);
  };

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <TimezoneContext.Provider
      value={{
        timezone,
        timezoneMode,
        setTimezone,
        setTimezoneMode,
        formatDate,
        formatDateForInput,
        formatTimeForInput,
        parseInputToTimestamp,
        getTimezoneLabel,
        getTimezoneOffset,
        dateToUtcTimestamp,
        utcTimestampToDate,
      }}
    >
      {children}
    </TimezoneContext.Provider>
  );
}

export function useTimezone() {
  const context = useContext(TimezoneContext);
  if (!context) {
    throw new Error("useTimezone must be used within a TimezoneProvider");
  }
  return context;
}

// Common timezones for selection
export const COMMON_TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HST)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Central European (CET)" },
  { value: "Asia/Tokyo", label: "Japan (JST)" },
  { value: "Asia/Shanghai", label: "China (CST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
  { value: "UTC", label: "UTC" },
];
