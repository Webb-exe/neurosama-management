export const APP_ROLES = [
  "member",
  "admin",
  "scout",
  "scout_admin",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const PERMISSIONS = {
  adminAccess: {
    key: "admin.access",
    label: "Access admin dashboard",
    description: "View the admin dashboard and admin-only navigation.",
  },
  waitlistManage: {
    key: "waitlist.manage",
    label: "Manage waitlist",
    description: "Approve and reject waitlisted users.",
  },
  usersView: {
    key: "users.view",
    label: "View users",
    description: "View the full user directory in the admin area.",
  },
  usersManageRoles: {
    key: "users.manage_roles",
    label: "Manage user roles",
    description: "Update static application roles for users.",
  },
  usersRemove: {
    key: "users.remove",
    label: "Remove users",
    description: "Remove approved users from the application.",
  },
  settingsManage: {
    key: "settings.manage",
    label: "Manage settings",
    description: "Update application-wide settings.",
  },
  invitesManage: {
    key: "invites.manage",
    label: "Manage invites",
    description: "Create, list, and revoke application invites.",
  },
  scoutingView: {
    key: "scouting.view",
    label: "View scouting",
    description: "Open the scouting area and browse available cycles.",
  },
  scoutingAnalysisView: {
    key: "scouting.analysis.view",
    label: "View scouting analysis",
    description: "View tag analysis tables for a scouting cycle.",
  },
  scoutingTeamViewFtcData: {
    key: "scouting.team.view_ftc_data",
    label: "View FTC scout data",
    description: "View the external FTC Scout data shown on team pages.",
  },
  scoutingTeamViewTags: {
    key: "scouting.team.view_tags",
    label: "View scouting tags",
    description: "View cycle tags on scouting team pages.",
  },
  scoutingTeamViewResponses: {
    key: "scouting.team.view_responses",
    label: "View team responses",
    description: "View response history on scouting team pages.",
  },
  scoutingTeamManageTags: {
    key: "scouting.team.manage_tags",
    label: "Manage team tags",
    description: "Add and remove manual team tags.",
  },
  scoutingResponsesView: {
    key: "scouting.responses.view",
    label: "View response dashboard",
    description: "Inspect submitted scouting responses and response details.",
  },
  scoutingFormsManage: {
    key: "scouting.forms.manage",
    label: "Manage scouting forms",
    description: "Create, edit, preview, and publish scouting forms.",
  },
  scoutingPublishedFormsView: {
    key: "scouting.forms.view_published",
    label: "View published forms",
    description: "List published forms that can be used for scout sessions.",
  },
  scoutingCyclesManage: {
    key: "scouting.cycles.manage",
    label: "Manage scouting cycles",
    description: "Create, rename, and archive scouting cycles.",
  },
  scoutingSessionCreateTeam: {
    key: "scouting.sessions.create_team",
    label: "Create team scout sessions",
    description: "Create scouting sessions that are tied to a specific team.",
  },
  scoutingSessionCreatePublic: {
    key: "scouting.sessions.create_public",
    label: "Create public scout sessions",
    description: "Create general scouting sessions that are not tied to one team.",
  },
  scoutingReset: {
    key: "scouting.reset",
    label: "Reset scouting data",
    description: "Delete all stored scouting data.",
  },
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]["key"];

export type Permission = {
  key: PermissionKey;
  label: string;
  description: string;
};

export const ALL_PERMISSION_KEYS = Object.values(PERMISSIONS).map(
  (permission) => permission.key,
) as PermissionKey[];

export const APP_ROLE_LABELS: Record<AppRole, string> = {
  member: "Member",
  admin: "Admin",
  scout: "Scout",
  scout_admin: "Scout Admin",
};

const MEMBER_PERMISSION_KEYS: PermissionKey[] = [
  PERMISSIONS.scoutingView.key,
  PERMISSIONS.scoutingAnalysisView.key,
  PERMISSIONS.scoutingTeamViewFtcData.key,
  PERMISSIONS.scoutingTeamViewTags.key,
  PERMISSIONS.scoutingTeamViewResponses.key,
];

const SCOUT_PERMISSION_KEYS: PermissionKey[] = [
  PERMISSIONS.scoutingView.key,
  PERMISSIONS.scoutingTeamViewFtcData.key,
  PERMISSIONS.scoutingPublishedFormsView.key,
  PERMISSIONS.scoutingSessionCreateTeam.key,
];

const SCOUT_ADMIN_PERMISSION_KEYS: PermissionKey[] = [
  PERMISSIONS.scoutingView.key,
  PERMISSIONS.scoutingAnalysisView.key,
  PERMISSIONS.scoutingTeamViewFtcData.key,
  PERMISSIONS.scoutingTeamViewTags.key,
  PERMISSIONS.scoutingTeamViewResponses.key,
  PERMISSIONS.scoutingTeamManageTags.key,
  PERMISSIONS.scoutingResponsesView.key,
  PERMISSIONS.scoutingFormsManage.key,
  PERMISSIONS.scoutingPublishedFormsView.key,
  PERMISSIONS.scoutingCyclesManage.key,
  PERMISSIONS.scoutingSessionCreateTeam.key,
  PERMISSIONS.scoutingSessionCreatePublic.key,
  PERMISSIONS.scoutingReset.key,
];

const ADMIN_PERMISSION_KEYS: PermissionKey[] = [
  ...SCOUT_ADMIN_PERMISSION_KEYS,
  PERMISSIONS.adminAccess.key,
  PERMISSIONS.waitlistManage.key,
  PERMISSIONS.usersView.key,
  PERMISSIONS.usersRemove.key,
  PERMISSIONS.settingsManage.key,
  PERMISSIONS.invitesManage.key,
];

const ROLE_PERMISSION_KEYS: Record<AppRole, PermissionKey[]> = {
  member: MEMBER_PERMISSION_KEYS,
  admin: ADMIN_PERMISSION_KEYS,
  scout: SCOUT_PERMISSION_KEYS,
  scout_admin: SCOUT_ADMIN_PERMISSION_KEYS,
};

export type PermissionUser = {
  isOwner: boolean;
  roles: AppRole[];
};

export type PermissionUserInput = {
  isOwner?: boolean;
  roles?: readonly string[];
};

function toPermissionKey(permission: Permission | PermissionKey): PermissionKey {
  return typeof permission === "string" ? permission : permission.key;
}

export function isAppRole(value: string): value is AppRole {
  return (APP_ROLES as readonly string[]).includes(value);
}

export function isPermissionKey(value: string): value is PermissionKey {
  return (ALL_PERMISSION_KEYS as readonly string[]).includes(value);
}

export function normalizeAppRoles(roles: readonly string[]): AppRole[] {
  const dedupedRoles = new Set<AppRole>();

  for (const role of roles) {
    if (isAppRole(role)) {
      dedupedRoles.add(role);
    }
  }

  return Array.from(dedupedRoles);
}

export function sortAppRoles(roles: readonly AppRole[]): AppRole[] {
  const order = new Map(APP_ROLES.map((role, index) => [role, index]));
  return [...roles].sort((left, right) => {
    return (order.get(left) ?? 0) - (order.get(right) ?? 0);
  });
}

export function normalizePermissionUser(
  user: PermissionUserInput | null | undefined,
): PermissionUser | null {
  if (!user) {
    return null;
  }

  const normalizedRoles = normalizeAppRoles(user.roles ?? []);

  return {
    isOwner: user.isOwner === true,
    roles: sortAppRoles(normalizedRoles),
  };
}

export function getRoleLabels(roles: readonly AppRole[]): string[] {
  return roles.map((role) => APP_ROLE_LABELS[role]);
}

export function hasPermissionForRoles(
  roles: readonly AppRole[],
  permission: Permission | PermissionKey,
): boolean {
  const permissionKey = toPermissionKey(permission);
  return roles.some((role) => ROLE_PERMISSION_KEYS[role].includes(permissionKey));
}

export function userHasPermission(
  user: PermissionUser | PermissionUserInput | null | undefined,
  permission: Permission | PermissionKey,
): boolean {
  const normalizedUser = normalizePermissionUser(user);
  if (!normalizedUser) {
    return false;
  }

  if (normalizedUser.isOwner) {
    return true;
  }

  return hasPermissionForRoles(normalizedUser.roles, permission);
}

export function formatUserRoleSummary(
  user: PermissionUser | PermissionUserInput | null | undefined,
): string {
  const normalizedUser = normalizePermissionUser(user);
  if (!normalizedUser) {
    return "";
  }

  if (normalizedUser.isOwner) {
    return "Owner";
  }

  const labels = getRoleLabels(normalizedUser.roles);
  return labels.join(", ");
}
