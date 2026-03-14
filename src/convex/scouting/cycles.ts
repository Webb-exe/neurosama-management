import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { getCycleOrDefault, requireAdminUser, requireApprovedUser } from "./lib";

export const listCycles = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("scoutingCycles"),
      name: v.string(),
      status: v.union(v.literal("active"), v.literal("archived")),
      createdAt: v.number(),
      archivedAt: v.optional(v.number()),
    }),
  ),
  handler: async (ctx) => {
    await requireApprovedUser(ctx);

    const cycles = await ctx.db.query("scoutingCycles").collect();
    return cycles
      .sort((left, right) => {
        if (left.status !== right.status) {
          return left.status === "active" ? -1 : 1;
        }

        return right.createdAt - left.createdAt;
      })
      .map((cycle) => ({
        _id: cycle._id,
        name: cycle.name,
        status: cycle.status,
        createdAt: cycle.createdAt,
        archivedAt: cycle.archivedAt,
      }));
  },
});

export const getActiveCycleDetail = query({
  args: {
    cycleId: v.optional(v.id("scoutingCycles")),
  },
  returns: v.union(
    v.object({
      _id: v.id("scoutingCycles"),
      name: v.string(),
      status: v.union(v.literal("active"), v.literal("archived")),
      createdAt: v.number(),
      archivedAt: v.optional(v.number()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    await requireApprovedUser(ctx);

    const cycle = await getCycleOrDefault(ctx, args.cycleId);
    if (!cycle) {
      return null;
    }

    return {
      _id: cycle._id,
      name: cycle.name,
      status: cycle.status,
      createdAt: cycle.createdAt,
      archivedAt: cycle.archivedAt,
    };
  },
});

export const createCycle = mutation({
  args: {
    name: v.string(),
  },
  returns: v.id("scoutingCycles"),
  handler: async (ctx, args) => {
    const user = await requireAdminUser(ctx);
    const name = args.name.trim();

    if (!name) {
      throw new Error("Cycle name is required");
    }

    return ctx.db.insert("scoutingCycles", {
      name,
      status: "active",
      createdBy: user._id,
      createdAt: Date.now(),
    });
  },
});

export const renameCycle = mutation({
  args: {
    cycleId: v.id("scoutingCycles"),
    name: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdminUser(ctx);
    const cycle = await ctx.db.get(args.cycleId);
    if (!cycle) {
      throw new Error("Scouting cycle not found");
    }

    const name = args.name.trim();
    if (!name) {
      throw new Error("Cycle name is required");
    }

    await ctx.db.patch(cycle._id, { name });
    return null;
  },
});

export const archiveCycle = mutation({
  args: {
    cycleId: v.id("scoutingCycles"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdminUser(ctx);
    const cycle = await ctx.db.get(args.cycleId);
    if (!cycle) {
      throw new Error("Scouting cycle not found");
    }

    await ctx.db.patch(cycle._id, {
      status: "archived",
      archivedAt: Date.now(),
    });
    return null;
  },
});
