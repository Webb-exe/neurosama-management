import { query, mutation, internalQuery, internalMutation } from "../functions";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { clerkUserInfoValidator } from "./clerk";
import {
  sortAppRoles,
  normalizePermissionUser,
  type AppRole,
} from "../../lib/permissions";
import {
  appRoleValidator,
  appRolesValidator,
} from "./validators";

// ============================================================================
// CLERK INFO MANAGEMENT
// ============================================================================

/**
 * Upsert clerk info (create or update) from webhook data
 */
export const upsertClerkInfo = internalMutation({
  args: clerkUserInfoValidator,
  returns: v.id("clerkInfo"),
  handler: async (ctx, args) => {
    if (!args.id) throw new Error("Clerk ID is required");

    const existing = await ctx.table("clerkInfo").get("by_clerkId", args.id);
    const now = Date.now();

    if (existing) {
      await existing.patch({
        email: args.emailAddress,
        firstName: args.firstName,
        lastName: args.lastName,
        username: args.username,
        imageUrl: args.imageUrl,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.table("clerkInfo").insert({
      clerkId: args.id,
      email: args.emailAddress,
      firstName: args.firstName,
      lastName: args.lastName,
      username: args.username,
      imageUrl: args.imageUrl,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Delete clerk info by clerkId
 */
export const deleteClerkInfo = internalMutation({
  args: { clerkId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const clerkInfo = await ctx.table("clerkInfo").get("by_clerkId", args.clerkId);
    if (!clerkInfo) return null;

    await clerkInfo.delete();
    return null;
  },
});

/**
 * Get clerk info by clerkId
 */
export const getClerkInfoByClerkId = internalQuery({
  args: { clerkId: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("clerkInfo"),
      clerkId: v.string(),
      email: v.union(v.string(), v.null()),
      firstName: v.union(v.string(), v.null()),
      lastName: v.union(v.string(), v.null()),
      username: v.union(v.string(), v.null()),
      imageUrl: v.union(v.string(), v.null()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.table("clerkInfo").get("by_clerkId", args.clerkId) ?? null;
  },
});

// ============================================================================
// AUTH STATUS & REGISTRATION
// ============================================================================

const editableRoleValidator = appRoleValidator;

const approvedUserShape = v.object({
  _id: v.id("users"),
  clerkInfoId: v.id("clerkInfo"),
  isOwner: v.boolean(),
  roles: appRolesValidator,
});

function normalizeApprovedUserRecord(user: {
  _id: Id<"users">;
  clerkInfoId: Id<"clerkInfo">;
  isOwner?: boolean;
  roles?: readonly string[];
}) {
  const normalized = normalizePermissionUser(user);
  if (!normalized) {
    throw new Error("Invalid user record");
  }
  return {
    _id: user._id,
    clerkInfoId: user.clerkInfoId,
    isOwner: normalized.isOwner,
    roles: sortAppRoles(Array.from(new Set(normalized.roles))),
  };
}

function normalizeRequestedRoles(roles: readonly AppRole[]) {
  return sortAppRoles(Array.from(new Set(roles)));
}

/**
 * Get auth status
 */
export const getAuthStatus = query({
  args: {},
  returns: v.union(
    v.object({
      status: v.literal("approved"),
      user: approvedUserShape,
    }),
    v.object({ status: v.literal("waitlisted") }),
    v.object({ status: v.literal("pending"), hasClerkInfo: v.boolean() }),
    v.object({ status: v.literal("not_authenticated") })
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { status: "not_authenticated" as const };

    const clerkInfo = await ctx.table("clerkInfo").get("by_clerkId", identity.subject);
    if (!clerkInfo) return { status: "pending" as const, hasClerkInfo: false };

    const user = await ctx.table("users").get("clerkInfoId", clerkInfo._id);
    if (user) {
      return {
        status: "approved" as const,
        user: normalizeApprovedUserRecord(user),
      };
    }

    const onWaitlist = await ctx.table("waitlist").get("clerkInfoId", clerkInfo._id);
    if (onWaitlist) return { status: "waitlisted" as const };

    return { status: "pending" as const, hasClerkInfo: true };
  },
});

/**
 * Ensure user is registered
 */
export const ensureUserRegistered = mutation({
  args: {},
  returns: v.union(
    v.object({
      status: v.literal("approved"),
      user: approvedUserShape,
    }),
    v.object({ status: v.literal("waitlisted") }),
    v.object({ status: v.literal("not_allowed"), deleteFromClerk: v.boolean() })
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const clerkId = identity.subject;

    // Get or create clerkInfo
    let clerkInfo = await ctx.table("clerkInfo").get("by_clerkId", clerkId);
    if (!clerkInfo) {
      const now = Date.now();
      const id = await ctx.table("clerkInfo").insert({
        clerkId,
        email: identity.email ?? null,
        firstName: identity.givenName ?? null,
        lastName: identity.familyName ?? null,
        username: identity.nickname ?? null,
        imageUrl: identity.pictureUrl ?? null,
        createdAt: now,
        updatedAt: now,
      });
      clerkInfo = await ctx.table("clerkInfo").getX(id);
    }

    // Check if already approved
    const existingUser = await ctx.table("users").get("clerkInfoId", clerkInfo._id);
    if (existingUser) {
      return {
        status: "approved" as const,
        user: normalizeApprovedUserRecord(existingUser),
      };
    }

    // Check if on waitlist
    const onWaitlist = await ctx.table("waitlist").get("clerkInfoId", clerkInfo._id);
    if (onWaitlist) return { status: "waitlisted" as const };

    // First user becomes owner
    const hasAnyUser = await ctx.table("users").first();
    if (!hasAnyUser) {
      const userId = await ctx.table("users").insert({
        clerkInfoId: clerkInfo._id,
        isOwner: true,
        roles: [],
      });
      return {
        status: "approved" as const,
        user: {
          _id: userId,
          clerkInfoId: clerkInfo._id,
          isOwner: true,
          roles: [],
        },
      };
    }

    // Check waitlist settings
    const settings = await ctx.table("settings").first();
    if (settings?.waitlistEnabled ?? true) {
      await ctx.table("waitlist").insert({ clerkInfoId: clerkInfo._id, createdAt: Date.now() });
      return { status: "waitlisted" as const };
    }

    // Not allowed
    await ctx.runMutation(internal.auth.users.deleteClerkInfo, { clerkId });
    await ctx.scheduler.runAfter(0, internal.auth.clerk.deleteClerkUser, { clerkId });
    return { status: "not_allowed" as const, deleteFromClerk: true };
  },
});

// ============================================================================
// USER QUERIES
// ============================================================================

const clerkInfoShape = v.object({
  _id: v.id("clerkInfo"),
  clerkId: v.string(),
  email: v.union(v.string(), v.null()),
  firstName: v.union(v.string(), v.null()),
  lastName: v.union(v.string(), v.null()),
  username: v.union(v.string(), v.null()),
  imageUrl: v.union(v.string(), v.null()),
});

const userWithClerkInfoShape = v.object({
  _id: v.id("users"),
  clerkInfoId: v.id("clerkInfo"),
  isOwner: v.boolean(),
  roles: appRolesValidator,
  clerkInfo: clerkInfoShape,
});

/**
 * Get user info by ID (internal)
 */
export const getUserInfo = internalQuery({
  args: { userId: v.id("users") },
  returns: v.union(userWithClerkInfoShape, v.null()),
  handler: async (ctx, args) => {
    const user = await ctx.table("users").get(args.userId);
    if (!user) return null;

    const clerkInfo = await ctx.table("clerkInfo").get(user.clerkInfoId);
    if (!clerkInfo) return null;

    return {
      ...normalizeApprovedUserRecord(user),
      clerkInfo: {
        _id: clerkInfo._id,
        clerkId: clerkInfo.clerkId,
        email: clerkInfo.email,
        firstName: clerkInfo.firstName,
        lastName: clerkInfo.lastName,
        username: clerkInfo.username,
        imageUrl: clerkInfo.imageUrl,
      },
    };
  },
});

/**
 * Check if user is on waitlist (internal)
 */
export const isOnWaitlist = internalQuery({
  args: { userId: v.id("users") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const user = await ctx.table("users").get(args.userId);
    if (!user) return false;
    const entry = await ctx.table("waitlist").get("clerkInfoId", user.clerkInfoId);
    return entry !== null;
  },
});

// ============================================================================
// WAITLIST MANAGEMENT
// ============================================================================

const waitlistWithClerkInfoShape = v.object({
  _id: v.id("waitlist"),
  clerkInfoId: v.id("clerkInfo"),
  createdAt: v.number(),
  clerkInfo: clerkInfoShape,
});

/**
 * List waitlist entries (internal)
 */
export const listWaitlistInternal = internalQuery({
  args: { paginationOpts: paginationOptsValidator },
  returns: v.object({
    page: v.array(waitlistWithClerkInfoShape),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, args) => {
    const result = await ctx.table("waitlist").order("desc").paginate(args.paginationOpts);

    const page = await Promise.all(
      result.page.map(async (entry) => {
        const clerkInfo = await ctx.table("clerkInfo").getX(entry.clerkInfoId);
        return {
          _id: entry._id,
          clerkInfoId: entry.clerkInfoId,
          createdAt: entry.createdAt,
          clerkInfo: {
            _id: clerkInfo._id,
            clerkId: clerkInfo.clerkId,
            email: clerkInfo.email,
            firstName: clerkInfo.firstName,
            lastName: clerkInfo.lastName,
            username: clerkInfo.username,
            imageUrl: clerkInfo.imageUrl,
          },
        };
      })
    );

    return { page, isDone: result.isDone, continueCursor: result.continueCursor };
  },
});

/**
 * List waitlist entries - for owner/admin
 */
export const listWaitlist = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: v.object({
    page: v.array(waitlistWithClerkInfoShape),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, args) => {
    await ctx.runQuery(internal.auth.helpers.requireAdmin, {});

    const result = await ctx.table("waitlist").order("desc").paginate(args.paginationOpts);

    const page = await Promise.all(
      result.page.map(async (entry) => {
        const clerkInfo = await ctx.table("clerkInfo").getX(entry.clerkInfoId);
        return {
          _id: entry._id,
          clerkInfoId: entry.clerkInfoId,
          createdAt: entry.createdAt,
          clerkInfo: {
            _id: clerkInfo._id,
            clerkId: clerkInfo.clerkId,
            email: clerkInfo.email,
            firstName: clerkInfo.firstName,
            lastName: clerkInfo.lastName,
            username: clerkInfo.username,
            imageUrl: clerkInfo.imageUrl,
          },
        };
      })
    );

    return { page, isDone: result.isDone, continueCursor: result.continueCursor };
  },
});

/**
 * Approve user from waitlist
 */
export const approveFromWaitlist = mutation({
  args: {
    waitlistId: v.id("waitlist"),
    roles: v.optional(v.array(editableRoleValidator)),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    await ctx.runQuery(internal.auth.helpers.requireAdmin, {});

    const entry = await ctx.table("waitlist").get(args.waitlistId);
    if (!entry) throw new Error("Waitlist entry not found");

    const roles = normalizeRequestedRoles(args.roles ?? ["member"]);
    const userId = await ctx.table("users").insert({
      clerkInfoId: entry.clerkInfoId,
      isOwner: false,
      roles,
    });

    await entry.delete();
    return userId;
  },
});

/**
 * Remove from waitlist (deny)
 */
export const removeFromWaitlist = mutation({
  args: {
    waitlistId: v.id("waitlist"),
    deleteFromClerk: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.runQuery(internal.auth.helpers.requireAdmin, {});

    const entry = await ctx.table("waitlist").get(args.waitlistId);
    if (!entry) throw new Error("Waitlist entry not found");

    const clerkInfo = await ctx.table("clerkInfo").get(entry.clerkInfoId);
    await entry.delete();

    if (args.deleteFromClerk && clerkInfo) {
      await clerkInfo.delete();
      await ctx.scheduler.runAfter(0, internal.auth.clerk.deleteClerkUser, {
        clerkId: clerkInfo.clerkId,
      });
    }

    return null;
  },
});

// ============================================================================
// USER MANAGEMENT
// ============================================================================

/**
 * List all users - for owner/admin
 */
export const listUsers = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: v.object({
    page: v.array(userWithClerkInfoShape),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, args) => {
    await ctx.runQuery(internal.auth.helpers.requireAdmin, {});

    const result = await ctx.table("users").order("desc").paginate(args.paginationOpts);

    const page = await Promise.all(
      result.page.map(async (user) => {
        const clerkInfo = await ctx.table("clerkInfo").getX(user.clerkInfoId);
        return {
          ...normalizeApprovedUserRecord(user),
          clerkInfo: {
            _id: clerkInfo._id,
            clerkId: clerkInfo.clerkId,
            email: clerkInfo.email,
            firstName: clerkInfo.firstName,
            lastName: clerkInfo.lastName,
            username: clerkInfo.username,
            imageUrl: clerkInfo.imageUrl,
          },
        };
      })
    );

    return { page, isDone: result.isDone, continueCursor: result.continueCursor };
  },
});

/**
 * List users for assignment (minimal info)
 */
export const listUsersForAssignment = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: v.object({
    page: v.array(
      v.object({
        _id: v.id("users"),
        firstName: v.union(v.string(), v.null()),
        lastName: v.union(v.string(), v.null()),
        email: v.union(v.string(), v.null()),
        imageUrl: v.union(v.string(), v.null()),
      })
    ),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, args) => {
    await ctx.runQuery(internal.auth.helpers.requireAuth, {});

    const result = await ctx.table("users").order("desc").paginate(args.paginationOpts);

    const page = await Promise.all(
      result.page.map(async (user) => {
        const clerkInfo = await ctx.table("clerkInfo").get(user.clerkInfoId);
        return {
          _id: user._id,
          firstName: clerkInfo?.firstName ?? null,
          lastName: clerkInfo?.lastName ?? null,
          email: clerkInfo?.email ?? null,
          imageUrl: clerkInfo?.imageUrl ?? null,
        };
      })
    );

    return { page, isDone: result.isDone, continueCursor: result.continueCursor };
  },
});

/**
 * Update user roles - admin/owner only
 */
export const updateUserRoles = mutation({
  args: {
    userId: v.id("users"),
    roles: v.array(editableRoleValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.runQuery(internal.auth.helpers.requirePermission, {
      permission: "users.manage_roles",
    });

    const user = await ctx.table("users").get(args.userId);
    if (!user) throw new Error("User not found");
    const normalizedUser = normalizeApprovedUserRecord(user);
    if (normalizedUser.isOwner) throw new Error("Cannot change owner roles");

    await user.patch({
      isOwner: false,
      roles: normalizeRequestedRoles(args.roles),
    });
    return null;
  },
});

/**
 * Remove user - owner only
 */
export const removeUser = mutation({
  args: {
    userId: v.id("users"),
    deleteFromClerk: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const auth = await ctx.runQuery(internal.auth.helpers.getCurrentUser, {});
    if (!auth) throw new Error("Not authenticated");
    const canRemoveUser = await ctx.runQuery(internal.auth.helpers.hasPermission, {
      userId: auth.userId,
      permission: "users.remove",
    });
    if (!canRemoveUser) throw new Error("Not authorized - users.remove required");

    const user = await ctx.table("users").get(args.userId);
    if (!user) throw new Error("User not found");
    const normalizedUser = normalizeApprovedUserRecord(user);
    if (normalizedUser.isOwner && user._id !== auth.userId) throw new Error("Cannot remove owner");

    const clerkInfo = await ctx.table("clerkInfo").get(user.clerkInfoId);
    
    // Delete user - cascade will handle invites
    await user.delete();

    if (args.deleteFromClerk && clerkInfo) {
      await clerkInfo.delete();
      await ctx.scheduler.runAfter(0, internal.auth.clerk.deleteClerkUser, {
        clerkId: clerkInfo.clerkId,
      });
    }

    return null;
  },
});

/**
 * Delete user by clerkId - internal, called by webhook
 */
export const deleteUserByClerkId = internalMutation({
  args: { clerkId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const clerkInfo = await ctx.table("clerkInfo").get("by_clerkId", args.clerkId);
    if (!clerkInfo) return null;

    const user = await ctx.table("users").get("clerkInfoId", clerkInfo._id);
    if (user && normalizeApprovedUserRecord(user).isOwner) {
      throw new Error("Cannot delete owner");
    }

    // Delete clerkInfo - cascade will handle users, waitlist, and invites
    await clerkInfo.delete();
    return null;
  },
});
