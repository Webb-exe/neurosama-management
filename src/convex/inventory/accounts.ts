import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { PERMISSIONS } from "../../lib/permissions";
import {
  accountTypeValidator,
  assertPositiveCents,
  calculateAccountBalanceCents,
  optionalStringValidator,
  requireInventoryPermission,
  trimRequired,
} from "./lib";

const fundingRowShape = v.object({
  _id: v.id("financeAccountFundingRows"),
  _creationTime: v.number(),
  accountId: v.id("financeAccounts"),
  source: v.string(),
  amountCents: v.number(),
  fundedAt: v.number(),
  notes: v.string(),
  createdBy: v.id("users"),
  createdAt: v.number(),
});

const accountShape = v.object({
  _id: v.id("financeAccounts"),
  _creationTime: v.number(),
  name: v.string(),
  type: accountTypeValidator,
  linkedUserId: v.optional(v.id("users")),
  linkedUserName: optionalStringValidator,
  description: v.string(),
  active: v.boolean(),
  balanceCents: v.number(),
  createdBy: v.id("users"),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const listAccounts = query({
  args: {
    includeInactive: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  returns: v.array(accountShape),
  handler: async (ctx, args) => {
    await requireInventoryPermission(ctx, PERMISSIONS.financeAccountsView.key);

    const limit = Math.min(args.limit ?? 100, 200);
    const accounts = args.includeInactive
      ? await ctx.db.query("financeAccounts").withIndex("by_type").take(limit)
      : await ctx.db
          .query("financeAccounts")
          .withIndex("by_active", (accountQuery) =>
            accountQuery.eq("active", true),
          )
          .take(limit);

    return await Promise.all(
      accounts.map(async (account) => {
        const linkedUser = account.linkedUserId
          ? await ctx.db.get(account.linkedUserId)
          : null;
        const clerkInfo = linkedUser
          ? await ctx.db.get(linkedUser.clerkInfoId)
          : null;
        const linkedUserName = clerkInfo
          ? [clerkInfo.firstName, clerkInfo.lastName].filter(Boolean).join(" ") ||
            clerkInfo.email ||
            undefined
          : undefined;

        return {
          ...account,
          linkedUserName,
          balanceCents: await calculateAccountBalanceCents(ctx, account._id),
        };
      }),
    );
  },
});

export const createAccount = mutation({
  args: {
    name: v.string(),
    type: accountTypeValidator,
    linkedUserId: v.optional(v.id("users")),
    description: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  returns: v.id("financeAccounts"),
  handler: async (ctx, args) => {
    const user = await requireInventoryPermission(
      ctx,
      PERMISSIONS.financeAccountsManage.key,
    );

    if (args.linkedUserId) {
      const linkedUser = await ctx.db.get(args.linkedUserId);
      if (!linkedUser) {
        throw new Error("Linked user not found");
      }
    }

    const now = Date.now();
    return await ctx.db.insert("financeAccounts", {
      name: trimRequired(args.name, "Account name"),
      type: args.type,
      linkedUserId: args.linkedUserId,
      description: args.description?.trim() ?? "",
      active: args.active ?? true,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateAccount = mutation({
  args: {
    accountId: v.id("financeAccounts"),
    name: v.optional(v.string()),
    type: v.optional(accountTypeValidator),
    linkedUserId: v.optional(v.id("users")),
    clearLinkedUser: v.optional(v.boolean()),
    description: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireInventoryPermission(ctx, PERMISSIONS.financeAccountsManage.key);

    const account = await ctx.db.get(args.accountId);
    if (!account) {
      throw new Error("Account not found");
    }
    if (args.linkedUserId) {
      const linkedUser = await ctx.db.get(args.linkedUserId);
      if (!linkedUser) {
        throw new Error("Linked user not found");
      }
    }

    await ctx.db.patch(args.accountId, {
      ...(args.name !== undefined
        ? { name: trimRequired(args.name, "Account name") }
        : {}),
      ...(args.type !== undefined ? { type: args.type } : {}),
      ...(args.clearLinkedUser
        ? { linkedUserId: undefined }
        : args.linkedUserId !== undefined
          ? { linkedUserId: args.linkedUserId }
          : {}),
      ...(args.description !== undefined
        ? { description: args.description.trim() }
        : {}),
      ...(args.active !== undefined ? { active: args.active } : {}),
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const addFundingRow = mutation({
  args: {
    accountId: v.id("financeAccounts"),
    source: v.string(),
    amountCents: v.number(),
    fundedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  returns: v.id("financeAccountFundingRows"),
  handler: async (ctx, args) => {
    const user = await requireInventoryPermission(
      ctx,
      PERMISSIONS.financeAccountsFundingManage.key,
    );
    const account = await ctx.db.get(args.accountId);
    if (!account) {
      throw new Error("Account not found");
    }
    assertPositiveCents(args.amountCents, "Funding amount");

    const now = Date.now();
    return await ctx.db.insert("financeAccountFundingRows", {
      accountId: args.accountId,
      source: trimRequired(args.source, "Funding source"),
      amountCents: args.amountCents,
      fundedAt: args.fundedAt ?? now,
      notes: args.notes?.trim() ?? "",
      createdBy: user._id,
      createdAt: now,
    });
  },
});

export const listFundingRows = query({
  args: {
    accountId: v.id("financeAccounts"),
    limit: v.optional(v.number()),
  },
  returns: v.array(fundingRowShape),
  handler: async (ctx, args) => {
    await requireInventoryPermission(ctx, PERMISSIONS.financeAccountsView.key);

    const account = await ctx.db.get(args.accountId);
    if (!account) {
      throw new Error("Account not found");
    }

    return await ctx.db
      .query("financeAccountFundingRows")
      .withIndex("by_accountId_and_fundedAt", (fundingQuery) =>
        fundingQuery.eq("accountId", args.accountId),
      )
      .order("desc")
      .take(Math.min(args.limit ?? 100, 200));
  },
});

export const getAccountBalance = query({
  args: {
    accountId: v.id("financeAccounts"),
  },
  returns: v.object({
    accountId: v.id("financeAccounts"),
    balanceCents: v.number(),
  }),
  handler: async (ctx, args) => {
    await requireInventoryPermission(ctx, PERMISSIONS.financeAccountsView.key);

    const account = await ctx.db.get(args.accountId);
    if (!account) {
      throw new Error("Account not found");
    }

    return {
      accountId: args.accountId,
      balanceCents: await calculateAccountBalanceCents(ctx, args.accountId),
    };
  },
});

