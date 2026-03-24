import { v } from "convex/values";
import { ALL_PERMISSION_KEYS } from "../../lib/permissions";

export const appRoleValidator = v.union(
  v.literal("member"),
  v.literal("admin"),
  v.literal("scout"),
  v.literal("scout_admin"),
);

export const appRolesValidator = v.array(appRoleValidator);

export const authUserValidator = v.object({
  clerkInfoId: v.id("clerkInfo"),
  userId: v.id("users"),
  isOwner: v.boolean(),
  roles: appRolesValidator,
});

export const approvedUserValidator = v.object({
  _id: v.id("users"),
  clerkInfoId: v.id("clerkInfo"),
  isOwner: v.boolean(),
  roles: appRolesValidator,
});

export const permissionKeyValidator = v.union(
  ...(ALL_PERMISSION_KEYS.map((key) => v.literal(key)) as [
    ReturnType<typeof v.literal>,
    ...ReturnType<typeof v.literal>[],
  ]),
);
