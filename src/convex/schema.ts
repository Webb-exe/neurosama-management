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

  scoutingCycles: defineEnt({
    name: v.string(),
    status: v.union(v.literal("active"), v.literal("archived")),
    createdBy: v.id("users"),
    createdAt: v.number(),
    archivedAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"]),

  scoutingForms: defineEnt({
    name: v.string(),
    description: v.string(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    draftVersionId: v.optional(v.id("scoutingFormVersions")),
    latestPublishedVersionId: v.optional(v.id("scoutingFormVersions")),
  })
    .index("by_createdAt", ["createdAt"])
    .index("by_updatedAt", ["updatedAt"]),

  scoutingFormVersions: defineEnt({
    formId: v.id("scoutingForms"),
    status: v.union(v.literal("draft"), v.literal("published")),
    versionNumber: v.optional(v.number()),
    title: v.string(),
    description: v.string(),
    teamBindingMode: v.union(
      v.literal("preselected"),
      v.literal("selectAtSubmission"),
    ),
    questions: v.any(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedBy: v.id("users"),
    updatedAt: v.number(),
    publishedAt: v.optional(v.number()),
  })
    .index("by_formId_status", ["formId", "status"])
    .index("by_formId_versionNumber", ["formId", "versionNumber"])
    .index("by_formId_createdAt", ["formId", "createdAt"]),

  scoutingPublicLinks: defineEnt({
    token: v.string(),
    cycleId: v.id("scoutingCycles"),
    formId: v.id("scoutingForms"),
    formVersionId: v.id("scoutingFormVersions"),
    formNameSnapshot: v.string(),
    formVersionNumberSnapshot: v.number(),
    label: v.string(),
    description: v.string(),
    status: v.union(v.literal("active"), v.literal("disabled")),
    accessMode: v.union(v.literal("anyTeam"), v.literal("selectedTeams")),
    anyTeamSessionLimit: v.optional(v.number()),
    totalSessionsCreated: v.number(),
    totalSessionsSubmitted: v.number(),
    lastSessionCreatedAt: v.optional(v.number()),
    lastSessionSubmittedAt: v.optional(v.number()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_cycleId_status", ["cycleId", "status"])
    .index("by_formId_createdAt", ["formId", "createdAt"]),

  scoutingPublicLinkTeams: defineEnt({
    publicLinkId: v.id("scoutingPublicLinks"),
    teamNumber: v.number(),
    sessionLimit: v.optional(v.number()),
    sessionsCreated: v.number(),
    sessionsSubmitted: v.number(),
    lastSessionCreatedAt: v.optional(v.number()),
    lastSessionSubmittedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_publicLinkId", ["publicLinkId"])
    .index("by_publicLinkId_teamNumber", ["publicLinkId", "teamNumber"]),

  scoutingSessions: defineEnt({
    token: v.string(),
    cycleId: v.id("scoutingCycles"),
    formId: v.id("scoutingForms"),
    formVersionId: v.id("scoutingFormVersions"),
    publicLinkId: v.optional(v.id("scoutingPublicLinks")),
    publicLinkTeamId: v.optional(v.id("scoutingPublicLinkTeams")),
    formNameSnapshot: v.string(),
    formVersionNumberSnapshot: v.number(),
    status: v.union(
      v.literal("open"),
      v.literal("submitted"),
      v.literal("closed"),
    ),
    preselectedTeamNumber: v.optional(v.number()),
    selectedTeamNumber: v.optional(v.number()),
    answers: v.any(),
    lastAutosavedAt: v.number(),
    submittedAt: v.optional(v.number()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    tagWritesApplied: v.any(),
  })
    .index("by_token", ["token"])
    .index("by_cycleId_status", ["cycleId", "status"])
    .index("by_formId_status", ["formId", "status"])
    .index("by_cycleId_selectedTeamNumber", ["cycleId", "selectedTeamNumber"])
    .index("by_formVersionId", ["formVersionId"])
    .index("by_publicLinkId", ["publicLinkId"]),

  cycleTeamScouting: defineEnt({
    cycleId: v.id("scoutingCycles"),
    teamNumber: v.number(),
    tags: v.record(v.string(), v.string()),
    responseCount: v.number(),
    lastResponseAt: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_cycleId_teamNumber", ["cycleId", "teamNumber"])
    .index("by_cycleId_updatedAt", ["cycleId", "updatedAt"]),

  scoutingTagDefinitions: defineEnt({
    key: v.string(),
    label: v.string(),
    sortMode: v.union(v.literal("text"), v.literal("numeric")),
    valueKind: v.union(v.literal("scalar"), v.literal("multi")),
    suggestedValues: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),
});

export const entDefinitions = getEntDefinitions(schema);
export default schema;
