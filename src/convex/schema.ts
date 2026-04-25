import { defineEnt, defineEntSchema, getEntDefinitions } from "convex-ents";
import { v } from "convex/values";
import { appRolesValidator } from "./auth/validators";

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
    // Static role definitions live in code; these stored fields only capture assignments.
    isOwner: v.optional(v.boolean()),
    roles: v.optional(appRolesValidator),
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

  // ========================================
  // INVENTORY + FINANCE
  // ========================================

  inventorySuppliers: defineEnt({
    name: v.string(),
    description: v.string(),
    contactName: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    websiteUrl: v.optional(v.string()),
    active: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_active", ["active"])
    .index("by_name", ["name"])
    .index("by_createdAt", ["createdAt"]),

  inventoryItems: defineEnt({
    name: v.string(),
    description: v.string(),
    supplierId: v.id("inventorySuppliers"),
    sku: v.optional(v.string()),
    partNumber: v.optional(v.string()),
    defaultUnit: v.string(),
    defaultUnitCostCents: v.optional(v.number()),
    totalQuantity: v.number(),
    usedOnRobotQuantity: v.number(),
    usedByMemberQuantity: v.optional(v.number()),
    disableOutOfStockWarnings: v.optional(v.boolean()),
    approvalStatus: v.optional(
      v.union(v.literal("draft"), v.literal("approved"), v.literal("rejected")),
    ),
    createdFromInvoiceId: v.optional(v.id("invoices")),
    active: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_supplierId", ["supplierId"])
    .index("by_supplierId_and_active", ["supplierId", "active"])
    .index("by_active", ["active"])
    .index("by_name", ["name"])
    .index("by_sku", ["sku"]),

  storageShelves: defineEnt({
    name: v.string(),
    description: v.string(),
    physicalLocationLabel: v.string(),
    sortOrder: v.number(),
    active: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_active_and_sortOrder", ["active", "sortOrder"])
    .index("by_sortOrder", ["sortOrder"]),

  storageBoxes: defineEnt({
    shelfId: v.id("storageShelves"),
    label: v.string(),
    description: v.string(),
    physicalLocationLabel: v.optional(v.string()),
    visualRow: v.optional(v.number()),
    visualColumn: v.optional(v.number()),
    visualRowSpan: v.optional(v.number()),
    visualColumnSpan: v.optional(v.number()),
    active: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_shelfId", ["shelfId"])
    .index("by_shelfId_and_active", ["shelfId", "active"])
    .index("by_shelfId_and_label", ["shelfId", "label"]),

  inventoryBoxItems: defineEnt({
    boxId: v.id("storageBoxes"),
    itemId: v.id("inventoryItems"),
    quantity: v.number(),
    unit: v.string(),
    notes: v.string(),
    updatedBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_boxId", ["boxId"])
    .index("by_itemId", ["itemId"])
    .index("by_boxId_and_itemId", ["boxId", "itemId"]),

  financeAccounts: defineEnt({
    name: v.string(),
    type: v.union(
      v.literal("team"),
      v.literal("grant"),
      v.literal("member"),
      v.literal("sponsor"),
      v.literal("other"),
    ),
    linkedUserId: v.optional(v.id("users")),
    description: v.string(),
    active: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_active", ["active"])
    .index("by_type", ["type"])
    .index("by_linkedUserId", ["linkedUserId"]),

  financeAccountFundingRows: defineEnt({
    accountId: v.id("financeAccounts"),
    source: v.string(),
    amountCents: v.number(),
    fundedAt: v.number(),
    notes: v.string(),
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_accountId", ["accountId"])
    .index("by_accountId_and_fundedAt", ["accountId", "fundedAt"])
    .index("by_fundedAt", ["fundedAt"]),

  invoices: defineEnt({
    supplierId: v.id("inventorySuppliers"),
    purchasedByUserId: v.id("users"),
    createdByUserId: v.id("users"),
    invoiceDate: v.number(),
    status: v.union(
      v.literal("draft"),
      v.literal("submitted"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("void"),
    ),
    reimbursementStatus: v.union(
      v.literal("not_required"),
      v.literal("pending"),
      v.literal("partial"),
      v.literal("reimbursed"),
    ),
    subtotalCents: v.number(),
    taxCents: v.number(),
    shippingCents: v.number(),
    discountCents: v.number(),
    totalCents: v.number(),
    notes: v.string(),
    submittedAt: v.optional(v.number()),
    approvedByUserId: v.optional(v.id("users")),
    approvedAt: v.optional(v.number()),
    rejectedByUserId: v.optional(v.id("users")),
    rejectedAt: v.optional(v.number()),
    rejectionReason: v.optional(v.string()),
    voidedByUserId: v.optional(v.id("users")),
    voidedAt: v.optional(v.number()),
    inventoryReceivedByUserId: v.optional(v.id("users")),
    inventoryReceivedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_supplierId", ["supplierId"])
    .index("by_purchasedByUserId", ["purchasedByUserId"])
    .index("by_createdByUserId", ["createdByUserId"])
    .index("by_status", ["status"])
    .index("by_reimbursementStatus", ["reimbursementStatus"])
    .index("by_invoiceDate", ["invoiceDate"])
    .index("by_purchasedByUserId_and_invoiceDate", ["purchasedByUserId", "invoiceDate"]),

  invoiceLineItems: defineEnt({
    invoiceId: v.id("invoices"),
    itemId: v.id("inventoryItems"),
    itemNameSnapshot: v.string(),
    itemSkuSnapshot: v.optional(v.string()),
    itemPartNumberSnapshot: v.optional(v.string()),
    description: v.string(),
    quantity: v.number(),
    unit: v.string(),
    unitCostCents: v.number(),
    taxCents: v.number(),
    shippingCents: v.number(),
    discountCents: v.number(),
    lineTotalCents: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_invoiceId", ["invoiceId"])
    .index("by_itemId", ["itemId"])
    .index("by_invoiceId_and_itemId", ["invoiceId", "itemId"]),

  invoiceAccountSplits: defineEnt({
    invoiceId: v.id("invoices"),
    accountId: v.id("financeAccounts"),
    amountCents: v.number(),
    notes: v.string(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_invoiceId", ["invoiceId"])
    .index("by_accountId", ["accountId"])
    .index("by_invoiceId_and_accountId", ["invoiceId", "accountId"]),

  invoiceReimbursements: defineEnt({
    invoiceId: v.id("invoices"),
    reimbursedToUserId: v.id("users"),
    reimbursedToAccountId: v.optional(v.id("financeAccounts")),
    sourceAccountId: v.id("financeAccounts"),
    amountCents: v.number(),
    reimbursedAt: v.number(),
    notes: v.string(),
    createdByUserId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_invoiceId", ["invoiceId"])
    .index("by_reimbursedToUserId", ["reimbursedToUserId"])
    .index("by_reimbursedToAccountId", ["reimbursedToAccountId"])
    .index("by_sourceAccountId", ["sourceAccountId"])
    .index("by_reimbursedAt", ["reimbursedAt"]),

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
