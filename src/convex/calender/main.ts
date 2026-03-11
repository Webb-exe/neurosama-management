import { query } from "../functions";
import { v } from "convex/values";

export const getEvents = query({
  args: { startDate: v.number(), endDate: v.number() },
  returns: v.array(
    v.object({
      id: v.id("calendarEvents"),
      startDate: v.number(),
      endDate: v.number(),
      data: v.union(
        v.object({
          type: v.literal("FtcTeamEvent"),
          eventCode: v.string(),
          locationLabel: v.string(),
          teamNumber: v.number(),
          season: v.number(),
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const events = await ctx
      .table("calendarEvents")
      .filter((q) =>
        q.and(
          q.gte(q.field("startDate"), args.startDate),
          q.lte(q.field("startDate"), args.endDate),
        ),
      );

    const result = await Promise.all(
      events.map(async (event) => {
        if (event.firstEventId) {
          const firstEvent = await event.edge("firstEvent");
          if (!firstEvent) {
            return null;
          }
          return {
            id: event._id,
            startDate: event.startDate,
            endDate: event.endDate,
            data: {
              type: "FtcTeamEvent" as const,
              eventCode: firstEvent.eventCode,
              locationLabel: firstEvent.locationLabel,
              teamNumber: firstEvent.teamNumber,
              season: firstEvent.season,
            },
          };
        }
        return null;
      }),
    );

    return result.filter((e) => e !== null);
  },
});
