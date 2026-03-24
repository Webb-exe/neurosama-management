import { query, mutation, internalMutation } from "../functions";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { internal } from "../_generated/api";
import { PERMISSIONS } from "../../lib/permissions";

// ============================================================================
// INVITE MANAGEMENT
// ============================================================================

/**
 * Record a Clerk invite in our database
 */
export const recordInvite = internalMutation({
  args: { clerkInviteId: v.string() },
  returns: v.id("invites"),
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.auth.helpers.getCurrentUser, {});
    if (!user) throw new Error("User not found");

    const canManageInvites = await ctx.runQuery(internal.auth.helpers.hasPermission, {
      userId: user.userId,
      permission: PERMISSIONS.invitesManage.key,
    });
    if (!canManageInvites) {
      throw new Error("User not authorized to record invites");
    }

    // Check if already recorded
    const existing = await ctx.table("invites").get("by_clerkInviteId", args.clerkInviteId);
    if (existing) return existing._id;

    const id = await ctx.table("invites").insert({
      clerkInviteId: args.clerkInviteId,
      invitedBy: user.userId,
      createdAt: Date.now(),
      status: "pending",
    });
    return id;
  },
});

/**
 * List all invites - for owner/admin
 */
export const listInvites = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: v.object({
    page: v.array(
      v.object({
        _id: v.id("invites"),
        clerkInviteId: v.string(),
        invitedBy: v.optional(v.id("users")),
        createdAt: v.number(),
        status: v.union(v.literal("pending"), v.literal("revoked")),
      })
    ),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, args) => {
    await ctx.runQuery(internal.auth.helpers.requirePermission, {
      permission: PERMISSIONS.invitesManage.key,
    });

    const result = await ctx.table("invites").order("desc").paginate(args.paginationOpts);

    return {
      page: result.page.map((invite) => ({
        _id: invite._id,
        clerkInviteId: invite.clerkInviteId,
        invitedBy: invite.invitedBy,
        createdAt: invite.createdAt,
        status: invite.status,
      })),
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});

/**
 * Revoke an invite
 */
export const revokeInvite = mutation({
  args: { inviteId: v.id("invites") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.runQuery(internal.auth.helpers.requirePermission, {
      permission: PERMISSIONS.invitesManage.key,
    });

    const invite = await ctx.table("invites").get(args.inviteId);
    if (!invite) throw new Error("Invite not found");
    if (invite.status === "revoked") throw new Error("Invite already revoked");

    await invite.patch({ status: "revoked" });

    await ctx.scheduler.runAfter(0, internal.auth.clerk.revokeClerkInvite, {
      clerkInviteId: invite.clerkInviteId,
    });

    return null;
  },
});

/**
 * Mark invite as revoked - internal, used by webhooks
 */
export const markInviteRevoked = internalMutation({
  args: { clerkInviteId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const invite = await ctx.table("invites").get("by_clerkInviteId", args.clerkInviteId);
    if (invite) {
      await invite.patch({ status: "revoked" });
    }
    return null;
  },
});
