import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import {
  PERMISSIONS,
  normalizePermissionUser,
  userHasPermission,
  type PermissionKey,
} from "../../lib/permissions";

export const accountTypeValidator = v.union(
  v.literal("team"),
  v.literal("grant"),
  v.literal("member"),
  v.literal("sponsor"),
  v.literal("other"),
);

export const invoiceStatusValidator = v.union(
  v.literal("draft"),
  v.literal("submitted"),
  v.literal("approved"),
  v.literal("rejected"),
  v.literal("void"),
);

export const itemApprovalStatusValidator = v.union(
  v.literal("draft"),
  v.literal("approved"),
  v.literal("rejected"),
);

export const reimbursementStatusValidator = v.union(
  v.literal("not_required"),
  v.literal("pending"),
  v.literal("partial"),
  v.literal("reimbursed"),
);

export const optionalStringValidator = v.optional(v.string());

type Ctx = QueryCtx | MutationCtx;

export type InventoryUser = {
  _id: Id<"users">;
  clerkInfoId: Id<"clerkInfo">;
  isOwner: boolean;
  roles: string[];
};

export async function getCurrentUser(ctx: Ctx): Promise<InventoryUser | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  const clerkInfo = await ctx.db
    .query("clerkInfo")
    .withIndex("by_clerkId", (query) => query.eq("clerkId", identity.subject))
    .first();
  if (!clerkInfo) {
    return null;
  }

  const user = await ctx.db
    .query("users")
    .withIndex("clerkInfoId", (query) => query.eq("clerkInfoId", clerkInfo._id))
    .first();
  if (!user) {
    return null;
  }

  const normalized = normalizePermissionUser(user);
  if (!normalized) {
    return null;
  }

  return {
    _id: user._id,
    clerkInfoId: user.clerkInfoId,
    isOwner: normalized.isOwner,
    roles: normalized.roles,
  };
}

export async function requireApprovedUser(ctx: Ctx) {
  const user = await getCurrentUser(ctx);
  if (!user) {
    throw new Error("Not authenticated");
  }
  return user;
}

export async function requireInventoryPermission(
  ctx: Ctx,
  permission: PermissionKey,
) {
  const user = await requireApprovedUser(ctx);
  if (!userHasPermission(user, permission)) {
    throw new Error(`Not authorized - ${permission} required`);
  }
  return user;
}

export function requireUserPermission(
  user: InventoryUser,
  permission: PermissionKey,
) {
  if (!userHasPermission(user, permission)) {
    throw new Error(`Not authorized - ${permission} required`);
  }
}

export function canUsePermission(
  user: InventoryUser,
  permission: PermissionKey,
) {
  return userHasPermission(user, permission);
}

export function trimOptional(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function trimRequired(value: string, fieldName: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${fieldName} is required`);
  }
  return trimmed;
}

export function assertNonNegativeInteger(value: number, fieldName: string) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${fieldName} must be a non-negative integer`);
  }
}

export function assertInteger(value: number, fieldName: string) {
  if (!Number.isInteger(value)) {
    throw new Error(`${fieldName} must be an integer`);
  }
}

export function assertPositiveInteger(value: number, fieldName: string) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${fieldName} must be a positive integer`);
  }
}

export function assertNonNegativeCents(value: number, fieldName: string) {
  assertNonNegativeInteger(value, fieldName);
}

export function assertPositiveCents(value: number, fieldName: string) {
  assertPositiveInteger(value, fieldName);
}

export function calculateLineTotalCents(args: {
  quantity: number;
  unitCostCents: number;
}) {
  const totalCents = args.quantity * args.unitCostCents;
  if (totalCents < 0) {
    throw new Error("Line total cannot be negative");
  }
  return totalCents;
}

export async function sumBoxedQuantity(
  ctx: Ctx,
  itemId: Id<"inventoryItems">,
) {
  let boxedQuantity = 0;
  const boxItems = ctx.db
    .query("inventoryBoxItems")
    .withIndex("by_itemId", (query) => query.eq("itemId", itemId));

  for await (const boxItem of boxItems) {
    boxedQuantity += boxItem.quantity;
  }

  return boxedQuantity;
}

export async function getItemQuantities(
  ctx: Ctx,
  item: Doc<"inventoryItems">,
) {
  const boxedQuantity = await sumBoxedQuantity(ctx, item._id);
  const usedByMemberQuantity = item.usedByMemberQuantity ?? 0;
  const unsortedQuantity =
    item.totalQuantity -
    boxedQuantity -
    item.usedOnRobotQuantity -
    usedByMemberQuantity;
  return {
    unsortedQuantity,
    boxedQuantity,
    usedOnRobotQuantity: item.usedOnRobotQuantity,
    usedByMemberQuantity,
    totalQuantity: item.totalQuantity,
  };
}

export function getItemApprovalStatus(item: Doc<"inventoryItems">) {
  return item.approvalStatus ?? "approved";
}

export function assertItemUsable(item: Doc<"inventoryItems">) {
  const status = getItemApprovalStatus(item);
  if (status !== "approved") {
    throw new Error("Only approved inventory items can be used");
  }
}

export async function adjustItemTotalQuantity(
  ctx: MutationCtx,
  itemId: Id<"inventoryItems">,
  deltaQuantity: number,
) {
  assertInteger(deltaQuantity, "Quantity adjustment");

  const item = await ctx.db.get(itemId);
  if (!item) {
    throw new Error("Inventory item not found");
  }
  assertItemUsable(item);

  const totalQuantity = item.totalQuantity + deltaQuantity;
  await ctx.db.patch(itemId, {
    totalQuantity,
    updatedAt: Date.now(),
  });

  return {
    ...item,
    totalQuantity,
  };
}

export async function getInvoiceLineTotals(
  ctx: Ctx,
  invoiceId: Id<"invoices">,
) {
  const invoice = await ctx.db.get(invoiceId);
  if (!invoice) {
    throw new Error("Invoice not found");
  }

  let subtotalCents = 0;

  const lineItems = ctx.db
    .query("invoiceLineItems")
    .withIndex("by_invoiceId", (query) => query.eq("invoiceId", invoiceId));

  for await (const lineItem of lineItems) {
    subtotalCents += lineItem.quantity * lineItem.unitCostCents;
  }

  const totalCents =
    subtotalCents + invoice.taxCents + invoice.shippingCents - invoice.discountCents;

  return {
    subtotalCents,
    taxCents: invoice.taxCents,
    shippingCents: invoice.shippingCents,
    discountCents: invoice.discountCents,
    totalCents,
  };
}

export async function patchInvoiceTotals(
  ctx: MutationCtx,
  invoiceId: Id<"invoices">,
) {
  const totals = await getInvoiceLineTotals(ctx, invoiceId);
  await ctx.db.patch(invoiceId, {
    ...totals,
    updatedAt: Date.now(),
  });
  return totals;
}

export async function sumInvoiceSplits(
  ctx: Ctx,
  invoiceId: Id<"invoices">,
) {
  let totalCents = 0;
  const splits = ctx.db
    .query("invoiceAccountSplits")
    .withIndex("by_invoiceId", (query) => query.eq("invoiceId", invoiceId));

  for await (const split of splits) {
    totalCents += split.amountCents;
  }

  return totalCents;
}

export async function sumInvoiceReimbursements(
  ctx: Ctx,
  invoiceId: Id<"invoices">,
) {
  let totalCents = 0;
  const reimbursements = ctx.db
    .query("invoiceReimbursements")
    .withIndex("by_invoiceId", (query) => query.eq("invoiceId", invoiceId));

  for await (const reimbursement of reimbursements) {
    totalCents += reimbursement.amountCents;
  }

  return totalCents;
}

export async function sumInvoiceReimbursableAmount(
  ctx: Ctx,
  invoiceId: Id<"invoices">,
) {
  let totalCents = 0;
  const splits = ctx.db
    .query("invoiceAccountSplits")
    .withIndex("by_invoiceId", (query) => query.eq("invoiceId", invoiceId));

  for await (const split of splits) {
    const account = await ctx.db.get(split.accountId);
    if (account && (account.type === "member" || account.linkedUserId)) {
      totalCents += split.amountCents;
    }
  }

  return totalCents;
}

export async function patchInvoiceReimbursementStatus(
  ctx: MutationCtx,
  invoiceId: Id<"invoices">,
) {
  const reimbursableCents = await sumInvoiceReimbursableAmount(ctx, invoiceId);
  const reimbursedCents = await sumInvoiceReimbursements(ctx, invoiceId);
  const reimbursementStatus =
    reimbursableCents === 0
      ? "not_required"
      : reimbursedCents === 0
        ? "pending"
        : reimbursedCents < reimbursableCents
          ? "partial"
          : "reimbursed";

  await ctx.db.patch(invoiceId, {
    reimbursementStatus,
    updatedAt: Date.now(),
  });

  return {
    reimbursementStatus,
    reimbursableCents,
    reimbursedCents,
  };
}

export async function calculateAccountBalanceCents(
  ctx: Ctx,
  accountId: Id<"financeAccounts">,
) {
  let balanceCents = 0;

  const fundingRows = ctx.db
    .query("financeAccountFundingRows")
    .withIndex("by_accountId", (query) => query.eq("accountId", accountId));
  for await (const fundingRow of fundingRows) {
    balanceCents += fundingRow.amountCents;
  }

  const splits = ctx.db
    .query("invoiceAccountSplits")
    .withIndex("by_accountId", (query) => query.eq("accountId", accountId));
  for await (const split of splits) {
    balanceCents -= split.amountCents;
  }

  const sourceReimbursements = ctx.db
    .query("invoiceReimbursements")
    .withIndex("by_sourceAccountId", (query) => query.eq("sourceAccountId", accountId));
  for await (const reimbursement of sourceReimbursements) {
    balanceCents -= reimbursement.amountCents;
  }

  const receivedReimbursements = ctx.db
    .query("invoiceReimbursements")
    .withIndex("by_reimbursedToAccountId", (query) =>
      query.eq("reimbursedToAccountId", accountId),
    );
  for await (const reimbursement of receivedReimbursements) {
    balanceCents += reimbursement.amountCents;
  }

  return balanceCents;
}

export async function assertInvoiceSupplierMatchesItem(
  ctx: Ctx,
  invoice: Doc<"invoices">,
  itemId: Id<"inventoryItems">,
) {
  const item = await ctx.db.get(itemId);
  if (!item) {
    throw new Error("Inventory item not found");
  }
  if (item.supplierId !== invoice.supplierId) {
    throw new Error("Invoice items must come from the invoice supplier");
  }
  return item;
}

export async function requireInvoiceAccess(
  ctx: Ctx,
  invoice: Doc<"invoices">,
  access: "view" | "editOwnDraft" | "submitOwn",
) {
  const user = await requireApprovedUser(ctx);
  if (access === "editOwnDraft" && invoice.status !== "draft") {
    throw new Error("Only draft invoices can be edited");
  }

  if (canUsePermission(user, PERMISSIONS.financeInvoicesViewAll.key)) {
    return user;
  }

  const ownsInvoice = invoice.purchasedByUserId === user._id;
  if (!ownsInvoice) {
    throw new Error("Not authorized for this invoice");
  }

  if (access === "view") {
    requireUserPermission(user, PERMISSIONS.financeInvoicesViewOwn.key);
  } else if (access === "editOwnDraft") {
    requireUserPermission(user, PERMISSIONS.financeInvoicesEditOwnDraft.key);
  } else {
    requireUserPermission(user, PERMISSIONS.financeInvoicesSubmitOwn.key);
  }

  return user;
}

