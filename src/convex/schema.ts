import { defineEnt, defineEntSchema, getEntDefinitions } from "convex-ents";
import { v } from "convex/values";

const schema = defineEntSchema({
  // ========================================
  // USER MANAGEMENT
  // ========================================

  // Clerk user info - synced from Clerk webhooks
  clerkInfo: defineEnt({
    clerkId: v.string(),
    email: v.union(v.string(), v.null()),
    firstName: v.union(v.string(), v.null()),
    lastName: v.union(v.string(), v.null()),
    username: v.union(v.string(), v.null()),
    imageUrl: v.union(v.string(), v.null()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .edges("users", { ref: true })
    .edges("waitlist", { ref: true }),

  // Approved users - references clerkInfo table
  users: defineEnt({
    clerkInfoId: v.id("clerkInfo"),
    role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
  })
    .edge("clerkInfo", { to: "clerkInfo", field: "clerkInfoId" })
    .edges("invites", { ref: "invitedBy" }),

  // Waitlist - users pending approval, references clerkInfo table
  waitlist: defineEnt({
    clerkInfoId: v.id("clerkInfo"),
    createdAt: v.number(),
  }).edge("clerkInfo", { to: "clerkInfo", field: "clerkInfoId" }),

  // App settings - each setting is a typed boolean field
  settings: defineEnt({
    waitlistEnabled: v.boolean(),
    ftcTeamNumber: v.optional(v.number()),
  }),

  // Clerk invites tracking - for revocation
  invites: defineEnt({
    clerkInviteId: v.string(),
    invitedBy: v.optional(v.id("users")),
    createdAt: v.number(),
    status: v.union(v.literal("pending"), v.literal("revoked")),
  })
    .index("by_clerkInviteId", ["clerkInviteId"])
    .edge("invitedByUser", { to: "users", field: "invitedBy", optional: true }),

  calenderFirstEvents: defineEnt({
    eventCode: v.string(),
    teamNumber: v.number(),
    season: v.number(),
    locationLabel: v.string(),
  })
    .index("by_teamNumber", ["teamNumber"])
    .index("by_season_and_eventCode", ["season", "eventCode"])
    .edge("calendarEvent", { to: "calendarEvents", ref: "firstEventId" }),

  calendarEvents: defineEnt({
    startDate: v.number(),
    endDate: v.number(),
    
    firstEventId: v.optional(v.id("calenderFirstEvents")),
  })
    .index("by_startDate", ["startDate"])
    .index("by_endDate", ["endDate"])
    .edge("firstEvent", { to: "calenderFirstEvents", field: "firstEventId", optional: true }),

  teamScouting: defineEnt({
    teamCode: v.string(),
    createdAt: v.number(),
  })
    .index("by_teamCode", ["teamCode"])
    .edges("teamComments", { ref: "teamScoutingId" }),

  teamComments: defineEnt({
    teamScoutingId: v.id("teamScouting"),
    comment: v.string(),
    createdAt: v.number(),
  })
    .edge("teamScouting", { to: "teamScouting", field: "teamScoutingId" }),
});

export const entDefinitions = getEntDefinitions(schema);
export default schema;
