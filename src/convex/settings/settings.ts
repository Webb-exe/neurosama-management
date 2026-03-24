import { internalQuery, query, mutation, QueryCtx, MutationCtx } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";
import { internal } from "../_generated/api";
import { PERMISSIONS, normalizePermissionUser, userHasPermission } from "../../lib/permissions";

async function getCurrentAuthUser(ctx: QueryCtx | MutationCtx) {
  return await ctx.runQuery(internal.auth.helpers.getCurrentUser, {});
}

async function requirePermission(
  ctx: QueryCtx | MutationCtx,
  permission: typeof PERMISSIONS.settingsManage.key | typeof PERMISSIONS.adminAccess.key,
) {
  const authUser = await getCurrentAuthUser(ctx);
  if (!authUser) {
    throw new Error("Not authenticated");
  }
  if (!userHasPermission(authUser, permission)) {
    throw new Error(`Not authorized - ${permission} required`);
  }
  return authUser;
}

async function requireOwner(ctx: QueryCtx | MutationCtx) {
  const authUser = await getCurrentAuthUser(ctx);
  if (!authUser) {
    throw new Error("Not authenticated");
  }
  if (!authUser.isOwner) {
    throw new Error("Only the team owner can initialize FTC team settings.");
  }
  return authUser;
}

/**
 * Get or create settings document
 */
async function getOrCreateSettings(ctx: MutationCtx) {
  const existing = await ctx.db.query("settings").first();
  if (existing) {
    return existing;
  }
  // Create default settings
  const id = await ctx.db.insert("settings", {
    waitlistEnabled: true,
  });
  return (await ctx.db.get(id))!;
}

/**
 * Get all settings
 */
export const getSettings = query({
  args: {},
  returns: v.object({
    waitlistEnabled: v.boolean(),
  }),
  handler: async (ctx) => {
    const settings = await ctx.db.query("settings").first();
    // Return defaults if no settings exist
    return {
      waitlistEnabled: settings?.waitlistEnabled ?? true,
    };
  },
});

/**
 * Get all settings - for admin dashboard (with auth check)
 */
export const getAllSettings = query({
  args: {},
  returns: v.object({
    waitlistEnabled: v.boolean(),
  }),
  handler: async (ctx) => {
    await requirePermission(ctx, PERMISSIONS.adminAccess.key);

    const settings = await ctx.db.query("settings").first();
    return {
      waitlistEnabled: settings?.waitlistEnabled ?? true,
    };
  },
});

/**
 * Set waitlist enabled setting - owner/admin only
 */
export const setWaitlistEnabled = mutation({
  args: {
    enabled: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requirePermission(ctx, PERMISSIONS.settingsManage.key);

    const settings = await getOrCreateSettings(ctx);
    await ctx.db.patch(settings._id, { waitlistEnabled: args.enabled });

    return null;
  },
});

// ========================================
// FTC Scout Settings
// ========================================

/**
 * Get FTC Scout settings (team number and season)
 */
export const getFtcSettings = query({
  args: {},
  returns: v.object({
    ftcTeamNumber: v.union(v.number(), v.null()),
  }),
  handler: async (ctx) => {
    const settings = await ctx.db.query("settings").first();
    return {
      ftcTeamNumber: settings?.ftcTeamNumber ?? null,
    };
  },
});

export const getFtcSettingsInternal = internalQuery({
  args: {},
  returns: v.object({
    ftcTeamNumber: v.union(v.number(), v.null()),
  }),
  handler: async (ctx) => {
    const settings = await ctx.db.query("settings").first();
    return {
      ftcTeamNumber: settings?.ftcTeamNumber ?? null,
    };
  },
});

/**
 * Check if FTC setup is required (for prompting owner)
 * Returns setup status and whether current user can configure it
 */
export const getFtcSetupStatus = query({
  args: {},
  returns: v.object({
    isConfigured: v.boolean(),
    ftcTeamNumber: v.union(v.number(), v.null()),
    requiresSetup: v.boolean(),
    canConfigure: v.boolean(),
    isOwner: v.boolean(),
  }),
  handler: async (ctx) => {
    const settings = await ctx.db.query("settings").first();
    const ftcTeamNumber = settings?.ftcTeamNumber ?? null;
    const isConfigured = ftcTeamNumber !== null;

    const authUser = await getCurrentAuthUser(ctx);
    let canConfigure = false;
    let isOwner = false;

    if (authUser) {
      isOwner = authUser.isOwner;
      canConfigure = userHasPermission(authUser, PERMISSIONS.settingsManage.key);
    }

    return {
      isConfigured,
      ftcTeamNumber,
      requiresSetup: !isConfigured && canConfigure,
      canConfigure,
      isOwner,
    };
  },
});

/**
 * Set FTC team number - owner/admin only
 */
export const setFtcTeamNumber = mutation({
  args: {
    teamNumber: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requirePermission(ctx, PERMISSIONS.settingsManage.key);

    const settings = await getOrCreateSettings(ctx);
    await ctx.db.patch(settings._id, { ftcTeamNumber: args.teamNumber });
    await ctx.scheduler.runAfter(
      0,
      internal.integrations.ftcCalendarSync.syncConfiguredTeamCalendar,
      {},
    );

    return null;
  },
});


/**
 * Set both FTC team number and season at once - owner/admin only
 */
export const setFtcTeamSettings = mutation({
  args: {
    teamNumber: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requirePermission(ctx, PERMISSIONS.settingsManage.key);

    const settings = await getOrCreateSettings(ctx);
    const updates: { ftcTeamNumber?: number } = {};

    if (args.teamNumber !== undefined) {
      updates.ftcTeamNumber = args.teamNumber;
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(settings._id, updates);
      await ctx.scheduler.runAfter(
        0,
        internal.integrations.ftcCalendarSync.syncConfiguredTeamCalendar,
        {},
      );
    }

    return null;
  },
});

export const requestFtcCalendarSync = mutation({
  args: {},
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx) => {
    const authUser = await getCurrentAuthUser(ctx);
    if (!authUser) {
      return {
        success: false,
        message: "Not authenticated. Please sign in.",
      };
    }

    if (!userHasPermission(authUser, PERMISSIONS.settingsManage.key)) {
      return {
        success: false,
        message: "Not authorized - settings.manage required.",
      };
    }

    const settings = await ctx.db.query("settings").first();
    if (!settings?.ftcTeamNumber) {
      return {
        success: false,
        message: "Configure an FTC team number before syncing the calendar.",
      };
    }

    await ctx.scheduler.runAfter(
      0,
      internal.integrations.ftcCalendarSync.syncConfiguredTeamCalendar,
      {},
    );

    return {
      success: true,
      message: `Queued a calendar sync for FTC team ${settings.ftcTeamNumber}.`,
    };
  },
});

/**
 * Initialize FTC team settings - Owner only, for first-time setup
 * This is called when the owner is prompted to configure the team
 */
export const initializeFtcTeam = mutation({
  args: {
    teamNumber: v.number(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      await requireOwner(ctx);
    } catch {
      return {
        success: false,
        message: "Only the team owner can initialize FTC team settings.",
      };
    }

    // Get or create settings
    const settings = await getOrCreateSettings(ctx);

    // Update settings with team number and season
    await ctx.db.patch(settings._id, {
      ftcTeamNumber: args.teamNumber,
    });
    await ctx.scheduler.runAfter(
      0,
      internal.integrations.ftcCalendarSync.syncConfiguredTeamCalendar,
      {},
    );

    return {
      success: true,
      message: `Successfully configured FTC team ${args.teamNumber}.`,
    };
  },
});

/**
 * Check if this is the first user (for owner initialization)
 * If no users exist, the first authenticated user becomes the owner
 */
export const checkFirstUserSetup = query({
  args: {},
  returns: v.object({
    isFirstUser: v.boolean(),
    hasOwner: v.boolean(),
    ftcConfigured: v.boolean(),
  }),
  handler: async (ctx) => {
    // Check if any users exist
    const users = await ctx.db.query("users").take(1);
    const hasOwner = users.length > 0;

    // Check if FTC is configured
    const settings = await ctx.db.query("settings").first();
    const ftcConfigured = settings?.ftcTeamNumber !== undefined && settings.ftcTeamNumber !== null;

    return {
      isFirstUser: !hasOwner,
      hasOwner,
      ftcConfigured,
    };
  },
});
