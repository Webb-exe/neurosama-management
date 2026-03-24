import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import {
  ensureTagDefinition,
  getOrCreateCycleTeamRecord,
  requireScoutingPermission,
} from "./lib";
import { PERMISSIONS } from "../../lib/permissions";

export const listTagDefinitions = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("scoutingTagDefinitions"),
      key: v.string(),
      label: v.string(),
      sortMode: v.union(v.literal("text"), v.literal("numeric")),
      valueKind: v.union(v.literal("scalar"), v.literal("multi")),
      suggestedValues: v.array(v.string()),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx) => {
    await requireScoutingPermission(ctx, PERMISSIONS.scoutingTeamViewTags.key);

    const definitions = await ctx.db.query("scoutingTagDefinitions").collect();
    return definitions
      .sort((left, right) => left.key.localeCompare(right.key))
      .map((definition) => ({
        _id: definition._id,
        key: definition.key,
        label: definition.label,
        sortMode: definition.sortMode,
        valueKind: definition.valueKind,
        suggestedValues: definition.suggestedValues,
        updatedAt: definition.updatedAt,
      }));
  },
});

export const getTagValueSuggestions = query({
  args: {
    cycleId: v.id("scoutingCycles"),
    key: v.string(),
  },
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    await requireScoutingPermission(ctx, PERMISSIONS.scoutingTeamManageTags.key);

    const teamRecords = await ctx.db
      .query("cycleTeamScouting")
      .withIndex("by_cycleId_updatedAt", (query) => query.eq("cycleId", args.cycleId))
      .collect();

    const suggestions = new Set<string>();
    const trimmedKey = args.key.trim();

    for (const record of teamRecords) {
      const value = record.tags[trimmedKey];
      if (value) {
        suggestions.add(value);
      }
    }

    const definition = await ctx.db
      .query("scoutingTagDefinitions")
      .withIndex("by_key", (query) => query.eq("key", trimmedKey))
      .first();

    for (const value of definition?.suggestedValues ?? []) {
      suggestions.add(value);
    }

    return Array.from(suggestions).sort((left, right) => left.localeCompare(right));
  },
});

export const upsertManualTeamTag = mutation({
  args: {
    cycleId: v.id("scoutingCycles"),
    teamNumber: v.number(),
    key: v.string(),
    value: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireScoutingPermission(ctx, PERMISSIONS.scoutingTeamManageTags.key);
    const key = args.key.trim();
    const value = args.value.trim();

    if (!key) {
      throw new Error("Tag key is required");
    }

    const record = await getOrCreateCycleTeamRecord(ctx, args.cycleId, args.teamNumber);
    await ensureTagDefinition(ctx, key, "scalar", value);

    await ctx.db.patch(record._id, {
      tags: {
        ...record.tags,
        [key]: value,
      },
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const deleteManualTeamTag = mutation({
  args: {
    cycleId: v.id("scoutingCycles"),
    teamNumber: v.number(),
    key: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireScoutingPermission(ctx, PERMISSIONS.scoutingTeamManageTags.key);
    const record = await ctx.db
      .query("cycleTeamScouting")
      .withIndex("by_cycleId_teamNumber", (query) =>
        query.eq("cycleId", args.cycleId).eq("teamNumber", args.teamNumber),
      )
      .first();

    if (!record) {
      return null;
    }

    const nextTags = { ...record.tags };
    delete nextTags[args.key.trim()];

    await ctx.db.patch(record._id, {
      tags: nextTags,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const updateTagDefinition = mutation({
  args: {
    tagDefinitionId: v.id("scoutingTagDefinitions"),
    label: v.string(),
    sortMode: v.union(v.literal("text"), v.literal("numeric")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireScoutingPermission(ctx, PERMISSIONS.scoutingTeamManageTags.key);
    const definition = await ctx.db.get(args.tagDefinitionId);
    if (!definition) {
      throw new Error("Tag definition not found");
    }

    await ctx.db.patch(definition._id, {
      label: args.label.trim() || definition.key,
      sortMode: args.sortMode,
      updatedAt: Date.now(),
    });
    return null;
  },
});
