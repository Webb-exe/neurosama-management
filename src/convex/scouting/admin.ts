import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalMutation, mutation } from "../_generated/server";
import { PERMISSIONS } from "../../lib/permissions";
import { requireScoutingPermission } from "./lib";

const RESET_BATCH_SIZE = 100;
const RESET_TABLES = [
  "scoutingSessions",
  "scoutingPublicLinkTeams",
  "scoutingPublicLinks",
  "cycleTeamScouting",
  "scoutingTagDefinitions",
  "scoutingFormVersions",
  "scoutingForms",
  "scoutingCycles",
] as const;

const resetTableValidator = v.union(
  v.literal("scoutingSessions"),
  v.literal("scoutingPublicLinkTeams"),
  v.literal("scoutingPublicLinks"),
  v.literal("cycleTeamScouting"),
  v.literal("scoutingTagDefinitions"),
  v.literal("scoutingFormVersions"),
  v.literal("scoutingForms"),
  v.literal("scoutingCycles"),
);

type ResetTable = (typeof RESET_TABLES)[number];

function getNextTable(table: ResetTable): ResetTable | null {
  const currentIndex = RESET_TABLES.indexOf(table);
  if (currentIndex < 0 || currentIndex >= RESET_TABLES.length - 1) {
    return null;
  }
  return RESET_TABLES[currentIndex + 1];
}

export const resetAllScoutingData = mutation({
  args: {},
  returns: v.object({
    queued: v.boolean(),
  }),
  handler: async (ctx) => {
    await requireScoutingPermission(ctx, PERMISSIONS.scoutingReset.key);
    await ctx.scheduler.runAfter(0, internal.scouting.admin.resetAllScoutingDataBatch, {
      table: RESET_TABLES[0],
    });
    return { queued: true };
  },
});

export const resetAllScoutingDataBatch = internalMutation({
  args: {
    table: resetTableValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const currentTable = args.table;
    const docs = await ctx.db.query(currentTable).take(RESET_BATCH_SIZE);

    for (const doc of docs) {
      await ctx.db.delete(doc._id);
    }

    if (docs.length === RESET_BATCH_SIZE) {
      await ctx.scheduler.runAfter(0, internal.scouting.admin.resetAllScoutingDataBatch, {
        table: currentTable,
      });
      return null;
    }

    const nextTable = getNextTable(currentTable);
    if (nextTable) {
      await ctx.scheduler.runAfter(0, internal.scouting.admin.resetAllScoutingDataBatch, {
        table: nextTable,
      });
    }
    return null;
  },
});
