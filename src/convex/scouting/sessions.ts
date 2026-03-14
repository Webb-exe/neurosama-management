import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import {
  getQuestions,
  getVisibleQuestions,
  normalizeFormItems,
  normalizeAnswerForQuestion,
  stripHiddenQuestionAnswers,
  type ScoutingAnswers,
  type ScoutingFormItem,
  type ScoutingQuestion,
} from "../../lib/scouting";
import {
  applySessionTags,
  generateSessionToken,
  getCycleById,
  hashToken,
  requireAdminUser,
} from "./lib";

function coerceAnswers(
  questions: ScoutingQuestion[],
  rawAnswers: unknown,
): ScoutingAnswers {
  const answers = (rawAnswers ?? {}) as Record<string, unknown>;
  const nextAnswers: ScoutingAnswers = {};

  for (const question of questions) {
    nextAnswers[question.id] = normalizeAnswerForQuestion(
      question,
      answers[question.id] as ScoutingAnswers[string],
    );
  }

  return nextAnswers;
}

function validateSubmission(
  items: ScoutingFormItem[],
  answers: ScoutingAnswers,
) {
  const visibleQuestions = getVisibleQuestions(items, answers);

  for (const question of visibleQuestions) {
    if (!question.required) {
      continue;
    }

    const answer = answers[question.id];
    const isMissing = Array.isArray(answer)
      ? answer.length === 0
      : answer === null || answer === undefined || String(answer).trim() === "";

    if (isMissing) {
      throw new Error(`Question "${question.title}" is required`);
    }
  }

  return visibleQuestions;
}

export const generateSessionLink = mutation({
  args: {
    cycleId: v.id("scoutingCycles"),
    formId: v.id("scoutingForms"),
    preselectedTeamNumber: v.optional(v.number()),
  },
  returns: v.object({
    sessionId: v.id("scoutingSessions"),
    token: v.string(),
    path: v.string(),
  }),
  handler: async (ctx, args) => {
    const user = await requireAdminUser(ctx);
    const cycle = await getCycleById(ctx, args.cycleId);
    if (cycle.status !== "active") {
      throw new Error("Links can only be generated for active cycles");
    }

    const form = await ctx.db.get(args.formId);
    if (!form || !form.latestPublishedVersionId) {
      throw new Error("Published form not found");
    }

    const version = await ctx.db.get(form.latestPublishedVersionId);
    if (!version || version.versionNumber === undefined) {
      throw new Error("Published form version not found");
    }

    if (
      version.teamBindingMode === "preselected" &&
      (!args.preselectedTeamNumber ||
        !Number.isInteger(args.preselectedTeamNumber) ||
        args.preselectedTeamNumber <= 0)
    ) {
      throw new Error("Preselected team number is required for this form");
    }

    const token = generateSessionToken();
    const tokenHash = await hashToken(token);
    const now = Date.now();

    const sessionId = await ctx.db.insert("scoutingSessions", {
      tokenHash,
      cycleId: cycle._id,
      formId: form._id,
      formVersionId: version._id,
      formNameSnapshot: form.name,
      formVersionNumberSnapshot: version.versionNumber,
      status: "open",
      preselectedTeamNumber: args.preselectedTeamNumber,
      answers: {},
      lastAutosavedAt: now,
      createdBy: user._id,
      createdAt: now,
      tagWritesApplied: [],
    });

    return {
      sessionId,
      token,
      path: `/scouting/session/${token}`,
    };
  },
});

export const getPublicSession = query({
  args: {
    token: v.string(),
  },
  returns: v.union(
    v.object({
      status: v.literal("invalid"),
    }),
    v.object({
      status: v.literal("closed"),
      submittedAt: v.union(v.number(), v.null()),
      formName: v.string(),
      cycleName: v.string(),
    }),
    v.object({
      status: v.literal("open"),
      sessionId: v.id("scoutingSessions"),
      cycleId: v.id("scoutingCycles"),
      cycleName: v.string(),
      formId: v.id("scoutingForms"),
      formName: v.string(),
      formVersionId: v.id("scoutingFormVersions"),
      formVersionNumber: v.number(),
      teamBindingMode: v.union(
        v.literal("preselected"),
        v.literal("selectAtSubmission"),
      ),
      preselectedTeamNumber: v.union(v.number(), v.null()),
      selectedTeamNumber: v.union(v.number(), v.null()),
      answers: v.any(),
      lastAutosavedAt: v.number(),
      title: v.string(),
      description: v.string(),
      questions: v.any(),
    }),
  ),
  handler: async (ctx, args) => {
    const tokenHash = await hashToken(args.token.trim());
    const session = await ctx.db
      .query("scoutingSessions")
      .withIndex("by_tokenHash", (query) => query.eq("tokenHash", tokenHash))
      .first();

    if (!session) {
      return { status: "invalid" as const };
    }

    const cycle = await ctx.db.get(session.cycleId);
    const version = await ctx.db.get(session.formVersionId);

    if (!cycle || !version) {
      return { status: "invalid" as const };
    }

    if (session.status !== "open") {
      return {
        status: "closed" as const,
        submittedAt: session.submittedAt ?? null,
        formName: session.formNameSnapshot,
        cycleName: cycle.name,
      };
    }

    return {
      status: "open" as const,
      sessionId: session._id,
      cycleId: session.cycleId,
      cycleName: cycle.name,
      formId: session.formId,
      formName: session.formNameSnapshot,
      formVersionId: session.formVersionId,
      formVersionNumber: session.formVersionNumberSnapshot,
      teamBindingMode: version.teamBindingMode,
      preselectedTeamNumber: session.preselectedTeamNumber ?? null,
      selectedTeamNumber: session.selectedTeamNumber ?? null,
      answers: session.answers,
      lastAutosavedAt: session.lastAutosavedAt,
      title: version.title,
      description: version.description,
      questions: version.questions,
    };
  },
});

export const autosaveSession = mutation({
  args: {
    token: v.string(),
    answers: v.any(),
    selectedTeamNumber: v.optional(v.number()),
  },
  returns: v.object({
    ok: v.boolean(),
    lastAutosavedAt: v.number(),
  }),
  handler: async (ctx, args) => {
    const tokenHash = await hashToken(args.token.trim());
    const session = await ctx.db
      .query("scoutingSessions")
      .withIndex("by_tokenHash", (query) => query.eq("tokenHash", tokenHash))
      .first();

    if (!session || session.status !== "open") {
      throw new Error("Session is closed");
    }

    const version = await ctx.db.get(session.formVersionId);
    if (!version) {
      throw new Error("Form version not found");
    }

    const items = normalizeFormItems(version.questions as ScoutingFormItem[]);
    const questions = getQuestions(items);
    const answers = stripHiddenQuestionAnswers(items, coerceAnswers(questions, args.answers));
    const now = Date.now();

    await ctx.db.patch(session._id, {
      answers,
      selectedTeamNumber:
        session.preselectedTeamNumber ?? args.selectedTeamNumber ?? session.selectedTeamNumber,
      lastAutosavedAt: now,
    });

    return { ok: true, lastAutosavedAt: now };
  },
});

export const submitSession = mutation({
  args: {
    token: v.string(),
    answers: v.any(),
    selectedTeamNumber: v.optional(v.number()),
  },
  returns: v.object({
    sessionId: v.id("scoutingSessions"),
    teamNumber: v.number(),
  }),
  handler: async (ctx, args) => {
    const tokenHash = await hashToken(args.token.trim());
    const session = await ctx.db
      .query("scoutingSessions")
      .withIndex("by_tokenHash", (query) => query.eq("tokenHash", tokenHash))
      .first();

    if (!session || session.status !== "open") {
      throw new Error("Session is closed");
    }

    const version = await ctx.db.get(session.formVersionId);
    if (!version) {
      throw new Error("Form version not found");
    }

    const items = normalizeFormItems(version.questions as ScoutingFormItem[]);
    const questions = getQuestions(items);
    const answers = stripHiddenQuestionAnswers(items, coerceAnswers(questions, args.answers));
    const visibleQuestions = validateSubmission(items, answers);
    const teamNumber =
      session.preselectedTeamNumber ?? args.selectedTeamNumber ?? session.selectedTeamNumber;

    if (!teamNumber || !Number.isInteger(teamNumber) || teamNumber <= 0) {
      throw new Error("A valid team number is required");
    }

    const now = Date.now();
    const tagWritesApplied = await applySessionTags({
      ctx,
      cycleId: session.cycleId,
      teamNumber,
      questions: visibleQuestions,
      answers,
    });

    await ctx.db.patch(session._id, {
      selectedTeamNumber: teamNumber,
      answers,
      status: "submitted",
      lastAutosavedAt: now,
      submittedAt: now,
      tagWritesApplied,
    });

    return {
      sessionId: session._id,
      teamNumber,
    };
  },
});

export const listResponses = query({
  args: {
    cycleId: v.id("scoutingCycles"),
    formId: v.optional(v.id("scoutingForms")),
    teamNumber: v.optional(v.number()),
    includeOpen: v.optional(v.boolean()),
  },
  returns: v.array(
    v.object({
      _id: v.id("scoutingSessions"),
      cycleId: v.id("scoutingCycles"),
      cycleName: v.string(),
      formId: v.id("scoutingForms"),
      formName: v.string(),
      formVersionId: v.id("scoutingFormVersions"),
      formVersionNumber: v.number(),
      status: v.union(v.literal("open"), v.literal("submitted"), v.literal("closed")),
      selectedTeamNumber: v.union(v.number(), v.null()),
      createdAt: v.number(),
      lastAutosavedAt: v.number(),
      submittedAt: v.union(v.number(), v.null()),
    }),
  ),
  handler: async (ctx, args) => {
    await requireAdminUser(ctx);
    const cycle = await getCycleById(ctx, args.cycleId);

    const sessions = await ctx.db
      .query("scoutingSessions")
      .withIndex("by_cycleId_status", (query) => query.eq("cycleId", args.cycleId))
      .collect();

    return sessions
      .filter((session) => args.includeOpen || session.status === "submitted")
      .filter((session) => !args.formId || session.formId === args.formId)
      .filter(
        (session) =>
          !args.teamNumber ||
          session.preselectedTeamNumber === args.teamNumber ||
          session.selectedTeamNumber === args.teamNumber,
      )
      .sort((left, right) => {
        const leftTime = left.submittedAt ?? left.lastAutosavedAt;
        const rightTime = right.submittedAt ?? right.lastAutosavedAt;
        return rightTime - leftTime;
      })
      .map((session) => ({
        _id: session._id,
        cycleId: cycle._id,
        cycleName: cycle.name,
        formId: session.formId,
        formName: session.formNameSnapshot,
        formVersionId: session.formVersionId,
        formVersionNumber: session.formVersionNumberSnapshot,
        status: session.status,
        selectedTeamNumber:
          session.selectedTeamNumber ?? session.preselectedTeamNumber ?? null,
        createdAt: session.createdAt,
        lastAutosavedAt: session.lastAutosavedAt,
        submittedAt: session.submittedAt ?? null,
      }));
  },
});

export const getResponseDetail = query({
  args: {
    sessionId: v.id("scoutingSessions"),
  },
  returns: v.object({
    _id: v.id("scoutingSessions"),
    cycleName: v.string(),
    formName: v.string(),
    formVersionNumber: v.number(),
    status: v.union(v.literal("open"), v.literal("submitted"), v.literal("closed")),
    selectedTeamNumber: v.union(v.number(), v.null()),
    answers: v.any(),
    questions: v.any(),
    tagWritesApplied: v.any(),
    submittedAt: v.union(v.number(), v.null()),
    lastAutosavedAt: v.number(),
  }),
  handler: async (ctx, args) => {
    await requireAdminUser(ctx);

    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Response not found");
    }

    const cycle = await ctx.db.get(session.cycleId);
    const version = await ctx.db.get(session.formVersionId);
    if (!cycle || !version) {
      throw new Error("Related scouting data not found");
    }

    return {
      _id: session._id,
      cycleName: cycle.name,
      formName: session.formNameSnapshot,
      formVersionNumber: session.formVersionNumberSnapshot,
      status: session.status,
      selectedTeamNumber:
        session.selectedTeamNumber ?? session.preselectedTeamNumber ?? null,
      answers: session.answers,
      questions: version.questions,
      tagWritesApplied: session.tagWritesApplied,
      submittedAt: session.submittedAt ?? null,
      lastAutosavedAt: session.lastAutosavedAt,
    };
  },
});
