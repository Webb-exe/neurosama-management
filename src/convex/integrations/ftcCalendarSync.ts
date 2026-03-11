"use node";

import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { fromZonedTime } from "date-fns-tz";

const FTC_SCOUT_URL = "https://api.ftcscout.org/graphql";
const FTC_SEASON = 2025;

const GET_CONFIGURED_TEAM_CALENDAR_EVENTS = `
  query GetConfiguredTeamCalendarEvents($number: Int!, $season: Int! = 2025) {
    teamByNumber(number: $number) {
      events(season: $season) {
        event {
          code
          start
          end
          timezone
          location {
            city
            state
            country
          }
        }
      }
    }
  }
`;

type CalendarQueryResponse = {
  teamByNumber: {
    events: Array<{
      event: {
        code: string;
        start: string;
        end: string;
        timezone: string;
        location: {
          city: string;
          state: string;
          country: string;
        };
      };
    }>;
  } | null;
};

function parseLocalDateToUtc(dateString: string, timezone: string): number {
  return fromZonedTime(`${dateString}T00:00:00`, timezone).getTime();
}

function parseLocalEndDateToUtc(dateString: string, timezone: string): number {
  return fromZonedTime(`${dateString}T23:59:59`, timezone).getTime();
}

function formatLocationLabel(location: {
  city: string;
  state: string;
  country: string;
}): string {
  return [location.city, location.state, location.country]
    .filter(Boolean)
    .join(", ");
}

export const syncConfiguredTeamCalendar = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const settings = await ctx.runQuery(
      internal.settings.settings.getFtcSettingsInternal,
      {},
    );

    if (!settings.ftcTeamNumber) {
      await ctx.runMutation(
        internal.calender.FirstEvents.replaceTeamCalendarEvents,
        {
          teamNumber: 0,
          season: FTC_SEASON,
          events: [],
        },
      );
      return null;
    }

    const response = await fetch(FTC_SCOUT_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        operationName: "GetConfiguredTeamCalendarEvents",
        query: GET_CONFIGURED_TEAM_CALENDAR_EVENTS,
        variables: {
          number: settings.ftcTeamNumber,
          season: FTC_SEASON,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`FTC Scout calendar sync failed with ${response.status}`);
    }

    const payload = (await response.json()) as {
      data?: CalendarQueryResponse;
      errors?: Array<{ message: string }>;
    };

    if (payload.errors?.length) {
      throw new Error(payload.errors.map((error) => error.message).join(", "));
    }

    const events =
      payload.data?.teamByNumber?.events.map(({ event }) => ({
        eventCode: event.code,
        locationLabel: formatLocationLabel(event.location),
        startDate: parseLocalDateToUtc(event.start, event.timezone),
        endDate: parseLocalEndDateToUtc(event.end, event.timezone),
      })) ?? [];

    await ctx.runMutation(
      internal.calender.FirstEvents.replaceTeamCalendarEvents,
      {
        teamNumber: settings.ftcTeamNumber,
        season: FTC_SEASON,
        events,
      },
    );

    return null;
  },
});
