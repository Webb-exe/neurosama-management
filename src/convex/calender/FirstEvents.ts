import { internalMutation } from "../functions";
import { v } from "convex/values";

export const replaceTeamCalendarEvents = internalMutation({
  args: {
    teamNumber: v.number(),
    season: v.number(),
    events: v.array(
      v.object({
        eventCode: v.string(),
        locationLabel: v.string(),
        startDate: v.number(),
        endDate: v.number(),
      }),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existingFirstEvents = await ctx.table("calenderFirstEvents");

    await Promise.all(
      existingFirstEvents.map(async (firstEvent) => {
        const calendarEvent = await firstEvent.edge("calendarEvent");
        if (calendarEvent) {
          await ctx.table("calendarEvents").getX(calendarEvent._id).delete();
        }
        await ctx.table("calenderFirstEvents").getX(firstEvent._id).delete();
      }),
    );

    for (const event of args.events) {
      const firstEventId = await ctx.table("calenderFirstEvents").insert({
        eventCode: event.eventCode,
        teamNumber: args.teamNumber,
        season: args.season,
        locationLabel: event.locationLabel,
      });

      await ctx.table("calendarEvents").insert({
        firstEventId,
        startDate: event.startDate,
        endDate: event.endDate,
      });
    }

    return null;
  },
});
