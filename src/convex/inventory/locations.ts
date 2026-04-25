import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import type { QueryCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { PERMISSIONS } from "../../lib/permissions";
import {
  assertInteger,
  assertItemUsable,
  assertNonNegativeInteger,
  getItemQuantities,
  optionalStringValidator,
  requireInventoryPermission,
  trimOptional,
  trimRequired,
} from "./lib";

const boxItemShape = v.object({
  _id: v.id("inventoryBoxItems"),
  _creationTime: v.number(),
  boxId: v.id("storageBoxes"),
  itemId: v.id("inventoryItems"),
  itemName: v.string(),
  itemSku: optionalStringValidator,
  quantity: v.number(),
  unit: v.string(),
  notes: v.string(),
  updatedBy: v.id("users"),
  createdAt: v.number(),
  updatedAt: v.number(),
});

const boxShape = v.object({
  _id: v.id("storageBoxes"),
  _creationTime: v.number(),
  shelfId: v.id("storageShelves"),
  label: v.string(),
  description: v.string(),
  physicalLocationLabel: optionalStringValidator,
  visualRow: v.optional(v.number()),
  visualColumn: v.optional(v.number()),
  visualRowSpan: v.optional(v.number()),
  visualColumnSpan: v.optional(v.number()),
  active: v.boolean(),
  createdBy: v.id("users"),
  createdAt: v.number(),
  updatedAt: v.number(),
  items: v.array(boxItemShape),
});

const shelfShape = v.object({
  _id: v.id("storageShelves"),
  _creationTime: v.number(),
  name: v.string(),
  description: v.string(),
  physicalLocationLabel: v.string(),
  sortOrder: v.number(),
  active: v.boolean(),
  createdBy: v.id("users"),
  createdAt: v.number(),
  updatedAt: v.number(),
  boxes: v.array(boxShape),
});

export const listShelves = query({
  args: {
    includeInactive: v.optional(v.boolean()),
    includeBoxes: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  returns: v.array(shelfShape),
  handler: async (ctx, args) => {
    await requireInventoryPermission(ctx, PERMISSIONS.inventoryLocationsView.key);

    const limit = Math.min(args.limit ?? 100, 200);
    const shelves = args.includeInactive
      ? await ctx.db
          .query("storageShelves")
          .withIndex("by_sortOrder")
          .take(limit)
      : await ctx.db
          .query("storageShelves")
          .withIndex("by_active_and_sortOrder", (shelfQuery) =>
            shelfQuery.eq("active", true),
          )
          .take(limit);

    return await Promise.all(
      shelves.map(async (shelf) => ({
        ...shelf,
        boxes: args.includeBoxes === false ? [] : await listBoxesForShelf(ctx, shelf._id),
      })),
    );
  },
});

export const createShelf = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    physicalLocationLabel: v.string(),
    sortOrder: v.optional(v.number()),
    active: v.optional(v.boolean()),
  },
  returns: v.id("storageShelves"),
  handler: async (ctx, args) => {
    const user = await requireInventoryPermission(
      ctx,
      PERMISSIONS.inventoryLocationsManage.key,
    );
    const now = Date.now();

    return await ctx.db.insert("storageShelves", {
      name: trimRequired(args.name, "Shelf name"),
      description: args.description?.trim() ?? "",
      physicalLocationLabel: trimRequired(
        args.physicalLocationLabel,
        "Physical location",
      ),
      sortOrder: args.sortOrder ?? now,
      active: args.active ?? true,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateShelf = mutation({
  args: {
    shelfId: v.id("storageShelves"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    physicalLocationLabel: v.optional(v.string()),
    sortOrder: v.optional(v.number()),
    active: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireInventoryPermission(ctx, PERMISSIONS.inventoryLocationsManage.key);

    const shelf = await ctx.db.get(args.shelfId);
    if (!shelf) {
      throw new Error("Shelf not found");
    }

    await ctx.db.patch(args.shelfId, {
      ...(args.name !== undefined
        ? { name: trimRequired(args.name, "Shelf name") }
        : {}),
      ...(args.description !== undefined
        ? { description: args.description.trim() }
        : {}),
      ...(args.physicalLocationLabel !== undefined
        ? {
            physicalLocationLabel: trimRequired(
              args.physicalLocationLabel,
              "Physical location",
            ),
          }
        : {}),
      ...(args.sortOrder !== undefined ? { sortOrder: args.sortOrder } : {}),
      ...(args.active !== undefined ? { active: args.active } : {}),
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const createBox = mutation({
  args: {
    shelfId: v.id("storageShelves"),
    label: v.string(),
    description: v.optional(v.string()),
    physicalLocationLabel: optionalStringValidator,
    visualRow: v.optional(v.number()),
    visualColumn: v.optional(v.number()),
    visualRowSpan: v.optional(v.number()),
    visualColumnSpan: v.optional(v.number()),
    active: v.optional(v.boolean()),
  },
  returns: v.id("storageBoxes"),
  handler: async (ctx, args) => {
    const user = await requireInventoryPermission(
      ctx,
      PERMISSIONS.inventoryLocationsManage.key,
    );
    const shelf = await ctx.db.get(args.shelfId);
    if (!shelf) {
      throw new Error("Shelf not found");
    }
    validateVisualSpan(args.visualRowSpan, "Visual row span");
    validateVisualSpan(args.visualColumnSpan, "Visual column span");

    const now = Date.now();
    return await ctx.db.insert("storageBoxes", {
      shelfId: args.shelfId,
      label: trimRequired(args.label, "Box label"),
      description: args.description?.trim() ?? "",
      physicalLocationLabel: trimOptional(args.physicalLocationLabel),
      visualRow: args.visualRow,
      visualColumn: args.visualColumn,
      visualRowSpan: args.visualRowSpan,
      visualColumnSpan: args.visualColumnSpan,
      active: args.active ?? true,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateBox = mutation({
  args: {
    boxId: v.id("storageBoxes"),
    shelfId: v.optional(v.id("storageShelves")),
    label: v.optional(v.string()),
    description: v.optional(v.string()),
    physicalLocationLabel: optionalStringValidator,
    visualRow: v.optional(v.number()),
    visualColumn: v.optional(v.number()),
    visualRowSpan: v.optional(v.number()),
    visualColumnSpan: v.optional(v.number()),
    active: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireInventoryPermission(ctx, PERMISSIONS.inventoryLocationsManage.key);

    const box = await ctx.db.get(args.boxId);
    if (!box) {
      throw new Error("Box not found");
    }
    if (args.shelfId) {
      const shelf = await ctx.db.get(args.shelfId);
      if (!shelf) {
        throw new Error("Shelf not found");
      }
    }
    validateVisualSpan(args.visualRowSpan, "Visual row span");
    validateVisualSpan(args.visualColumnSpan, "Visual column span");

    await ctx.db.patch(args.boxId, {
      ...(args.shelfId !== undefined ? { shelfId: args.shelfId } : {}),
      ...(args.label !== undefined
        ? { label: trimRequired(args.label, "Box label") }
        : {}),
      ...(args.description !== undefined
        ? { description: args.description.trim() }
        : {}),
      ...(args.physicalLocationLabel !== undefined
        ? { physicalLocationLabel: trimOptional(args.physicalLocationLabel) }
        : {}),
      ...(args.visualRow !== undefined ? { visualRow: args.visualRow } : {}),
      ...(args.visualColumn !== undefined
        ? { visualColumn: args.visualColumn }
        : {}),
      ...(args.visualRowSpan !== undefined
        ? { visualRowSpan: args.visualRowSpan }
        : {}),
      ...(args.visualColumnSpan !== undefined
        ? { visualColumnSpan: args.visualColumnSpan }
        : {}),
      ...(args.active !== undefined ? { active: args.active } : {}),
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const setBoxItemQuantity = mutation({
  args: {
    boxId: v.id("storageBoxes"),
    itemId: v.id("inventoryItems"),
    quantity: v.number(),
    unit: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireInventoryPermission(
      ctx,
      PERMISSIONS.inventoryStockManage.key,
    );
    assertNonNegativeInteger(args.quantity, "Box quantity");

    const box = await ctx.db.get(args.boxId);
    if (!box) {
      throw new Error("Box not found");
    }
    const item = await ctx.db.get(args.itemId);
    if (!item) {
      throw new Error("Item not found");
    }
    assertItemUsable(item);

    const existing = await ctx.db
      .query("inventoryBoxItems")
      .withIndex("by_boxId_and_itemId", (boxItemQuery) =>
        boxItemQuery.eq("boxId", args.boxId).eq("itemId", args.itemId),
      )
      .first();
    const now = Date.now();

    if (existing && args.quantity === 0) {
      await ctx.db.delete(existing._id);
      return null;
    }

    if (existing) {
      await ctx.db.patch(existing._id, {
        quantity: args.quantity,
        unit: trimRequired(args.unit ?? existing.unit, "Unit"),
        notes: args.notes?.trim() ?? existing.notes,
        updatedBy: user._id,
        updatedAt: now,
      });
      return null;
    }

    if (args.quantity > 0) {
      await ctx.db.insert("inventoryBoxItems", {
        boxId: args.boxId,
        itemId: args.itemId,
        quantity: args.quantity,
        unit: trimRequired(args.unit ?? item.defaultUnit, "Unit"),
        notes: args.notes?.trim() ?? "",
        updatedBy: user._id,
        createdAt: now,
        updatedAt: now,
      });
    }

    return null;
  },
});

export const adjustTotalQuantity = mutation({
  args: {
    itemId: v.id("inventoryItems"),
    deltaQuantity: v.number(),
  },
  returns: v.object({
    unsortedQuantity: v.number(),
    boxedQuantity: v.number(),
    usedOnRobotQuantity: v.number(),
    usedByMemberQuantity: v.number(),
    totalQuantity: v.number(),
  }),
  handler: async (ctx, args) => {
    await requireInventoryPermission(ctx, PERMISSIONS.inventoryStockManage.key);
    assertInteger(args.deltaQuantity, "Quantity adjustment");

    const item = await ctx.db.get(args.itemId);
    if (!item) {
      throw new Error("Item not found");
    }
    assertItemUsable(item);
    const nextTotalQuantity = item.totalQuantity + args.deltaQuantity;

    await ctx.db.patch(item._id, {
      totalQuantity: nextTotalQuantity,
      updatedAt: Date.now(),
    });

    return await getItemQuantities(ctx, {
      ...item,
      totalQuantity: nextTotalQuantity,
    });
  },
});

export const setUsedOnRobotQuantity = mutation({
  args: {
    itemId: v.id("inventoryItems"),
    usedOnRobotQuantity: v.number(),
  },
  returns: v.object({
    unsortedQuantity: v.number(),
    boxedQuantity: v.number(),
    usedOnRobotQuantity: v.number(),
    usedByMemberQuantity: v.number(),
    totalQuantity: v.number(),
  }),
  handler: async (ctx, args) => {
    await requireInventoryPermission(ctx, PERMISSIONS.inventoryStockManage.key);
    assertNonNegativeInteger(args.usedOnRobotQuantity, "Used-on-robot quantity");

    const item = await ctx.db.get(args.itemId);
    if (!item) {
      throw new Error("Item not found");
    }
    assertItemUsable(item);
    const updatedItem = {
      ...item,
      usedOnRobotQuantity: args.usedOnRobotQuantity,
    };
    await ctx.db.patch(item._id, {
      usedOnRobotQuantity: args.usedOnRobotQuantity,
      updatedAt: Date.now(),
    });

    return await getItemQuantities(ctx, updatedItem);
  },
});

export const setUsedByMemberQuantity = mutation({
  args: {
    itemId: v.id("inventoryItems"),
    usedByMemberQuantity: v.number(),
  },
  returns: v.object({
    unsortedQuantity: v.number(),
    boxedQuantity: v.number(),
    usedOnRobotQuantity: v.number(),
    usedByMemberQuantity: v.number(),
    totalQuantity: v.number(),
  }),
  handler: async (ctx, args) => {
    await requireInventoryPermission(ctx, PERMISSIONS.inventoryStockManage.key);
    assertNonNegativeInteger(args.usedByMemberQuantity, "Used-by-member quantity");

    const item = await ctx.db.get(args.itemId);
    if (!item) {
      throw new Error("Item not found");
    }
    assertItemUsable(item);
    const updatedItem = {
      ...item,
      usedByMemberQuantity: args.usedByMemberQuantity,
    };
    await ctx.db.patch(item._id, {
      usedByMemberQuantity: args.usedByMemberQuantity,
      updatedAt: Date.now(),
    });

    return await getItemQuantities(ctx, updatedItem);
  },
});

async function listBoxesForShelf(
  ctx: QueryCtx,
  shelfId: Id<"storageShelves">,
) {
  const boxes = await ctx.db
    .query("storageBoxes")
    .withIndex("by_shelfId", (boxQuery) => boxQuery.eq("shelfId", shelfId))
    .take(200);

  return await Promise.all(
    boxes.map(async (box) => {
      const boxItems = await ctx.db
        .query("inventoryBoxItems")
        .withIndex("by_boxId", (boxItemQuery) =>
          boxItemQuery.eq("boxId", box._id),
        )
        .take(200);
      const items = await Promise.all(
        boxItems.map(async (boxItem) => {
          const item = await ctx.db.get(boxItem.itemId);
          return {
            ...boxItem,
            itemName: item?.name ?? "Unknown item",
            itemSku: item?.sku,
          };
        }),
      );
      return {
        ...box,
        items,
      };
    }),
  );
}

function validateVisualSpan(value: number | undefined, fieldName: string) {
  if (value !== undefined) {
    assertNonNegativeInteger(value, fieldName);
    if (value === 0) {
      throw new Error(`${fieldName} must be greater than zero`);
    }
  }
}

