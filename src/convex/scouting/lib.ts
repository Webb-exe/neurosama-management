import { MutationCtx, QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import {
  normalizePermissionUser,
  PERMISSIONS,
  userHasPermission,
  type PermissionKey,
} from "../../lib/permissions";
import { approvedUserValidator } from "../auth/validators";
import {
  normalizeFormItems,
  serializeTagValue,
  type ScoutingAnswers,
  type ScoutingFormItem,
  type ScoutingQuestion,
  type ScoutingTagWrite,
} from "../../lib/scouting";

type Ctx = QueryCtx | MutationCtx;

function toApprovedUser(user: {
  _id: Id<"users">;
  clerkInfoId: Id<"clerkInfo">;
  isOwner?: boolean | undefined;
  roles?: readonly string[] | undefined;
}) {
  const normalizedUser = normalizePermissionUser(user);
  if (!normalizedUser) {
    throw new Error("User has an invalid permission configuration");
  }

  return {
    _id: user._id,
    clerkInfoId: user.clerkInfoId,
    isOwner: normalizedUser.isOwner,
    roles: normalizedUser.roles,
  };
}

export async function getCurrentUser(ctx: Ctx): Promise<
  | {
      _id: Id<"users">;
      clerkInfoId: Id<"clerkInfo">;
      isOwner: boolean;
      roles: typeof approvedUserValidator.fields.roles.type;
    }
  | null
> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    console.log("No identity found");
    return null;
  }

  const clerkInfo = await ctx.db
    .query("clerkInfo")
    .withIndex("by_clerkId", (query) => query.eq("clerkId", identity.subject))
    .first();

  if (!clerkInfo) {
    console.log("No clerk info found");
    return null;
  }

  const user = await ctx.db
    .query("users")
    .withIndex("clerkInfoId", (query) => query.eq("clerkInfoId", clerkInfo._id))
    .first();

  if (!user) {
    console.log("No user found");
    return null;
  }

  return toApprovedUser(user);
}

export async function requireApprovedUser(ctx: Ctx) {
  const user = await getCurrentUser(ctx);
  if (!user) {
    throw new Error("Not authenticated");
  }
  return user;
}

export async function requireScoutingPermission(
  ctx: Ctx,
  permission: PermissionKey,
) {
  const user = await requireApprovedUser(ctx);
  if (!userHasPermission(user, permission)) {
    throw new Error(`Not authorized - ${permission} required`);
  }
  return user;
}

export async function requireAdminUser(ctx: Ctx) {
  return requireScoutingPermission(ctx, PERMISSIONS.scoutingFormsManage.key);
}

export async function getCycleById(
  ctx: Ctx,
  cycleId: Id<"scoutingCycles">,
): Promise<Doc<"scoutingCycles">> {
  const cycle = await ctx.db.get(cycleId);
  if (!cycle) {
    throw new Error("Scouting cycle not found");
  }
  return cycle;
}

export async function getLatestActiveCycle(ctx: Ctx) {
  const cycles = await ctx.db
    .query("scoutingCycles")
    .withIndex("by_status", (query) => query.eq("status", "active"))
    .collect();

  return cycles.sort((left, right) => right.createdAt - left.createdAt)[0] ?? null;
}

export async function getCycleOrDefault(
  ctx: Ctx,
  cycleId?: Id<"scoutingCycles">,
) {
  if (cycleId) {
    return getCycleById(ctx, cycleId);
  }

  return getLatestActiveCycle(ctx);
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

export function generateSessionToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return bytesToHex(bytes);
}

export async function hashToken(token: string): Promise<string> {
  const hashed = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );
  return bytesToHex(new Uint8Array(hashed));
}

export function sanitizeQuestions(rawQuestions: unknown): ScoutingFormItem[] {
  if (!Array.isArray(rawQuestions)) {
    return [];
  }
  return normalizeFormItems(rawQuestions as ScoutingFormItem[]);
}

export async function ensureTagDefinition(
  ctx: MutationCtx,
  key: string,
  valueKind: "scalar" | "multi",
  suggestedValue?: string,
) {
  const trimmedKey = key.trim();
  if (!trimmedKey) {
    return null;
  }

  const now = Date.now();
  const existing = await ctx.db
    .query("scoutingTagDefinitions")
    .withIndex("by_key", (query) => query.eq("key", trimmedKey))
    .first();

  const nextSuggestedValues = new Set(existing?.suggestedValues ?? []);
  if (suggestedValue && suggestedValue.trim()) {
    nextSuggestedValues.add(suggestedValue.trim());
  }

  if (existing) {
    await ctx.db.patch(existing._id, {
      valueKind,
      suggestedValues: Array.from(nextSuggestedValues).sort((left, right) =>
        left.localeCompare(right),
      ),
      updatedAt: now,
    });
    return existing._id;
  }

  return ctx.db.insert("scoutingTagDefinitions", {
    key: trimmedKey,
    label: trimmedKey,
    sortMode: "text",
    valueKind,
    suggestedValues: Array.from(nextSuggestedValues).sort((left, right) =>
      left.localeCompare(right),
    ),
    createdAt: now,
    updatedAt: now,
  });
}

export async function getOrCreateCycleTeamRecord(
  ctx: MutationCtx,
  cycleId: Id<"scoutingCycles">,
  teamNumber: number,
) {
  const existing = await ctx.db
    .query("cycleTeamScouting")
    .withIndex("by_cycleId_teamNumber", (query) =>
      query.eq("cycleId", cycleId).eq("teamNumber", teamNumber),
    )
    .first();

  if (existing) {
    return existing;
  }

  const id = await ctx.db.insert("cycleTeamScouting", {
    cycleId,
    teamNumber,
    tags: {},
    responseCount: 0,
    updatedAt: Date.now(),
  });

  return ctx.db.get(id).then((record) => {
    if (!record) {
      throw new Error("Failed to create cycle team scouting record");
    }
    return record;
  });
}

export async function applySessionTags(args: {
  ctx: MutationCtx;
  cycleId: Id<"scoutingCycles">;
  teamNumber: number;
  questions: ScoutingQuestion[];
  answers: ScoutingAnswers;
}) {
  const { ctx, cycleId, teamNumber, questions, answers } = args;
  const teamRecord = await getOrCreateCycleTeamRecord(ctx, cycleId, teamNumber);
  const nextTags = { ...teamRecord.tags };
  const tagWritesApplied: ScoutingTagWrite[] = [];

  for (const question of questions) {
    const tagConfig = question.tagConfig;
    if (!tagConfig?.enabled || !tagConfig.key.trim()) {
      continue;
    }

    const answer = answers[question.id];
    const tagValue = serializeTagValue(question, answer);
    if (tagValue === null) {
      continue;
    }

    nextTags[tagConfig.key.trim()] = tagValue;
    tagWritesApplied.push({
      questionId: question.id,
      key: tagConfig.key.trim(),
      value: tagValue,
    });

    await ensureTagDefinition(
      ctx,
      tagConfig.key.trim(),
      question.type === "multiSelect" ? "multi" : "scalar",
      question.type === "multiSelect" ? undefined : tagValue,
    );
  }

  await ctx.db.patch(teamRecord._id, {
    tags: nextTags,
    responseCount: teamRecord.responseCount + 1,
    lastResponseAt: Date.now(),
    updatedAt: Date.now(),
  });

  return tagWritesApplied;
}

export function resolveTeamNumber(args: {
  preselectedTeamNumber?: number;
  selectedTeamNumber?: number;
}) {
  const teamNumber = args.preselectedTeamNumber ?? args.selectedTeamNumber;
  if (!teamNumber || !Number.isInteger(teamNumber) || teamNumber <= 0) {
    throw new Error("A valid team number is required");
  }
  return teamNumber;
}
