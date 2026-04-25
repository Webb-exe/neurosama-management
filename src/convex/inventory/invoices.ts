import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import { PERMISSIONS } from "../../lib/permissions";
import {
  adjustItemTotalQuantity,
  assertInvoiceSupplierMatchesItem,
  assertNonNegativeCents,
  assertPositiveCents,
  assertPositiveInteger,
  calculateLineTotalCents,
  getItemApprovalStatus,
  getInvoiceLineTotals,
  invoiceStatusValidator,
  optionalStringValidator,
  patchInvoiceReimbursementStatus,
  patchInvoiceTotals,
  reimbursementStatusValidator,
  requireApprovedUser,
  requireInventoryPermission,
  requireInvoiceAccess,
  requireUserPermission,
  sumInvoiceReimbursableAmount,
  sumInvoiceReimbursements,
  sumInvoiceSplits,
  trimOptional,
  trimRequired,
} from "./lib";

type Ctx = QueryCtx | MutationCtx;

const invoiceSummaryShape = v.object({
  _id: v.id("invoices"),
  _creationTime: v.number(),
  supplierId: v.id("inventorySuppliers"),
  supplierName: v.string(),
  purchasedByUserId: v.id("users"),
  purchasedByName: v.string(),
  createdByUserId: v.id("users"),
  invoiceDate: v.number(),
  status: invoiceStatusValidator,
  reimbursementStatus: reimbursementStatusValidator,
  subtotalCents: v.number(),
  taxCents: v.number(),
  shippingCents: v.number(),
  discountCents: v.number(),
  totalCents: v.number(),
  notes: v.string(),
  submittedAt: v.optional(v.number()),
  approvedByUserId: v.optional(v.id("users")),
  approvedAt: v.optional(v.number()),
  rejectedByUserId: v.optional(v.id("users")),
  rejectedAt: v.optional(v.number()),
  rejectionReason: optionalStringValidator,
  voidedByUserId: v.optional(v.id("users")),
  voidedAt: v.optional(v.number()),
  inventoryReceivedByUserId: v.optional(v.id("users")),
  inventoryReceivedAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

const invoiceLineShape = v.object({
  _id: v.id("invoiceLineItems"),
  _creationTime: v.number(),
  invoiceId: v.id("invoices"),
  itemId: v.id("inventoryItems"),
  itemNameSnapshot: v.string(),
  itemSkuSnapshot: optionalStringValidator,
  itemPartNumberSnapshot: optionalStringValidator,
  description: v.string(),
  quantity: v.number(),
  unit: v.string(),
  unitCostCents: v.number(),
  taxCents: v.number(),
  shippingCents: v.number(),
  discountCents: v.number(),
  lineTotalCents: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
});

const splitShape = v.object({
  _id: v.id("invoiceAccountSplits"),
  _creationTime: v.number(),
  invoiceId: v.id("invoices"),
  accountId: v.id("financeAccounts"),
  accountName: v.string(),
  amountCents: v.number(),
  notes: v.string(),
  createdBy: v.id("users"),
  createdAt: v.number(),
  updatedAt: v.number(),
});

const reimbursementShape = v.object({
  _id: v.id("invoiceReimbursements"),
  _creationTime: v.number(),
  invoiceId: v.id("invoices"),
  reimbursedToUserId: v.id("users"),
  reimbursedToAccountId: v.optional(v.id("financeAccounts")),
  sourceAccountId: v.id("financeAccounts"),
  amountCents: v.number(),
  reimbursedAt: v.number(),
  notes: v.string(),
  createdByUserId: v.id("users"),
  createdAt: v.number(),
});

export const createInvoice = mutation({
  args: {
    supplierId: v.id("inventorySuppliers"),
    purchasedByUserId: v.optional(v.id("users")),
    invoiceDate: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  returns: v.id("invoices"),
  handler: async (ctx, args) => {
    const user = await requireApprovedUser(ctx);
    requireUserPermission(user, PERMISSIONS.financeInvoicesCreateOwn.key);

    const supplier = await ctx.db.get(args.supplierId);
    if (!supplier) {
      throw new Error("Supplier not found");
    }

    const purchasedByUserId = args.purchasedByUserId ?? user._id;
    if (purchasedByUserId !== user._id) {
      requireUserPermission(user, PERMISSIONS.financeInvoicesAssignPurchaser.key);
      const purchaser = await ctx.db.get(purchasedByUserId);
      if (!purchaser) {
        throw new Error("Purchaser not found");
      }
    }

    const now = Date.now();
    return await ctx.db.insert("invoices", {
      supplierId: args.supplierId,
      purchasedByUserId,
      createdByUserId: user._id,
      invoiceDate: args.invoiceDate ?? now,
      status: "draft",
      reimbursementStatus: "not_required",
      subtotalCents: 0,
      taxCents: 0,
      shippingCents: 0,
      discountCents: 0,
      totalCents: 0,
      notes: args.notes?.trim() ?? "",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const listInvoices = query({
  args: {
    scope: v.optional(v.union(v.literal("own"), v.literal("all"))),
    limit: v.optional(v.number()),
  },
  returns: v.array(invoiceSummaryShape),
  handler: async (ctx, args) => {
    const user = await requireApprovedUser(ctx);
    const wantsAll = args.scope === "all";
    const limit = Math.min(args.limit ?? 100, 200);

    let invoices: Doc<"invoices">[];
    if (wantsAll) {
      requireUserPermission(user, PERMISSIONS.financeInvoicesViewAll.key);
      invoices = await ctx.db
        .query("invoices")
        .withIndex("by_invoiceDate")
        .order("desc")
        .take(limit);
    } else {
      requireUserPermission(user, PERMISSIONS.financeInvoicesViewOwn.key);
      invoices = await ctx.db
        .query("invoices")
        .withIndex("by_purchasedByUserId_and_invoiceDate", (invoiceQuery) =>
          invoiceQuery.eq("purchasedByUserId", user._id),
        )
        .order("desc")
        .take(limit);
    }

    return await Promise.all(
      invoices.map((invoice) => toInvoiceSummary(ctx, invoice)),
    );
  },
});

export const getInvoice = query({
  args: {
    invoiceId: v.id("invoices"),
  },
  returns: v.object({
    invoice: invoiceSummaryShape,
    lineItems: v.array(invoiceLineShape),
    accountSplits: v.array(splitShape),
    reimbursements: v.array(reimbursementShape),
    reimbursableCents: v.number(),
    reimbursedCents: v.number(),
    splitTotalCents: v.number(),
  }),
  handler: async (ctx, args) => {
    const invoice = await getInvoiceOrThrow(ctx, args.invoiceId);
    await requireInvoiceAccess(ctx, invoice, "view");

    const lineItems = await ctx.db
      .query("invoiceLineItems")
      .withIndex("by_invoiceId", (lineQuery) =>
        lineQuery.eq("invoiceId", args.invoiceId),
      )
      .take(200);
    const splits = await ctx.db
      .query("invoiceAccountSplits")
      .withIndex("by_invoiceId", (splitQuery) =>
        splitQuery.eq("invoiceId", args.invoiceId),
      )
      .take(200);
    const reimbursements = await ctx.db
      .query("invoiceReimbursements")
      .withIndex("by_invoiceId", (reimbursementQuery) =>
        reimbursementQuery.eq("invoiceId", args.invoiceId),
      )
      .take(200);

    return {
      invoice: await toInvoiceSummary(ctx, invoice),
      lineItems: lineItems.map(toInvoiceLineSummary),
      accountSplits: await Promise.all(
        splits.map(async (split) => {
          const account = await ctx.db.get(split.accountId);
          return {
            ...split,
            accountName: account?.name ?? "Unknown account",
          };
        }),
      ),
      reimbursements,
      reimbursableCents: await sumInvoiceReimbursableAmount(ctx, args.invoiceId),
      reimbursedCents: await sumInvoiceReimbursements(ctx, args.invoiceId),
      splitTotalCents: await sumInvoiceSplits(ctx, args.invoiceId),
    };
  },
});

export const updateInvoiceDraft = mutation({
  args: {
    invoiceId: v.id("invoices"),
    supplierId: v.optional(v.id("inventorySuppliers")),
    purchasedByUserId: v.optional(v.id("users")),
    invoiceDate: v.optional(v.number()),
    taxCents: v.optional(v.number()),
    shippingCents: v.optional(v.number()),
    discountCents: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const invoice = await getInvoiceOrThrow(ctx, args.invoiceId);
    const user = await requireInvoiceAccess(ctx, invoice, "editOwnDraft");

    if (args.purchasedByUserId && args.purchasedByUserId !== invoice.purchasedByUserId) {
      requireUserPermission(user, PERMISSIONS.financeInvoicesAssignPurchaser.key);
      const purchaser = await ctx.db.get(args.purchasedByUserId);
      if (!purchaser) {
        throw new Error("Purchaser not found");
      }
    }

    if (args.supplierId && args.supplierId !== invoice.supplierId) {
      const supplier = await ctx.db.get(args.supplierId);
      if (!supplier) {
        throw new Error("Supplier not found");
      }
      const firstLine = await ctx.db
        .query("invoiceLineItems")
        .withIndex("by_invoiceId", (lineQuery) =>
          lineQuery.eq("invoiceId", args.invoiceId),
        )
        .first();
      if (firstLine) {
        throw new Error("Cannot change supplier after adding line items");
      }
    }

    const chargeUpdates: Partial<
      Pick<Doc<"invoices">, "taxCents" | "shippingCents" | "discountCents">
    > = {};
    if (args.taxCents !== undefined) {
      assertNonNegativeCents(args.taxCents, "Tax");
      chargeUpdates.taxCents = args.taxCents;
    }
    if (args.shippingCents !== undefined) {
      assertNonNegativeCents(args.shippingCents, "Shipping");
      chargeUpdates.shippingCents = args.shippingCents;
    }
    if (args.discountCents !== undefined) {
      assertNonNegativeCents(args.discountCents, "Discount");
      chargeUpdates.discountCents = args.discountCents;
    }
    const hasChargeUpdate = Object.keys(chargeUpdates).length > 0;

    await ctx.db.patch(args.invoiceId, {
      ...(args.supplierId !== undefined ? { supplierId: args.supplierId } : {}),
      ...(args.purchasedByUserId !== undefined
        ? { purchasedByUserId: args.purchasedByUserId }
        : {}),
      ...(args.invoiceDate !== undefined ? { invoiceDate: args.invoiceDate } : {}),
      ...chargeUpdates,
      ...(args.notes !== undefined ? { notes: args.notes.trim() } : {}),
      updatedAt: Date.now(),
    });

    if (hasChargeUpdate) {
      const totals = await patchInvoiceTotals(ctx, args.invoiceId);
      if (totals.totalCents < 0) {
        throw new Error("Invoice total cannot be negative");
      }
    }

    return null;
  },
});

export const upsertLineItem = mutation({
  args: {
    invoiceId: v.id("invoices"),
    lineItemId: v.optional(v.id("invoiceLineItems")),
    itemId: v.optional(v.id("inventoryItems")),
    newItem: v.optional(
      v.object({
        name: v.string(),
        description: v.optional(v.string()),
        sku: optionalStringValidator,
        partNumber: optionalStringValidator,
        defaultUnit: v.optional(v.string()),
        defaultUnitCostCents: v.optional(v.number()),
      }),
    ),
    description: v.optional(v.string()),
    quantity: v.number(),
    unit: v.optional(v.string()),
    unitCostCents: v.number(),
  },
  returns: v.id("invoiceLineItems"),
  handler: async (ctx, args) => {
    const invoice = await getInvoiceOrThrow(ctx, args.invoiceId);
    const user = await requireInvoiceAccess(ctx, invoice, "editOwnDraft");
    const item = await resolveLineItem(ctx, invoice, user._id, args);

    assertPositiveInteger(args.quantity, "Line quantity");
    assertNonNegativeCents(args.unitCostCents, "Unit cost");
    const lineTotalCents = calculateLineTotalCents({
      quantity: args.quantity,
      unitCostCents: args.unitCostCents,
    });
    const now = Date.now();
    const linePayload = {
      invoiceId: args.invoiceId,
      itemId: item._id,
      itemNameSnapshot: item.name,
      itemSkuSnapshot: item.sku,
      itemPartNumberSnapshot: item.partNumber,
      description: args.description?.trim() ?? "",
      quantity: args.quantity,
      unit: trimRequired(args.unit ?? item.defaultUnit, "Unit"),
      unitCostCents: args.unitCostCents,
      taxCents: 0,
      shippingCents: 0,
      discountCents: 0,
      lineTotalCents,
      updatedAt: now,
    };

    if (args.lineItemId) {
      const existingLine = await ctx.db.get(args.lineItemId);
      if (!existingLine || existingLine.invoiceId !== args.invoiceId) {
        throw new Error("Line item not found");
      }
      await ctx.db.patch(args.lineItemId, linePayload);
      if (existingLine.itemId !== item._id) {
        await deleteDraftItemIfUnused(ctx, existingLine.itemId, args.lineItemId);
      }
      await patchInvoiceTotals(ctx, args.invoiceId);
      return args.lineItemId;
    }

    const lineItemId = await ctx.db.insert("invoiceLineItems", {
      ...linePayload,
      createdAt: now,
    });
    await patchInvoiceTotals(ctx, args.invoiceId);
    return lineItemId;
  },
});

export const removeLineItem = mutation({
  args: {
    invoiceId: v.id("invoices"),
    lineItemId: v.id("invoiceLineItems"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const invoice = await getInvoiceOrThrow(ctx, args.invoiceId);
    await requireInvoiceAccess(ctx, invoice, "editOwnDraft");

    const lineItem = await ctx.db.get(args.lineItemId);
    if (!lineItem || lineItem.invoiceId !== args.invoiceId) {
      throw new Error("Line item not found");
    }

    await ctx.db.delete(args.lineItemId);
    await deleteDraftItemIfUnused(ctx, lineItem.itemId, args.lineItemId);
    await patchInvoiceTotals(ctx, args.invoiceId);
    return null;
  },
});

export const deleteInvoice = mutation({
  args: {
    invoiceId: v.id("invoices"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const invoice = await getInvoiceOrThrow(ctx, args.invoiceId);
    if (invoice.status !== "draft") {
      throw new Error("Only draft invoices can be deleted");
    }
    await requireInvoiceAccess(ctx, invoice, "editOwnDraft");

    const reimbursements = await ctx.db
      .query("invoiceReimbursements")
      .withIndex("by_invoiceId", (reimbursementQuery) =>
        reimbursementQuery.eq("invoiceId", args.invoiceId),
      )
      .take(1);
    if (reimbursements.length > 0) {
      throw new Error("Cannot delete invoices with reimbursement records");
    }

    const lineItems = await ctx.db
      .query("invoiceLineItems")
      .withIndex("by_invoiceId", (lineQuery) =>
        lineQuery.eq("invoiceId", args.invoiceId),
      )
      .take(200);
    for (const lineItem of lineItems) {
      await ctx.db.delete(lineItem._id);
      await deleteDraftItemIfUnused(ctx, lineItem.itemId, lineItem._id);
    }

    const splits = await ctx.db
      .query("invoiceAccountSplits")
      .withIndex("by_invoiceId", (splitQuery) =>
        splitQuery.eq("invoiceId", args.invoiceId),
      )
      .take(200);
    for (const split of splits) {
      await ctx.db.delete(split._id);
    }

    await ctx.db.delete(args.invoiceId);
    return null;
  },
});

export const submitInvoice = mutation({
  args: {
    invoiceId: v.id("invoices"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const invoice = await getInvoiceOrThrow(ctx, args.invoiceId);
    await requireInvoiceAccess(ctx, invoice, "submitOwn");
    if (invoice.status !== "draft") {
      throw new Error("Only draft invoices can be submitted");
    }

    const totals = await getInvoiceLineTotals(ctx, args.invoiceId);
    if (totals.totalCents <= 0) {
      throw new Error("Invoice must have at least one positive line item");
    }

    await ctx.db.patch(args.invoiceId, {
      ...totals,
      status: "submitted",
      submittedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const approveInvoice = mutation({
  args: {
    invoiceId: v.id("invoices"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireInventoryPermission(
      ctx,
      PERMISSIONS.financeInvoicesApprove.key,
    );
    const invoice = await getInvoiceOrThrow(ctx, args.invoiceId);
    if (invoice.status !== "submitted") {
      throw new Error("Only submitted invoices can be approved");
    }

    const totals = await getInvoiceLineTotals(ctx, args.invoiceId);
    const now = Date.now();
    await markInvoiceDraftItems(ctx, args.invoiceId, "approved", now);

    await ctx.db.patch(args.invoiceId, {
      ...totals,
      status: "approved",
      approvedByUserId: user._id,
      approvedAt: now,
      updatedAt: now,
    });
    await patchInvoiceReimbursementStatus(ctx, args.invoiceId);

    return null;
  },
});

export const rejectInvoice = mutation({
  args: {
    invoiceId: v.id("invoices"),
    reason: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireInventoryPermission(
      ctx,
      PERMISSIONS.financeInvoicesApprove.key,
    );
    const invoice = await getInvoiceOrThrow(ctx, args.invoiceId);
    if (invoice.status !== "submitted") {
      throw new Error("Only submitted invoices can be rejected");
    }

    const now = Date.now();
    await markInvoiceDraftItems(ctx, args.invoiceId, "rejected", now);

    await ctx.db.patch(args.invoiceId, {
      status: "rejected",
      rejectedByUserId: user._id,
      rejectedAt: now,
      rejectionReason: trimOptional(args.reason),
      updatedAt: now,
    });
    return null;
  },
});

export const voidInvoice = mutation({
  args: {
    invoiceId: v.id("invoices"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireInventoryPermission(
      ctx,
      PERMISSIONS.financeInvoicesApprove.key,
    );
    const invoice = await getInvoiceOrThrow(ctx, args.invoiceId);
    if (invoice.status === "void") {
      return null;
    }
    if (invoice.status !== "submitted" && invoice.status !== "approved") {
      throw new Error("Only submitted or approved invoices can be voided");
    }
    if (invoice.inventoryReceivedAt) {
      throw new Error("Cannot void an invoice after inventory has been received");
    }

    const now = Date.now();
    await markInvoiceDraftItems(ctx, args.invoiceId, "rejected", now);

    await ctx.db.patch(args.invoiceId, {
      status: "void",
      voidedByUserId: user._id,
      voidedAt: now,
      updatedAt: now,
    });
    return null;
  },
});

export const upsertAccountSplit = mutation({
  args: {
    invoiceId: v.id("invoices"),
    splitId: v.optional(v.id("invoiceAccountSplits")),
    accountId: v.id("financeAccounts"),
    amountCents: v.number(),
    notes: v.optional(v.string()),
  },
  returns: v.id("invoiceAccountSplits"),
  handler: async (ctx, args) => {
    const user = await requireInventoryPermission(
      ctx,
      PERMISSIONS.financeSplitsManage.key,
    );
    const invoice = await getInvoiceOrThrow(ctx, args.invoiceId);
    if (invoice.status === "void" || invoice.status === "rejected") {
      throw new Error("Cannot split a rejected or void invoice");
    }
    const account = await ctx.db.get(args.accountId);
    if (!account) {
      throw new Error("Account not found");
    }
    assertPositiveCents(args.amountCents, "Split amount");

    const now = Date.now();
    const payload = {
      invoiceId: args.invoiceId,
      accountId: args.accountId,
      amountCents: args.amountCents,
      notes: args.notes?.trim() ?? "",
      updatedAt: now,
    };

    if (args.splitId) {
      const split = await ctx.db.get(args.splitId);
      if (!split || split.invoiceId !== args.invoiceId) {
        throw new Error("Account split not found");
      }
      await ctx.db.patch(args.splitId, payload);
      await patchInvoiceReimbursementStatus(ctx, args.invoiceId);
      return args.splitId;
    }

    const splitId = await ctx.db.insert("invoiceAccountSplits", {
      ...payload,
      createdBy: user._id,
      createdAt: now,
    });
    await patchInvoiceReimbursementStatus(ctx, args.invoiceId);
    return splitId;
  },
});

export const removeAccountSplit = mutation({
  args: {
    invoiceId: v.id("invoices"),
    splitId: v.id("invoiceAccountSplits"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireInventoryPermission(ctx, PERMISSIONS.financeSplitsManage.key);
    const invoice = await getInvoiceOrThrow(ctx, args.invoiceId);
    if (invoice.status === "void" || invoice.status === "rejected") {
      throw new Error("Cannot remove splits from rejected or void invoices");
    }
    const split = await ctx.db.get(args.splitId);
    if (!split || split.invoiceId !== args.invoiceId) {
      throw new Error("Account split not found");
    }

    await ctx.db.delete(args.splitId);
    await patchInvoiceReimbursementStatus(ctx, args.invoiceId);
    return null;
  },
});

export const recordReimbursement = mutation({
  args: {
    invoiceId: v.id("invoices"),
    reimbursedToUserId: v.id("users"),
    reimbursedToAccountId: v.optional(v.id("financeAccounts")),
    sourceAccountId: v.id("financeAccounts"),
    amountCents: v.number(),
    reimbursedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  returns: v.id("invoiceReimbursements"),
  handler: async (ctx, args) => {
    const user = await requireInventoryPermission(
      ctx,
      PERMISSIONS.financeReimbursementsRecord.key,
    );
    const invoice = await getInvoiceOrThrow(ctx, args.invoiceId);
    if (invoice.status !== "approved") {
      throw new Error("Only approved invoices can be reimbursed");
    }
    const reimbursedToUser = await ctx.db.get(args.reimbursedToUserId);
    if (!reimbursedToUser) {
      throw new Error("Reimbursed user not found");
    }
    const sourceAccount = await ctx.db.get(args.sourceAccountId);
    if (!sourceAccount) {
      throw new Error("Source account not found");
    }
    if (args.reimbursedToAccountId) {
      const reimbursedToAccount = await ctx.db.get(args.reimbursedToAccountId);
      if (!reimbursedToAccount) {
        throw new Error("Reimbursed-to account not found");
      }
      if (
        reimbursedToAccount.linkedUserId &&
        reimbursedToAccount.linkedUserId !== args.reimbursedToUserId
      ) {
        throw new Error("Reimbursed-to account is linked to a different user");
      }
    }
    assertPositiveCents(args.amountCents, "Reimbursement amount");

    const reimbursableCents = await sumInvoiceReimbursableAmount(ctx, args.invoiceId);
    const alreadyReimbursedCents = await sumInvoiceReimbursements(ctx, args.invoiceId);
    if (alreadyReimbursedCents + args.amountCents > reimbursableCents) {
      throw new Error("Reimbursements cannot exceed reimbursable amount");
    }

    const now = Date.now();
    const reimbursementId = await ctx.db.insert("invoiceReimbursements", {
      invoiceId: args.invoiceId,
      reimbursedToUserId: args.reimbursedToUserId,
      reimbursedToAccountId: args.reimbursedToAccountId,
      sourceAccountId: args.sourceAccountId,
      amountCents: args.amountCents,
      reimbursedAt: args.reimbursedAt ?? now,
      notes: args.notes?.trim() ?? "",
      createdByUserId: user._id,
      createdAt: now,
    });
    await patchInvoiceReimbursementStatus(ctx, args.invoiceId);

    return reimbursementId;
  },
});

export const receiveInvoiceStock = mutation({
  args: {
    invoiceId: v.id("invoices"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireInventoryPermission(
      ctx,
      PERMISSIONS.logisticsInvoiceReceived.key,
    );
    const invoice = await getInvoiceOrThrow(ctx, args.invoiceId);
    if (invoice.status !== "approved") {
      throw new Error("Only approved invoices can be received into stock");
    }
    if (invoice.inventoryReceivedAt) {
      throw new Error("Invoice stock has already been received");
    }

    const lineItems = await ctx.db
      .query("invoiceLineItems")
      .withIndex("by_invoiceId", (lineQuery) =>
        lineQuery.eq("invoiceId", args.invoiceId),
      )
      .take(200);
    if (lineItems.length === 0) {
      throw new Error("Invoice has no line items to receive");
    }

    const now = Date.now();
    for (const lineItem of lineItems) {
      await adjustItemTotalQuantity(ctx, lineItem.itemId, lineItem.quantity);
    }

    await ctx.db.patch(args.invoiceId, {
      inventoryReceivedByUserId: user._id,
      inventoryReceivedAt: now,
      updatedAt: now,
    });

    return null;
  },
});

async function getInvoiceOrThrow(
  ctx: Ctx,
  invoiceId: Id<"invoices">,
) {
  const invoice = await ctx.db.get(invoiceId);
  if (!invoice) {
    throw new Error("Invoice not found");
  }
  return invoice as Doc<"invoices">;
}

async function toInvoiceSummary(
  ctx: Ctx,
  invoice: Doc<"invoices">,
) {
  const supplier = await ctx.db.get(invoice.supplierId);
  const purchasedBy = await ctx.db.get(invoice.purchasedByUserId);
  const clerkInfo = purchasedBy ? await ctx.db.get(purchasedBy.clerkInfoId) : null;
  const purchasedByName = clerkInfo
    ? [clerkInfo.firstName, clerkInfo.lastName].filter(Boolean).join(" ") ||
      clerkInfo.email ||
      "Unknown user"
    : "Unknown user";

  return {
    ...invoice,
    supplierName: supplier?.name ?? "Unknown supplier",
    purchasedByName,
  };
}

function toInvoiceLineSummary(line: Doc<"invoiceLineItems">) {
  return {
    ...line,
    taxCents: 0,
    shippingCents: 0,
    discountCents: 0,
    lineTotalCents: calculateLineTotalCents({
      quantity: line.quantity,
      unitCostCents: line.unitCostCents,
    }),
  };
}

async function resolveLineItem(
  ctx: MutationCtx,
  invoice: Doc<"invoices">,
  createdBy: Id<"users">,
  args: {
    itemId?: Id<"inventoryItems">;
    newItem?: {
      name: string;
      description?: string;
      sku?: string;
      partNumber?: string;
      defaultUnit?: string;
      defaultUnitCostCents?: number;
    };
  },
) {
  if (args.itemId && args.newItem) {
    throw new Error("Choose an existing item or create a new item, not both");
  }
  if (!args.itemId && !args.newItem) {
    throw new Error("Line item requires an inventory item");
  }

  if (args.itemId) {
    const item = await assertInvoiceSupplierMatchesItem(ctx, invoice, args.itemId);
    const status = getItemApprovalStatus(item);
    if (status === "rejected") {
      throw new Error("Rejected items cannot be added to invoices");
    }
    if (status === "draft" && item.createdFromInvoiceId !== invoice._id) {
      throw new Error("Draft items can only be used on their source invoice");
    }
    return item;
  }

  const newItem = args.newItem!;
  if (newItem.defaultUnitCostCents !== undefined) {
    assertNonNegativeCents(newItem.defaultUnitCostCents, "Default unit cost");
  }
  const now = Date.now();
  const itemId = await ctx.db.insert("inventoryItems", {
    name: trimRequired(newItem.name, "Item name"),
    description: newItem.description?.trim() ?? "",
    supplierId: invoice.supplierId,
    sku: trimOptional(newItem.sku),
    partNumber: trimOptional(newItem.partNumber),
    defaultUnit: trimRequired(newItem.defaultUnit ?? "each", "Default unit"),
    defaultUnitCostCents: newItem.defaultUnitCostCents,
    totalQuantity: 0,
    usedOnRobotQuantity: 0,
    usedByMemberQuantity: 0,
    disableOutOfStockWarnings: false,
    approvalStatus: "draft",
    createdFromInvoiceId: invoice._id,
    active: false,
    createdBy,
    createdAt: now,
    updatedAt: now,
  });
  const item = await ctx.db.get(itemId);
  if (!item) {
    throw new Error("Failed to create item");
  }
  return item;
}

async function deleteDraftItemIfUnused(
  ctx: MutationCtx,
  itemId: Id<"inventoryItems">,
  excludingLineItemId: Id<"invoiceLineItems">,
) {
  const item = await ctx.db.get(itemId);
  if (!item || getItemApprovalStatus(item) !== "draft") {
    return;
  }

  const refs = await ctx.db
    .query("invoiceLineItems")
    .withIndex("by_itemId", (lineQuery) => lineQuery.eq("itemId", itemId))
    .take(2);
  const stillReferenced = refs.some((ref) => ref._id !== excludingLineItemId);
  if (!stillReferenced) {
    await ctx.db.delete(itemId);
  }
}

async function markInvoiceDraftItems(
  ctx: MutationCtx,
  invoiceId: Id<"invoices">,
  status: "approved" | "rejected",
  now: number,
) {
  const lineItems = await ctx.db
    .query("invoiceLineItems")
    .withIndex("by_invoiceId", (lineQuery) => lineQuery.eq("invoiceId", invoiceId))
    .take(200);

  for (const lineItem of lineItems) {
    const item = await ctx.db.get(lineItem.itemId);
    if (
      item &&
      getItemApprovalStatus(item) === "draft" &&
      item.createdFromInvoiceId === invoiceId
    ) {
      await ctx.db.patch(item._id, {
        approvalStatus: status,
        active: status === "approved",
        updatedAt: now,
      });
    }
  }
}

