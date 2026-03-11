import { v } from "convex/values";
import { query, mutation } from "../functions";

// ========================================
// Team Scouting Queries
// ========================================

// Get scouting data for a team
export const getTeamScouting = query({
  args: {
    teamNumber: v.number(),
  },
  returns: v.union(
    v.object({
      id: v.id("teamScouting"),
      teamCode: v.string(),
      createdAt: v.number(),
      comments: v.array(
        v.object({
          id: v.id("teamComments"),
          comment: v.string(),
          createdAt: v.number(),
        }),
      ),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const teamCode = args.teamNumber.toString();
    
    const scouting = await ctx
      .table("teamScouting")
      .filter((q) => q.eq(q.field("teamCode"), teamCode))
      .first();

    if (!scouting) return null;

    const comments = await scouting.edge("teamComments");
    
    return {
      id: scouting._id,
      teamCode: scouting.teamCode,
      createdAt: scouting.createdAt,
      comments: comments
        .map((c) => ({
          id: c._id,
          comment: c.comment,
          createdAt: c.createdAt,
        }))
        .sort((a, b) => b.createdAt - a.createdAt),
    };
  },
});

// List all scouted teams
export const listScoutedTeams = query({
  args: {},
  returns: v.array(
    v.object({
      id: v.id("teamScouting"),
      teamCode: v.string(),
      createdAt: v.number(),
      commentCount: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const scoutingRecords = await ctx.table("teamScouting");
    
    const results = await Promise.all(
      scoutingRecords.map(async (record) => {
        const comments = await record.edge("teamComments");
        return {
          id: record._id,
          teamCode: record.teamCode,
          createdAt: record.createdAt,
          commentCount: comments.length,
        };
      }),
    );

    return results.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// ========================================
// Team Scouting Mutations
// ========================================

// Create or get team scouting record
export const getOrCreateTeamScouting = mutation({
  args: {
    teamNumber: v.number(),
  },
  returns: v.id("teamScouting"),
  handler: async (ctx, args) => {
    const teamCode = args.teamNumber.toString();

    const existing = await ctx
      .table("teamScouting")
      .filter((q) => q.eq(q.field("teamCode"), teamCode))
      .first();

    if (existing) {
      return existing._id;
    }

    const id = await ctx.table("teamScouting").insert({
      teamCode,
      createdAt: Date.now(),
    });

    return id;
  },
});

// Add comment to team scouting
export const addTeamComment = mutation({
  args: {
    teamNumber: v.number(),
    comment: v.string(),
  },
  returns: v.id("teamComments"),
  handler: async (ctx, args) => {
    const teamCode = args.teamNumber.toString();

    let scouting = await ctx
      .table("teamScouting")
      .filter((q) => q.eq(q.field("teamCode"), teamCode))
      .first();

    if (!scouting) {
      const scoutingId = await ctx.table("teamScouting").insert({
        teamCode,
        createdAt: Date.now(),
      });
      scouting = await ctx.table("teamScouting").getX(scoutingId);
    }

    // Add comment
    const commentId = await ctx.table("teamComments").insert({
      teamScoutingId: scouting._id,
      comment: args.comment,
      createdAt: Date.now(),
    });

    return commentId;
  },
});

// Delete comment
export const deleteTeamComment = mutation({
  args: {
    commentId: v.id("teamComments"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    await ctx.table("teamComments").getX(args.commentId).delete();
    return true;
  },
});

// Update comment
export const updateTeamComment = mutation({
  args: {
    commentId: v.id("teamComments"),
    comment: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    await ctx.table("teamComments").getX(args.commentId).patch({
      comment: args.comment,
    });
    return true;
  },
});
