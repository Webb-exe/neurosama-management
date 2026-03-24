import { internalQuery } from "../functions";
import { v } from "convex/values";
import { PERMISSIONS, normalizePermissionUser, userHasPermission } from "../../lib/permissions";
import {
  authUserValidator,
  permissionKeyValidator,
} from "./validators";

// ============================================================================
// AUTH HELPER QUERIES
// ============================================================================

async function lookupAuthUser(
  ctx: Parameters<typeof getCurrentUser["handler"]>[0],
) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  const clerkInfo = await ctx.table("clerkInfo").get("by_clerkId", identity.subject);
  if (!clerkInfo) {
    return null;
  }

  const user = await ctx.table("users").get("clerkInfoId", clerkInfo._id);
  if (!user) {
    return null;
  }

  const normalizedUser = normalizePermissionUser(user);
  if (!normalizedUser) {
    return null;
  }

  return {
    clerkInfoId: clerkInfo._id,
    userId: user._id,
    isOwner: normalizedUser.isOwner,
    roles: normalizedUser.roles,
  };
}

/**
 * Get current user's authentication info
 * Returns null if not authenticated or not approved.
 */
export const getCurrentUser = internalQuery({
  args: {},
  returns: v.union(authUserValidator, v.null()),
  handler: async (ctx) => {
    return await lookupAuthUser(ctx);
  },
});

/**
 * Helper function that checks whether a stored user has a permission.
 * This is intended for internal use after the caller has resolved which user to inspect.
 */
export const hasPermission = internalQuery({
  args: {
    userId: v.id("users"),
    permission: permissionKeyValidator,
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const user = await ctx.table("users").get(args.userId);
    return userHasPermission(user, args.permission);
  },
});

/**
 * Get current user or throw if not authenticated.
 */
export const requireAuth = internalQuery({
  args: {},
  returns: authUserValidator,
  handler: async (ctx) => {
    const authUser = await lookupAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }
    return authUser;
  },
});

/**
 * Get current user or throw if they do not have the requested permission.
 */
export const requirePermission = internalQuery({
  args: {
    permission: permissionKeyValidator,
  },
  returns: authUserValidator,
  handler: async (ctx, args) => {
    const authUser = await lookupAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    if (!userHasPermission(authUser, args.permission)) {
      throw new Error(`Not authorized - ${args.permission} required`);
    }

    return authUser;
  },
});

/**
 * Get current user or throw if not admin-capable.
 */
export const requireAdmin = internalQuery({
  args: {},
  returns: authUserValidator,
  handler: async (ctx) => {
    const authUser = await lookupAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    if (!userHasPermission(authUser, PERMISSIONS.adminAccess.key)) {
      throw new Error("Not authorized - admin access required");
    }

    return authUser;
  },
});

/**
 * Get current user or throw if not owner.
 */
export const requireOwner = internalQuery({
  args: {},
  returns: authUserValidator,
  handler: async (ctx) => {
    const authUser = await lookupAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    if (!authUser.isOwner) {
      throw new Error("Not authorized - owner required");
    }

    return authUser;
  },
});
