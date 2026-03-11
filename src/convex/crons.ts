import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "sync-configured-ftc-calendar",
  {
    hourUTC: 13,
    minuteUTC: 0,
  },
  internal.integrations.ftcCalendarSync.syncConfiguredTeamCalendar,
);

export default crons;
