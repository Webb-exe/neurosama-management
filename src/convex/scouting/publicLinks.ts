import { v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import { type MutationCtx, type QueryCtx, mutation, query } from "../_generated/server";
import { generateSessionToken, getCycleById, requireAdminUser } from "./lib";

type Ctx = QueryCtx | MutationCtx;

const publicLinkTeamInputValidator = v.object({
  teamNumber: v.number(),
  sessionLimit: v.optional(v.number()),
});

const publicLinkTeamSummaryValidator = v.object({
  _id: v.id("scoutingPublicLinkTeams"),
  teamNumber: v.number(),
  sessionLimit: v.union(v.number(), v.null()),
  sessionsCreated: v.number(),
  sessionsSubmitted: v.number(),
  lastSessionCreatedAt: v.union(v.number(), v.null()),
  lastSessionSubmittedAt: v.union(v.number(), v.null()),
});

const publicLinkSummaryValidator = v.object({
  _id: v.id("scoutingPublicLinks"),
  cycleId: v.id("scoutingCycles"),
  cycleName: v.string(),
  formId: v.id("scoutingForms"),
  formName: v.string(),
  formVersionId: v.id("scoutingFormVersions"),
  formVersionNumber: v.number(),
  label: v.string(),
  description: v.string(),
  status: v.union(v.literal("active"), v.literal("disabled")),
  accessMode: v.union(v.literal("anyTeam"), v.literal("selectedTeams")),
  anyTeamSessionLimit: v.union(v.number(), v.null()),
  totalSessionsCreated: v.number(),
  totalSessionsSubmitted: v.number(),
  lastSessionCreatedAt: v.union(v.number(), v.null()),
  lastSessionSubmittedAt: v.union(v.number(), v.null()),
  createdAt: v.number(),
  updatedAt: v.number(),
  path: v.string(),
  teamConfigs: v.array(publicLinkTeamSummaryValidator),
});

function normalizePositiveInteger(value: number, label: string) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive whole number`);
  }
  return value;
}

function normalizeOptionalPositiveInteger(
  value: number | undefined,
  label: string,
): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  return normalizePositiveInteger(value, label);
}

function normalizeAllowedTeams(
  allowedTeams: Array<{
    teamNumber: number;
    sessionLimit?: number;
  }>,
) {
  const seen = new Set<number>();

  return allowedTeams
    .filter((team) => team.teamNumber !== undefined && String(team.teamNumber).trim() !== "")
    .map((team) => {
      const teamNumber = normalizePositiveInteger(team.teamNumber, "Team number");
      if (seen.has(teamNumber)) {
        throw new Error(`Team ${teamNumber} is listed more than once`);
      }
      seen.add(teamNumber);
      return {
        teamNumber,
        sessionLimit: normalizeOptionalPositiveInteger(
          team.sessionLimit,
          `Session limit for team ${teamNumber}`,
        ),
      };
    })
    .sort((left, right) => left.teamNumber - right.teamNumber);
}

function mapTeamConfig(team: Doc<"scoutingPublicLinkTeams">) {
  return {
    _id: team._id,
    teamNumber: team.teamNumber,
    sessionLimit: team.sessionLimit ?? null,
    sessionsCreated: team.sessionsCreated,
    sessionsSubmitted: team.sessionsSubmitted,
    lastSessionCreatedAt: team.lastSessionCreatedAt ?? null,
    lastSessionSubmittedAt: team.lastSessionSubmittedAt ?? null,
  };
}

async function getLinkByToken(ctx: Ctx, token: string) {
  return await ctx.db
    .query("scoutingPublicLinks")
    .withIndex("by_token", (query) => query.eq("token", token))
    .first();
}

async function loadTeamConfigs(
  ctx: Ctx,
  publicLinkId: Id<"scoutingPublicLinks">,
) {
  const teamConfigs = await ctx.db
    .query("scoutingPublicLinkTeams")
    .withIndex("by_publicLinkId", (query) => query.eq("publicLinkId", publicLinkId))
    .collect();

  return teamConfigs
    .sort((left: Doc<"scoutingPublicLinkTeams">, right: Doc<"scoutingPublicLinkTeams">) =>
      left.teamNumber - right.teamNumber,
    )
    .map(mapTeamConfig);
}

async function mapPublicLink(
  ctx: Ctx,
  link: Doc<"scoutingPublicLinks">,
) {
  const cycle = await ctx.db.get(link.cycleId);
  const teamConfigs = await loadTeamConfigs(ctx, link._id);

  return {
    _id: link._id,
    cycleId: link.cycleId,
    cycleName: cycle?.name ?? "Unknown cycle",
    formId: link.formId,
    formName: link.formNameSnapshot,
    formVersionId: link.formVersionId,
    formVersionNumber: link.formVersionNumberSnapshot,
    label: link.label,
    description: link.description,
    status: link.status,
    accessMode: link.accessMode,
    anyTeamSessionLimit: link.anyTeamSessionLimit ?? null,
    totalSessionsCreated: link.totalSessionsCreated,
    totalSessionsSubmitted: link.totalSessionsSubmitted,
    lastSessionCreatedAt: link.lastSessionCreatedAt ?? null,
    lastSessionSubmittedAt: link.lastSessionSubmittedAt ?? null,
    createdAt: link.createdAt,
    updatedAt: link.updatedAt,
    path: `/scouting/public/${link.token}`,
    teamConfigs,
  };
}

export async function recordPublicLinkSubmission(
  ctx: MutationCtx,
  session: Doc<"scoutingSessions">,
  submittedAt: number,
) {
  if (!session.publicLinkId) {
    return;
  }

  const publicLink = await ctx.db.get(session.publicLinkId);
  if (publicLink) {
    await ctx.db.patch(publicLink._id, {
      totalSessionsSubmitted: publicLink.totalSessionsSubmitted + 1,
      lastSessionSubmittedAt: submittedAt,
      updatedAt: submittedAt,
    });
  }

  if (!session.publicLinkTeamId) {
    return;
  }

  const teamConfig = await ctx.db.get(session.publicLinkTeamId);
  if (!teamConfig) {
    return;
  }

  await ctx.db.patch(teamConfig._id, {
    sessionsSubmitted: teamConfig.sessionsSubmitted + 1,
    lastSessionSubmittedAt: submittedAt,
    updatedAt: submittedAt,
  });
}

export const createPublicLink = mutation({
  args: {
    cycleId: v.id("scoutingCycles"),
    formId: v.id("scoutingForms"),
    label: v.string(),
    description: v.string(),
    accessMode: v.union(v.literal("anyTeam"), v.literal("selectedTeams")),
    anyTeamSessionLimit: v.optional(v.number()),
    allowedTeams: v.array(publicLinkTeamInputValidator),
  },
  returns: v.object({
    publicLinkId: v.id("scoutingPublicLinks"),
    token: v.string(),
    path: v.string(),
  }),
  handler: async (ctx, args) => {
    const user = await requireAdminUser(ctx);
    const cycle = await getCycleById(ctx, args.cycleId);
    if (cycle.status !== "active") {
      throw new Error("Public links can only be created for active cycles");
    }

    const form = await ctx.db.get(args.formId);
    if (!form?.latestPublishedVersionId) {
      throw new Error("Publish the form before creating a public link");
    }

    const version = await ctx.db.get(form.latestPublishedVersionId);
    if (!version || version.versionNumber === undefined) {
      throw new Error("Published form version not found");
    }

    const label = args.label.trim();
    if (!label) {
      throw new Error("Link name is required");
    }

    const anyTeamSessionLimit = normalizeOptionalPositiveInteger(
      args.anyTeamSessionLimit,
      "Any-team session limit",
    );
    const allowedTeams = normalizeAllowedTeams(args.allowedTeams);

    if (args.accessMode === "selectedTeams" && allowedTeams.length === 0) {
      throw new Error("Add at least one allowed team for a team-restricted public link");
    }

    const now = Date.now();
    const token = generateSessionToken();
    const publicLinkId = await ctx.db.insert("scoutingPublicLinks", {
      token,
      cycleId: cycle._id,
      formId: form._id,
      formVersionId: version._id,
      formNameSnapshot: form.name,
      formVersionNumberSnapshot: version.versionNumber,
      label,
      description: args.description.trim(),
      status: "active",
      accessMode: args.accessMode,
      anyTeamSessionLimit,
      totalSessionsCreated: 0,
      totalSessionsSubmitted: 0,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    });

    for (const team of allowedTeams) {
      await ctx.db.insert("scoutingPublicLinkTeams", {
        publicLinkId,
        teamNumber: team.teamNumber,
        sessionLimit: team.sessionLimit,
        sessionsCreated: 0,
        sessionsSubmitted: 0,
        createdAt: now,
        updatedAt: now,
      });
    }

    return {
      publicLinkId,
      token,
      path: `/scouting/public/${token}`,
    };
  },
});

export const listFormPublicLinks = query({
  args: {
    formId: v.id("scoutingForms"),
  },
  returns: v.array(publicLinkSummaryValidator),
  handler: async (ctx, args) => {
    await requireAdminUser(ctx);

    const links = await ctx.db
      .query("scoutingPublicLinks")
      .withIndex("by_formId_createdAt", (query) => query.eq("formId", args.formId))
      .collect();

    const rows = await Promise.all(
      links
        .sort((left, right) => right.updatedAt - left.updatedAt)
        .map((link) => mapPublicLink(ctx, link)),
    );

    return rows;
  },
});

export const listDashboardPublicLinks = query({
  args: {
    cycleId: v.optional(v.id("scoutingCycles")),
    formId: v.optional(v.id("scoutingForms")),
  },
  returns: v.array(publicLinkSummaryValidator),
  handler: async (ctx, args) => {
    await requireAdminUser(ctx);

    const cycleId = args.cycleId;
    const links = cycleId
      ? await ctx.db
          .query("scoutingPublicLinks")
          .withIndex("by_cycleId_status", (query) => query.eq("cycleId", cycleId))
          .collect()
      : await ctx.db.query("scoutingPublicLinks").collect();

    const filteredLinks = args.formId
      ? links.filter((link) => link.formId === args.formId)
      : links;

    const rows = await Promise.all(
      filteredLinks
        .sort((left, right) => {
          const rightTime = right.lastSessionCreatedAt ?? right.updatedAt;
          const leftTime = left.lastSessionCreatedAt ?? left.updatedAt;
          return rightTime - leftTime;
        })
        .map((link) => mapPublicLink(ctx, link)),
    );

    return rows;
  },
});

export const setPublicLinkStatus = mutation({
  args: {
    publicLinkId: v.id("scoutingPublicLinks"),
    status: v.union(v.literal("active"), v.literal("disabled")),
  },
  returns: v.object({
    ok: v.boolean(),
  }),
  handler: async (ctx, args) => {
    await requireAdminUser(ctx);

    const publicLink = await ctx.db.get(args.publicLinkId);
    if (!publicLink) {
      throw new Error("Public link not found");
    }

    await ctx.db.patch(publicLink._id, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return { ok: true };
  },
});

export const getPublicLinkLanding = query({
  args: {
    token: v.string(),
  },
  returns: v.union(
    v.object({
      status: v.literal("invalid"),
    }),
    v.object({
      status: v.literal("disabled"),
      label: v.string(),
      formName: v.string(),
      cycleName: v.string(),
    }),
    v.object({
      status: v.literal("open"),
      label: v.string(),
      description: v.string(),
      formName: v.string(),
      cycleName: v.string(),
      formVersionNumber: v.number(),
      accessMode: v.union(v.literal("anyTeam"), v.literal("selectedTeams")),
      anyTeamSessionLimit: v.union(v.number(), v.null()),
      teamCount: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const link = await getLinkByToken(ctx, args.token.trim());
    if (!link) {
      return { status: "invalid" as const };
    }

    const cycle = await ctx.db.get(link.cycleId);
    if (!cycle) {
      return { status: "invalid" as const };
    }

    if (link.status !== "active" || cycle.status !== "active") {
      return {
        status: "disabled" as const,
        label: link.label,
        formName: link.formNameSnapshot,
        cycleName: cycle.name,
      };
    }

    const teamConfigs = await loadTeamConfigs(ctx, link._id);

    return {
      status: "open" as const,
      label: link.label,
      description: link.description,
      formName: link.formNameSnapshot,
      cycleName: cycle.name,
      formVersionNumber: link.formVersionNumberSnapshot,
      accessMode: link.accessMode,
      anyTeamSessionLimit: link.anyTeamSessionLimit ?? null,
      teamCount: teamConfigs.length,
    };
  },
});

export const startPublicLinkSession = mutation({
  args: {
    token: v.string(),
    teamNumber: v.number(),
  },
  returns: v.object({
    sessionId: v.id("scoutingSessions"),
    sessionToken: v.string(),
    path: v.string(),
    teamNumber: v.number(),
  }),
  handler: async (ctx, args) => {
    const teamNumber = normalizePositiveInteger(args.teamNumber, "Team number");
    const link = await getLinkByToken(ctx, args.token.trim());
    if (!link) {
      throw new Error("This public form link is invalid");
    }
    if (link.status !== "active") {
      throw new Error("This public form link has been disabled");
    }

    const cycle = await ctx.db.get(link.cycleId);
    if (!cycle || cycle.status !== "active") {
      throw new Error("This public form link is no longer accepting responses");
    }

    const version = await ctx.db.get(link.formVersionId);
    if (!version || version.versionNumber === undefined) {
      throw new Error("The linked form version is no longer available");
    }

    let teamConfig = await ctx.db
      .query("scoutingPublicLinkTeams")
      .withIndex("by_publicLinkId_teamNumber", (query) =>
        query.eq("publicLinkId", link._id).eq("teamNumber", teamNumber),
      )
      .first();

    if (link.accessMode === "selectedTeams" && !teamConfig) {
      throw new Error(`Team ${teamNumber} is not allowed to use this form link`);
    }

    const now = Date.now();
    if (!teamConfig) {
      const teamConfigId = await ctx.db.insert("scoutingPublicLinkTeams", {
        publicLinkId: link._id,
        teamNumber,
        sessionLimit: link.anyTeamSessionLimit,
        sessionsCreated: 0,
        sessionsSubmitted: 0,
        createdAt: now,
        updatedAt: now,
      });
      teamConfig = await ctx.db.get(teamConfigId);
      if (!teamConfig) {
        throw new Error("Could not prepare team access for this public link");
      }
    }

    const sessionLimit = teamConfig.sessionLimit ?? link.anyTeamSessionLimit;
    if (sessionLimit !== undefined && teamConfig.sessionsCreated >= sessionLimit) {
      throw new Error(
        `Team ${teamNumber} has already used all ${sessionLimit} session${
          sessionLimit === 1 ? "" : "s"
        } for this public link`,
      );
    }

    const sessionToken = generateSessionToken();
    const sessionId = await ctx.db.insert("scoutingSessions", {
      token: sessionToken,
      cycleId: cycle._id,
      formId: link.formId,
      formVersionId: link.formVersionId,
      publicLinkId: link._id,
      publicLinkTeamId: teamConfig._id,
      formNameSnapshot: link.formNameSnapshot,
      formVersionNumberSnapshot: link.formVersionNumberSnapshot,
      status: "open",
      preselectedTeamNumber: teamNumber,
      answers: {},
      lastAutosavedAt: now,
      createdBy: link.createdBy,
      createdAt: now,
      tagWritesApplied: [],
    });

    await ctx.db.patch(link._id, {
      totalSessionsCreated: link.totalSessionsCreated + 1,
      lastSessionCreatedAt: now,
      updatedAt: now,
    });
    await ctx.db.patch(teamConfig._id, {
      sessionsCreated: teamConfig.sessionsCreated + 1,
      lastSessionCreatedAt: now,
      updatedAt: now,
    });

    return {
      sessionId,
      sessionToken,
      path: `/scouting/session/${sessionToken}`,
      teamNumber,
    };
  },
});
