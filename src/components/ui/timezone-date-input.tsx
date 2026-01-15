"use client";

import * as React from "react";
import { Input } from "./input";
import { Label } from "./label";
import { Badge } from "./badge";
import { Globe } from "lucide-react";
import { useTimezone } from "@/context/TimezoneContext";
import { DatePicker } from "./date-picker";

interface TimezoneDateInputProps {
  label: string;
  value?: Date;
  onChange: (date: Date | undefined) => void;
  required?: boolean;
  includeTime?: boolean;
  timeValue?: string;
  onTimeChange?: (time: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function TimezoneDateInput({
  label,
  value,
  onChange,
  required,
  includeTime,
  timeValue,
  onTimeChange,
  className,
  placeholder = "Pick a date",
  disabled,
}: TimezoneDateInputProps) {
  const { timezone, getTimezoneOffset } = useTimezone();

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onTimeChange) {
      onTimeChange(e.target.value);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <Label>
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Globe className="h-3 w-3" />
          {timezone === "UTC" ? "UTC" : `${timezone.split("/").pop()} (${getTimezoneOffset()})`}
        </span>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <DatePicker
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
          />
        </div>
        {includeTime && (
          <div className="w-28">
            <Input
              type="time"
              value={timeValue}
              onChange={handleTimeChange}
              className="h-10"
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Simple formatted date display component
interface FormattedDateProps {
  timestamp: number;
  format?: "date" | "datetime" | "time" | "relative" | "weekday";
  showTimezone?: boolean;
  className?: string;
}

export function FormattedDate({
  timestamp,
  format = "datetime",
  showTimezone = false,
  className,
}: FormattedDateProps) {
  const { timezone, formatDate, getTimezoneLabel } = useTimezone();

  if (!timestamp) return <span className={className}>-</span>;

  let options: Intl.DateTimeFormatOptions = {};

  switch (format) {
    case "date":
      options = {
        year: "numeric",
        month: "short",
        day: "numeric",
      };
      break;
    case "datetime":
      options = {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      };
      break;
    case "time":
      options = {
        hour: "2-digit",
        minute: "2-digit",
      };
      break;
    case "weekday":
      options = {
        weekday: "short",
        month: "short",
        day: "numeric",
      };
      break;
    case "relative": {
      // Calculate relative time
      const now = Date.now();
      const diff = now - timestamp;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (days === 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours === 0) {
          const minutes = Math.floor(diff / (1000 * 60));
          return <span className={className}>{minutes <= 1 ? "Just now" : `${minutes}m ago`}</span>;
        }
        return <span className={className}>{hours === 1 ? "1h ago" : `${hours}h ago`}</span>;
      } else if (days === 1) {
        return <span className={className}>Yesterday</span>;
      } else if (days < 7) {
        return <span className={className}>{days}d ago</span>;
      }
      // Fall through to date format for older
      options = {
        month: "short",
        day: "numeric",
      };
      break;
    }
  }

  const formatted = formatDate(timestamp, options);

  return (
    <span className={className} title={showTimezone ? getTimezoneLabel() : undefined}>
      {formatted}
      {showTimezone && (
        <span className="text-xs text-muted-foreground ml-1">({timezone})</span>
      )}
    </span>
  );
}

// Full date display with weekday
interface FormattedFullDateProps {
  timestamp: number;
  showTimezone?: boolean;
  className?: string;
}

export function FormattedFullDate({
  timestamp,
  showTimezone = false,
  className,
}: FormattedFullDateProps) {
  const { formatDate, getTimezoneLabel } = useTimezone();

  if (!timestamp) return <span className={className}>-</span>;

  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  const formatted = formatDate(timestamp, options);

  return (
    <span className={className} title={showTimezone ? getTimezoneLabel() : undefined}>
      {formatted}
    </span>
  );
}

// Timezone indicator badge
export function TimezoneIndicator({ className }: { className?: string }) {
  const { timezone, getTimezoneOffset } = useTimezone();

  return (
    <Badge variant="outline" className={`text-xs gap-1 ${className}`}>
      <Globe className="h-3 w-3" />
      {timezone === "UTC" ? "UTC" : `${timezone.split("/").pop()} (${getTimezoneOffset()})`}
    </Badge>
  );
}
