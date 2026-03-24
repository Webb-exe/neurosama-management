import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { PERMISSIONS } from "../../lib/permissions";
import { normalizeFormItems, type ScoutingFormItem } from "../../lib/scouting";
import { requireScoutingPermission } from "./lib";

export const listForms = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("scoutingForms"),
      name: v.string(),
      description: v.string(),
      createdAt: v.number(),
      updatedAt: v.number(),
      hasDraft: v.boolean(),
      latestPublishedVersionNumber: v.union(v.number(), v.null()),
    }),
  ),
  handler: async (ctx) => {
    await requireScoutingPermission(ctx, PERMISSIONS.scoutingFormsManage.key);

    const forms = await ctx.db.query("scoutingForms").collect();
    const versions = await ctx.db.query("scoutingFormVersions").collect();
    const versionById = new Map(versions.map((version) => [version._id, version]));

    return forms
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .map((form) => ({
        _id: form._id,
        name: form.name,
        description: form.description,
        createdAt: form.createdAt,
        updatedAt: form.updatedAt,
        hasDraft: Boolean(form.draftVersionId),
        latestPublishedVersionNumber:
          form.latestPublishedVersionId
            ? (versionById.get(form.latestPublishedVersionId)?.versionNumber ?? null)
            : null,
      }));
  },
});

export const listPublishedForms = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("scoutingForms"),
      name: v.string(),
      description: v.string(),
      latestPublishedVersionId: v.id("scoutingFormVersions"),
      latestPublishedVersionNumber: v.number(),
    }),
  ),
  handler: async (ctx) => {
    await requireScoutingPermission(ctx, PERMISSIONS.scoutingPublishedFormsView.key);

    const forms = await ctx.db.query("scoutingForms").collect();
    const publishedForms = [];

    for (const form of forms) {
      if (!form.latestPublishedVersionId) {
        continue;
      }

      const version = await ctx.db.get(form.latestPublishedVersionId);
      if (!version || version.versionNumber === undefined) {
        continue;
      }

      publishedForms.push({
        _id: form._id,
        name: form.name,
        description: form.description,
        latestPublishedVersionId: version._id,
        latestPublishedVersionNumber: version.versionNumber,
      });
    }

    return publishedForms.sort((left, right) =>
      left.name.localeCompare(right.name),
    );
  },
});

export const getFormEditor = query({
  args: {
    formId: v.id("scoutingForms"),
  },
  returns: v.object({
    form: v.object({
      _id: v.id("scoutingForms"),
      name: v.string(),
      description: v.string(),
      createdAt: v.number(),
      updatedAt: v.number(),
      draftVersionId: v.optional(v.id("scoutingFormVersions")),
      latestPublishedVersionId: v.optional(v.id("scoutingFormVersions")),
    }),
    draftVersion: v.union(
      v.object({
        _id: v.id("scoutingFormVersions"),
        title: v.string(),
        description: v.string(),
        teamBindingMode: v.union(
          v.literal("preselected"),
          v.literal("selectAtSubmission"),
        ),
        questions: v.any(),
        updatedAt: v.number(),
      }),
      v.null(),
    ),
    versions: v.array(
      v.object({
        _id: v.id("scoutingFormVersions"),
        status: v.union(v.literal("draft"), v.literal("published")),
        versionNumber: v.union(v.number(), v.null()),
        title: v.string(),
        description: v.string(),
        teamBindingMode: v.union(
          v.literal("preselected"),
          v.literal("selectAtSubmission"),
        ),
        questions: v.any(),
        updatedAt: v.number(),
        publishedAt: v.union(v.number(), v.null()),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    await requireScoutingPermission(ctx, PERMISSIONS.scoutingFormsManage.key);

    const form = await ctx.db.get(args.formId);
    if (!form) {
      throw new Error("Form not found");
    }

    const versions = await ctx.db
      .query("scoutingFormVersions")
      .withIndex("by_formId_createdAt", (query) => query.eq("formId", args.formId))
      .collect();

    const draftVersion = form.draftVersionId
      ? await ctx.db.get(form.draftVersionId)
      : null;

    return {
      form: {
        _id: form._id,
        name: form.name,
        description: form.description,
        createdAt: form.createdAt,
        updatedAt: form.updatedAt,
        draftVersionId: form.draftVersionId,
        latestPublishedVersionId: form.latestPublishedVersionId,
      },
      draftVersion: draftVersion
        ? {
            _id: draftVersion._id,
            title: draftVersion.title,
            description: draftVersion.description,
            teamBindingMode: draftVersion.teamBindingMode,
            questions: draftVersion.questions,
            updatedAt: draftVersion.updatedAt,
          }
        : null,
      versions: versions
        .sort((left, right) => right.updatedAt - left.updatedAt)
        .map((version) => ({
          _id: version._id,
          status: version.status,
          versionNumber: version.versionNumber ?? null,
          title: version.title,
          description: version.description,
          teamBindingMode: version.teamBindingMode,
          questions: version.questions,
          updatedAt: version.updatedAt,
          publishedAt: version.publishedAt ?? null,
        })),
    };
  },
});

export const createForm = mutation({
  args: {
    name: v.string(),
  },
  returns: v.id("scoutingForms"),
  handler: async (ctx, args) => {
    const user = await requireScoutingPermission(
      ctx,
      PERMISSIONS.scoutingFormsManage.key,
    );
    const name = args.name.trim();

    if (!name) {
      throw new Error("Form name is required");
    }

    const now = Date.now();
    const formId = await ctx.db.insert("scoutingForms", {
      name,
      description: "",
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    });

    const draftVersionId = await ctx.db.insert("scoutingFormVersions", {
      formId,
      status: "draft",
      title: name,
      description: "",
      teamBindingMode: "selectAtSubmission",
      questions: [],
      createdBy: user._id,
      createdAt: now,
      updatedBy: user._id,
      updatedAt: now,
    });

    await ctx.db.patch(formId, { draftVersionId });
    return formId;
  },
});

export const saveFormDraft = mutation({
  args: {
    formId: v.id("scoutingForms"),
    name: v.string(),
    description: v.string(),
    teamBindingMode: v.union(
      v.literal("preselected"),
      v.literal("selectAtSubmission"),
    ),
    questions: v.any(),
  },
  returns: v.id("scoutingFormVersions"),
  handler: async (ctx, args) => {
    const user = await requireScoutingPermission(
      ctx,
      PERMISSIONS.scoutingFormsManage.key,
    );
    const form = await ctx.db.get(args.formId);
    if (!form) {
      throw new Error("Form not found");
    }

    const now = Date.now();
    let draftVersion = form.draftVersionId
      ? await ctx.db.get(form.draftVersionId)
      : null;

    if (!draftVersion && form.latestPublishedVersionId) {
      const latestPublishedVersion = await ctx.db.get(form.latestPublishedVersionId);
      if (!latestPublishedVersion) {
        throw new Error("Latest published form version not found");
      }

      const draftVersionId = await ctx.db.insert("scoutingFormVersions", {
        formId: form._id,
        status: "draft",
        title: latestPublishedVersion.title,
        description: latestPublishedVersion.description,
        teamBindingMode: latestPublishedVersion.teamBindingMode,
        questions: latestPublishedVersion.questions,
        createdBy: user._id,
        createdAt: now,
        updatedBy: user._id,
        updatedAt: now,
      });

      await ctx.db.patch(form._id, {
        draftVersionId,
        updatedAt: now,
      });

      draftVersion = await ctx.db.get(draftVersionId);
    }

    if (!draftVersion) {
      throw new Error("Draft version not found");
    }

    const normalizedQuestions = normalizeFormItems(
      args.questions as ScoutingFormItem[],
    );

    await ctx.db.patch(draftVersion._id, {
      title: args.name.trim(),
      description: args.description.trim(),
      teamBindingMode: args.teamBindingMode,
      questions: normalizedQuestions,
      updatedBy: user._id,
      updatedAt: now,
    });

    await ctx.db.patch(form._id, {
      name: args.name.trim(),
      description: args.description.trim(),
      updatedAt: now,
    });

    return draftVersion._id;
  },
});

export const publishDraft = mutation({
  args: {
    formId: v.id("scoutingForms"),
  },
  returns: v.id("scoutingFormVersions"),
  handler: async (ctx, args) => {
    const user = await requireScoutingPermission(
      ctx,
      PERMISSIONS.scoutingFormsManage.key,
    );
    const form = await ctx.db.get(args.formId);
    if (!form || !form.draftVersionId) {
      throw new Error("Draft version not found");
    }

    const draftVersion = await ctx.db.get(form.draftVersionId);
    if (!draftVersion) {
      throw new Error("Draft version not found");
    }

    const latestPublishedVersion = form.latestPublishedVersionId
      ? await ctx.db.get(form.latestPublishedVersionId)
      : null;
    const nextVersionNumber = (latestPublishedVersion?.versionNumber ?? 0) + 1;
    const now = Date.now();

    await ctx.db.patch(draftVersion._id, {
      status: "published",
      versionNumber: nextVersionNumber,
      publishedAt: now,
      updatedBy: user._id,
      updatedAt: now,
    });

    await ctx.db.patch(form._id, {
      latestPublishedVersionId: draftVersion._id,
      draftVersionId: undefined,
      updatedAt: now,
    });

    return draftVersion._id;
  },
});
