import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { PERMISSIONS } from "../../lib/permissions";
import {
  assertNonNegativeCents,
  assertNonNegativeInteger,
  assertInteger,
  getItemApprovalStatus,
  getItemQuantities,
  itemApprovalStatusValidator,
  optionalStringValidator,
  requireInventoryPermission,
  trimOptional,
  trimRequired,
} from "./lib";

const supplierShape = v.object({
  _id: v.id("inventorySuppliers"),
  _creationTime: v.number(),
  name: v.string(),
  description: v.string(),
  contactName: optionalStringValidator,
  contactEmail: optionalStringValidator,
  websiteUrl: optionalStringValidator,
  active: v.boolean(),
  createdBy: v.id("users"),
  createdAt: v.number(),
  updatedAt: v.number(),
});

const itemSummaryShape = v.object({
  _id: v.id("inventoryItems"),
  _creationTime: v.number(),
  name: v.string(),
  description: v.string(),
  supplierId: v.id("inventorySuppliers"),
  supplierName: v.string(),
  sku: optionalStringValidator,
  partNumber: optionalStringValidator,
  defaultUnit: v.string(),
  defaultUnitCostCents: v.optional(v.number()),
  unsortedQuantity: v.number(),
  boxedQuantity: v.number(),
  usedOnRobotQuantity: v.number(),
  usedByMemberQuantity: v.number(),
  totalQuantity: v.number(),
  disableOutOfStockWarnings: v.boolean(),
  approvalStatus: itemApprovalStatusValidator,
  active: v.boolean(),
  createdBy: v.id("users"),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const listSuppliers = query({
  args: {
    includeInactive: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  returns: v.array(supplierShape),
  handler: async (ctx, args) => {
    await requireInventoryPermission(ctx, PERMISSIONS.inventoryCatalogView.key);

    const limit = Math.min(args.limit ?? 100, 200);
    if (args.includeInactive) {
      return await ctx.db
        .query("inventorySuppliers")
        .withIndex("by_name")
        .take(limit);
    }

    return await ctx.db
      .query("inventorySuppliers")
      .withIndex("by_active", (supplierQuery) =>
        supplierQuery.eq("active", true),
      )
      .take(limit);
  },
});

export const createSupplier = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    contactName: optionalStringValidator,
    contactEmail: optionalStringValidator,
    websiteUrl: optionalStringValidator,
    active: v.optional(v.boolean()),
  },
  returns: v.id("inventorySuppliers"),
  handler: async (ctx, args) => {
    const user = await requireInventoryPermission(
      ctx,
      PERMISSIONS.inventoryCatalogManage.key,
    );
    const now = Date.now();

    return await ctx.db.insert("inventorySuppliers", {
      name: trimRequired(args.name, "Supplier name"),
      description: args.description?.trim() ?? "",
      contactName: trimOptional(args.contactName),
      contactEmail: trimOptional(args.contactEmail),
      websiteUrl: trimOptional(args.websiteUrl),
      active: args.active ?? true,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateSupplier = mutation({
  args: {
    supplierId: v.id("inventorySuppliers"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    contactName: optionalStringValidator,
    contactEmail: optionalStringValidator,
    websiteUrl: optionalStringValidator,
    active: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireInventoryPermission(ctx, PERMISSIONS.inventoryCatalogManage.key);

    const supplier = await ctx.db.get(args.supplierId);
    if (!supplier) {
      throw new Error("Supplier not found");
    }

    await ctx.db.patch(args.supplierId, {
      ...(args.name !== undefined
        ? { name: trimRequired(args.name, "Supplier name") }
        : {}),
      ...(args.description !== undefined
        ? { description: args.description.trim() }
        : {}),
      ...(args.contactName !== undefined
        ? { contactName: trimOptional(args.contactName) }
        : {}),
      ...(args.contactEmail !== undefined
        ? { contactEmail: trimOptional(args.contactEmail) }
        : {}),
      ...(args.websiteUrl !== undefined
        ? { websiteUrl: trimOptional(args.websiteUrl) }
        : {}),
      ...(args.active !== undefined ? { active: args.active } : {}),
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const listItems = query({
  args: {
    supplierId: v.optional(v.id("inventorySuppliers")),
    includeInactive: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  returns: v.array(itemSummaryShape),
  handler: async (ctx, args) => {
    await requireInventoryPermission(ctx, PERMISSIONS.inventoryCatalogView.key);

    const limit = Math.min(args.limit ?? 100, 200);
    const items = args.supplierId
      ? args.includeInactive
        ? await ctx.db
            .query("inventoryItems")
            .withIndex("by_supplierId", (itemQuery) =>
              itemQuery.eq("supplierId", args.supplierId!),
            )
            .take(limit)
        : await ctx.db
            .query("inventoryItems")
            .withIndex("by_supplierId_and_active", (itemQuery) =>
              itemQuery.eq("supplierId", args.supplierId!).eq("active", true),
            )
            .take(limit)
      : args.includeInactive
        ? await ctx.db.query("inventoryItems").withIndex("by_name").take(limit)
        : await ctx.db
            .query("inventoryItems")
            .withIndex("by_active", (itemQuery) => itemQuery.eq("active", true))
            .take(limit);

    return await Promise.all(
      items.map(async (item) => {
        const supplier = await ctx.db.get(item.supplierId);
        const quantities = await getItemQuantities(ctx, item);
        return {
          _id: item._id,
          _creationTime: item._creationTime,
          name: item.name,
          description: item.description,
          supplierId: item.supplierId,
          supplierName: supplier?.name ?? "Unknown supplier",
          sku: item.sku,
          partNumber: item.partNumber,
          defaultUnit: item.defaultUnit,
          defaultUnitCostCents: item.defaultUnitCostCents,
          disableOutOfStockWarnings: item.disableOutOfStockWarnings ?? false,
          approvalStatus: item.approvalStatus ?? "approved",
          active: item.active,
          createdBy: item.createdBy,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          ...quantities,
        };
      }),
    );
  },
});

export const createItem = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    supplierId: v.id("inventorySuppliers"),
    sku: optionalStringValidator,
    partNumber: optionalStringValidator,
    defaultUnit: v.optional(v.string()),
    defaultUnitCostCents: v.optional(v.number()),
    totalQuantity: v.optional(v.number()),
    usedOnRobotQuantity: v.optional(v.number()),
    usedByMemberQuantity: v.optional(v.number()),
    disableOutOfStockWarnings: v.optional(v.boolean()),
    active: v.optional(v.boolean()),
  },
  returns: v.id("inventoryItems"),
  handler: async (ctx, args) => {
    const user = await requireInventoryPermission(
      ctx,
      PERMISSIONS.inventoryCatalogManage.key,
    );
    const supplier = await ctx.db.get(args.supplierId);
    if (!supplier) {
      throw new Error("Supplier not found");
    }

    const totalQuantity = args.totalQuantity ?? 0;
    const usedOnRobotQuantity = args.usedOnRobotQuantity ?? 0;
    const usedByMemberQuantity = args.usedByMemberQuantity ?? 0;
    assertInteger(totalQuantity, "Total quantity");
    assertNonNegativeInteger(usedOnRobotQuantity, "Used-on-robot quantity");
    assertNonNegativeInteger(usedByMemberQuantity, "Used-by-member quantity");
    if (args.defaultUnitCostCents !== undefined) {
      assertNonNegativeCents(args.defaultUnitCostCents, "Default unit cost");
    }

    const now = Date.now();
    return await ctx.db.insert("inventoryItems", {
      name: trimRequired(args.name, "Item name"),
      description: args.description?.trim() ?? "",
      supplierId: args.supplierId,
      sku: trimOptional(args.sku),
      partNumber: trimOptional(args.partNumber),
      defaultUnit: trimRequired(args.defaultUnit ?? "each", "Default unit"),
      defaultUnitCostCents: args.defaultUnitCostCents,
      totalQuantity,
      usedOnRobotQuantity,
      usedByMemberQuantity,
      disableOutOfStockWarnings: args.disableOutOfStockWarnings ?? false,
      approvalStatus: "approved",
      active: args.active ?? true,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateItem = mutation({
  args: {
    itemId: v.id("inventoryItems"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    supplierId: v.optional(v.id("inventorySuppliers")),
    sku: optionalStringValidator,
    partNumber: optionalStringValidator,
    defaultUnit: v.optional(v.string()),
    defaultUnitCostCents: v.optional(v.number()),
    disableOutOfStockWarnings: v.optional(v.boolean()),
    active: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireInventoryPermission(ctx, PERMISSIONS.inventoryCatalogManage.key);

    const item = await ctx.db.get(args.itemId);
    if (!item) {
      throw new Error("Item not found");
    }

    if (args.supplierId) {
      const supplier = await ctx.db.get(args.supplierId);
      if (!supplier) {
        throw new Error("Supplier not found");
      }
    }
    if (args.defaultUnitCostCents !== undefined) {
      assertNonNegativeCents(args.defaultUnitCostCents, "Default unit cost");
    }
    if (args.active === true && getItemApprovalStatus(item) !== "approved") {
      throw new Error("Only approved items can be activated");
    }

    await ctx.db.patch(args.itemId, {
      ...(args.name !== undefined
        ? { name: trimRequired(args.name, "Item name") }
        : {}),
      ...(args.description !== undefined
        ? { description: args.description.trim() }
        : {}),
      ...(args.supplierId !== undefined ? { supplierId: args.supplierId } : {}),
      ...(args.sku !== undefined ? { sku: trimOptional(args.sku) } : {}),
      ...(args.partNumber !== undefined
        ? { partNumber: trimOptional(args.partNumber) }
        : {}),
      ...(args.defaultUnit !== undefined
        ? { defaultUnit: trimRequired(args.defaultUnit, "Default unit") }
        : {}),
      ...(args.defaultUnitCostCents !== undefined
        ? { defaultUnitCostCents: args.defaultUnitCostCents }
        : {}),
      ...(args.disableOutOfStockWarnings !== undefined
        ? { disableOutOfStockWarnings: args.disableOutOfStockWarnings }
        : {}),
      ...(args.active !== undefined ? { active: args.active } : {}),
      updatedAt: Date.now(),
    });

    return null;
  },
});

