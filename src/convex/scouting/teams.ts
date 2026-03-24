import { v } from "convex/values";
import { query } from "../_generated/server";
import { PERMISSIONS, userHasPermission } from "../../lib/permissions";
import { getCycleById, requireApprovedUser, requireScoutingPermission } from "./lib";

function compareAscii(left: string, right: string) {
  if (left === right) {
    return 0;
  }

  return left < right ? -1 : 1;
}

function parseStoredValues(value: string | undefined, valueKind: "scalar" | "multi") {
  if (!value) {
    return [];
  }

  if (valueKind !== "multi") {
    return [value];
  }

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.map(String).filter(Boolean);
    }
  } catch {
    return [value];
  }

  return [value];
}

export const getTeamSummary = query({
  args: {
    cycleId: v.id("scoutingCycles"),
    teamNumber: v.number(),
  },
  returns: v.object({
    cycle: v.object({
      _id: v.id("scoutingCycles"),
      name: v.string(),
      status: v.union(v.literal("active"), v.literal("archived")),
    }),
    team: v.object({
      teamNumber: v.number(),
      tags: v.record(v.string(), v.string()),
      responseCount: v.number(),
      lastResponseAt: v.union(v.number(), v.null()),
      updatedAt: v.union(v.number(), v.null()),
    }),
    responses: v.array(
      v.object({
        _id: v.id("scoutingSessions"),
        formName: v.string(),
        formVersionNumber: v.number(),
        status: v.union(v.literal("open"), v.literal("submitted"), v.literal("closed")),
        submittedAt: v.union(v.number(), v.null()),
        lastAutosavedAt: v.number(),
        path: v.string(),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    const user = await requireApprovedUser(ctx);
    if (!userHasPermission(user, PERMISSIONS.scoutingView.key)) {
      throw new Error(`Not authorized - ${PERMISSIONS.scoutingView.key} required`);
    }
    const cycle = await getCycleById(ctx, args.cycleId);
    const canViewTags = userHasPermission(user, PERMISSIONS.scoutingTeamViewTags.key);
    const canViewResponses = userHasPermission(user, PERMISSIONS.scoutingTeamViewResponses.key);

    const teamRecord = await ctx.db
      .query("cycleTeamScouting")
      .withIndex("by_cycleId_teamNumber", (query) =>
        query.eq("cycleId", args.cycleId).eq("teamNumber", args.teamNumber),
      )
      .first();

    const sessions = await ctx.db
      .query("scoutingSessions")
      .withIndex("by_cycleId_status", (query) => query.eq("cycleId", args.cycleId))
      .collect();

    return {
      cycle: {
        _id: cycle._id,
        name: cycle.name,
        status: cycle.status,
      },
      team: {
        teamNumber: args.teamNumber,
        tags: canViewTags ? (teamRecord?.tags ?? {}) : {},
        responseCount: canViewResponses ? (teamRecord?.responseCount ?? 0) : 0,
        lastResponseAt: canViewResponses ? (teamRecord?.lastResponseAt ?? null) : null,
        updatedAt: teamRecord?.updatedAt ?? null,
      },
      responses: canViewResponses
        ? sessions
            .filter(
              (session) =>
                session.selectedTeamNumber === args.teamNumber ||
                session.preselectedTeamNumber === args.teamNumber,
            )
            .sort((left, right) => {
              const leftTime = left.submittedAt ?? left.lastAutosavedAt;
              const rightTime = right.submittedAt ?? right.lastAutosavedAt;
              return rightTime - leftTime;
            })
            .map((session) => ({
              _id: session._id,
              formName: session.formNameSnapshot,
              formVersionNumber: session.formVersionNumberSnapshot,
              status: session.status,
              submittedAt: session.submittedAt ?? null,
              lastAutosavedAt: session.lastAutosavedAt,
              path: `/scouting/session/${session.token}`,
            }))
        : [],
    };
  },
});

export const getAnalysis = query({
  args: {
    cycleId: v.id("scoutingCycles"),
  },
  returns: v.object({
    cycleId: v.id("scoutingCycles"),
    cycleName: v.string(),
    tagColumns: v.array(
      v.object({
        key: v.string(),
        label: v.string(),
        valueKind: v.union(v.literal("scalar"), v.literal("multi")),
        values: v.array(v.string()),
      }),
    ),
    rows: v.array(
      v.object({
        teamNumber: v.number(),
        tags: v.record(v.string(), v.string()),
        responseCount: v.number(),
        lastResponseAt: v.union(v.number(), v.null()),
        updatedAt: v.number(),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    await requireScoutingPermission(ctx, PERMISSIONS.scoutingAnalysisView.key);
    const cycle = await getCycleById(ctx, args.cycleId);

    const records = await ctx.db
      .query("cycleTeamScouting")
      .withIndex("by_cycleId_updatedAt", (query) => query.eq("cycleId", args.cycleId))
      .collect();
    const definitions = await ctx.db.query("scoutingTagDefinitions").collect();
    const definitionByKey = new Map(definitions.map((definition) => [definition.key, definition]));
    const tagKeys = new Set<string>();

    for (const record of records) {
      for (const key of Object.keys(record.tags)) {
        tagKeys.add(key);
      }
    }

    const tagColumns = Array.from(tagKeys)
      .sort(compareAscii)
      .map((key) => {
        const definition = definitionByKey.get(key);
        const valueKind = definition?.valueKind ?? "scalar";
        const values = new Set<string>();

        for (const record of records) {
          for (const value of parseStoredValues(record.tags[key], valueKind)) {
            values.add(value);
          }
        }

        return {
          key,
          label: definition?.label ?? key,
          valueKind,
          values: Array.from(values).sort(compareAscii),
        };
      });

    const rows = [...records].sort((left, right) => left.teamNumber - right.teamNumber);

    return {
      cycleId: cycle._id,
      cycleName: cycle.name,
      tagColumns,
      rows: rows.map((record) => ({
        teamNumber: record.teamNumber,
        tags: record.tags,
        responseCount: record.responseCount,
        lastResponseAt: record.lastResponseAt ?? null,
        updatedAt: record.updatedAt,
      })),
    };
  },
});
