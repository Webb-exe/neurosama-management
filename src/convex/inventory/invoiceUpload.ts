"use node";

import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { generateText, Output, stepCountIs, tool } from "ai";
import { v } from "convex/values";
import { z } from "zod/v4";
import type { FunctionReference } from "convex/server";
import { api } from "../_generated/api";
import { action } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import type { ActionCtx } from "../_generated/server";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const UPLOAD_URL_TTL_SECONDS = 5 * 60;
const DEFAULT_AI_MODEL = "anthropic/claude-sonnet-4.6";

const supportedContentTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const supplierOutput = v.object({
  id: v.union(v.string(), v.null()),
  name: v.string(),
  created: v.boolean(),
  confidence: v.number(),
  notes: v.string(),
});

const invoiceLineOutput = v.object({
  itemId: v.union(v.string(), v.null()),
  itemName: v.string(),
  createdItem: v.boolean(),
  description: v.string(),
  sku: v.union(v.string(), v.null()),
  partNumber: v.union(v.string(), v.null()),
  quantity: v.number(),
  unit: v.string(),
  unitCostCents: v.number(),
  lineTotalCents: v.number(),
  confidence: v.number(),
});

const extractedInvoiceOutput = v.object({
  supplier: supplierOutput,
  invoiceDate: v.union(v.string(), v.null()),
  invoiceNumber: v.union(v.string(), v.null()),
  currency: v.string(),
  subtotalCents: v.number(),
  taxCents: v.number(),
  shippingCents: v.number(),
  discountCents: v.number(),
  totalCents: v.number(),
  notes: v.string(),
  lineItems: v.array(invoiceLineOutput),
  warnings: v.array(v.string()),
});

const extractedInvoiceSchema = z.object({
  supplier: z.object({
    id: z.string().nullable(),
    name: z.string(),
    created: z.boolean(),
    confidence: z.number().min(0).max(1),
    notes: z.string(),
  }),
  invoiceDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  invoiceNumber: z.string().nullable(),
  currency: z.string(),
  subtotalCents: z.number().int().nonnegative(),
  taxCents: z.number().int().nonnegative(),
  shippingCents: z.number().int().nonnegative(),
  discountCents: z.number().int().nonnegative(),
  totalCents: z.number().int().nonnegative(),
  notes: z.string(),
  lineItems: z
    .array(
      z.object({
        itemId: z.string().nullable(),
        itemName: z.string(),
        createdItem: z.boolean(),
        description: z.string(),
        sku: z.string().nullable(),
        partNumber: z.string().nullable(),
        quantity: z.number().int().positive(),
        unit: z.string(),
        unitCostCents: z.number().int().nonnegative(),
        lineTotalCents: z.number().int().nonnegative(),
        confidence: z.number().min(0).max(1),
      }),
    )
    .min(1)
    .max(100),
  warnings: z.array(z.string()),
});

type ExtractedInvoice = z.infer<typeof extractedInvoiceSchema>;

type ImportLine = {
  itemId: string | null;
  itemName: string;
  description: string;
  sku: string | null;
  partNumber: string | null;
  quantity: number;
  unit: string;
  unitCostCents: number;
};

type UploadUrlResult = {
  objectKey: string;
  uploadUrl: string;
  contentType: string;
  maxBytes: number;
  expiresAt: number;
};

type ImportUploadedInvoiceResult = {
  invoiceId: Id<"invoices">;
  objectKey: string;
  fileName: string;
  supplierName: string;
  lineItemCount: number;
  createdTotalCents: number;
  structured: ExtractedInvoice;
};

type SupplierSummary = {
  _id: Id<"inventorySuppliers">;
  name: string;
  active: boolean;
};

type ItemSummary = {
  _id: Id<"inventoryItems">;
  name: string;
  sku?: string;
  partNumber?: string;
  supplierId: Id<"inventorySuppliers">;
  supplierName: string;
  defaultUnit: string;
  defaultUnitCostCents?: number;
  active: boolean;
};

type InvoiceToolSet = Record<string, unknown>;
type PublicQuery = FunctionReference<"query", "public">;
type PublicMutation = FunctionReference<"mutation", "public">;
type ConvexInventoryApi = {
  catalog: {
    listSuppliers: PublicQuery;
    listItems: PublicQuery;
    createSupplier: PublicMutation;
  };
  invoices: {
    createInvoice: PublicMutation;
    updateInvoiceDraft: PublicMutation;
    upsertLineItem: PublicMutation;
  };
};

const convexInventoryApi = api.inventory as unknown as ConvexInventoryApi;

export const createInvoiceUploadUrl = action({
  args: {
    fileName: v.string(),
    contentType: v.string(),
    byteSize: v.number(),
  },
  returns: v.object({
    objectKey: v.string(),
    uploadUrl: v.string(),
    contentType: v.string(),
    maxBytes: v.number(),
    expiresAt: v.number(),
  }),
  handler: async (_ctx, args): Promise<UploadUrlResult> => {
    const contentType = normalizeContentType(args.fileName, args.contentType);
    assertSupportedUpload(contentType, args.byteSize);

    const { bucket, client } = getS3Client();
    const objectKey = `invoices/${new Date().toISOString().slice(0, 7)}/${globalThis.crypto.randomUUID()}-${sanitizeFileName(args.fileName)}`;
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      ContentType: contentType,
      ContentLength: args.byteSize,
      Metadata: {
        originalFileName: sanitizeMetadataValue(args.fileName),
      },
    });

    return {
      objectKey,
      uploadUrl: await getSignedUrl(client, command, {
        expiresIn: UPLOAD_URL_TTL_SECONDS,
      }),
      contentType,
      maxBytes: MAX_UPLOAD_BYTES,
      expiresAt: Date.now() + UPLOAD_URL_TTL_SECONDS * 1000,
    };
  },
});

export const importUploadedInvoice = action({
  args: {
    objectKey: v.string(),
    fileName: v.string(),
    contentType: v.string(),
    byteSize: v.number(),
  },
  returns: v.object({
    invoiceId: v.id("invoices"),
    objectKey: v.string(),
    fileName: v.string(),
    supplierName: v.string(),
    lineItemCount: v.number(),
    createdTotalCents: v.number(),
    structured: extractedInvoiceOutput,
  }),
  handler: async (ctx, args): Promise<ImportUploadedInvoiceResult> => {
    if (!getEnv("AI_GATEWAY_API_KEY")) {
      throw new Error("AI_GATEWAY_API_KEY is not configured.");
    }

    const contentType = normalizeContentType(args.fileName, args.contentType);
    assertSupportedUpload(contentType, args.byteSize);

    const { bucket, client } = getS3Client();
    const object = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: args.objectKey,
      }),
    );

    const fileBytes = await bodyToUint8Array(object.Body);
    if (fileBytes.byteLength > MAX_UPLOAD_BYTES) {
      throw new Error("Uploaded invoice is too large to analyze.");
    }

    const structured: ExtractedInvoice = await extractInvoiceWithAi(ctx, {
      contentType,
      fileBytes,
      fileName: args.fileName,
    });
    const supplierId: Id<"inventorySuppliers"> = await resolveStructuredSupplier(
      ctx,
      structured.supplier,
    );
    const invoiceId: Id<"invoices"> = await createInvoiceDraft(ctx, {
      supplierId,
      invoiceDate: parseInvoiceDate(structured.invoiceDate),
      notes: buildImportedInvoiceNotes(args.fileName, structured),
    });

    const lines = normalizeLinesForCreate(structured);
    for (const line of lines) {
      await upsertInvoiceLine(ctx, {
        invoiceId,
        ...(line.itemId
          ? { itemId: line.itemId as Id<"inventoryItems"> }
          : {
              newItem: {
                name: line.itemName,
                description: line.description || undefined,
                sku: line.sku || undefined,
                partNumber: line.partNumber || undefined,
                defaultUnit: line.unit,
                defaultUnitCostCents: line.unitCostCents,
              },
            }),
        description: line.description || undefined,
        quantity: line.quantity,
        unit: line.unit,
        unitCostCents: line.unitCostCents,
      });
    }
    await updateInvoiceDraftCharges(ctx, {
      invoiceId,
      taxCents: structured.taxCents,
      shippingCents: structured.shippingCents,
      discountCents: structured.discountCents,
    });

    return {
      invoiceId,
      objectKey: args.objectKey,
      fileName: args.fileName,
      supplierName: structured.supplier.name,
      lineItemCount: lines.length,
      createdTotalCents: sumCreatedTotalCents(structured, lines),
      structured,
    };
  },
});

async function extractInvoiceWithAi(
  ctx: ActionCtx,
  args: {
    contentType: string;
    fileBytes: Uint8Array;
    fileName: string;
  },
): Promise<ExtractedInvoice> {
  const model = getEnv("AI_GATEWAY_MODEL") ?? DEFAULT_AI_MODEL;
  const filePart = args.contentType.startsWith("image/")
    ? {
        type: "image" as const,
        image: args.fileBytes,
        mediaType: args.contentType,
      }
    : {
        type: "file" as const,
        data: args.fileBytes,
        filename: args.fileName,
        mediaType: args.contentType,
      };

  const invoiceOutput = (Output.object as unknown as (options: {
    schema: unknown;
    name: string;
    description: string;
  }) => unknown)({
    schema: extractedInvoiceSchema,
    name: "invoice",
    description:
      "A structured invoice ready to create as a draft with inventory line items.",
  });

  const baseMessages = [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: `Extract this invoice from ${args.fileName}. Resolve the supplier/vendor and inventory line items with tools before returning the final structured invoice.`,
        },
        filePart,
      ],
    },
  ];
  const runGenerateText = generateText as unknown as (
    options: Record<string, unknown>,
  ) => Promise<{
    output: unknown;
    response: { messages: unknown[] };
    text: string;
  }>;

  const result = await runGenerateText({
    model,
    system:
      "You extract robotics team purchase invoices. Use cents for all money fields, ISO YYYY-MM-DD dates, and null for unknown IDs or invoice numbers. Tax, shipping, and discounts are invoice-level fields only; do not allocate them to individual line items. Line item totals should be quantity times unit cost before invoice-level tax, shipping, or discount. Before final output, use the supplied tools to look up existing suppliers/items and create a supplier or item only when the invoice clearly refers to something missing.",
    messages: baseMessages,
    tools: createInvoiceTools(ctx),
    output: invoiceOutput,
    stopWhen: stepCountIs(20),
    temperature: 0,
    maxOutputTokens: 4096,
    experimental_include: {
      requestBody: false,
      responseBody: false,
    },
  });

  const firstPassOutput = tryReadGeneratedOutput(result);
  if (firstPassOutput !== null) {
    return extractedInvoiceSchema.parse(firstPassOutput);
  }

  const finalResult = await runGenerateText({
    model,
    system:
      "Return the final structured invoice object. Use the original invoice and all supplier/item tool results from the conversation. Keep tax, shipping, and discounts at the invoice level only. Do not call tools in this pass.",
    messages: [
      ...baseMessages,
      ...result.response.messages,
      {
        role: "user",
        content:
          "Now produce the final structured invoice object. Use null for unknown IDs, cents for money, and include warnings for uncertain fields.",
      },
    ],
    output: invoiceOutput,
    temperature: 0,
    maxOutputTokens: 4096,
    experimental_include: {
      requestBody: false,
      responseBody: false,
    },
  });

  const finalOutput = tryReadGeneratedOutput(finalResult);
  if (finalOutput === null) {
    throw new Error(
      "AI analyzed the invoice but did not return a structured invoice. Try a clearer PDF or image.",
    );
  }

  return extractedInvoiceSchema.parse(finalOutput);
}

function createInvoiceTools(ctx: ActionCtx): InvoiceToolSet {
  return {
    lookupSuppliers: tool({
      description:
        "Look up existing suppliers/vendors by name before deciding to create one.",
      inputSchema: z.object({
        query: z.string(),
      }),
      execute: async ({
        query,
      }: {
        query: string;
      }): Promise<Array<{ id: string; name: string; active: boolean }>> => {
        const suppliers: SupplierSummary[] = await listSuppliers(ctx);
        const needle = normalizeName(query);
        return suppliers
          .filter((supplier: SupplierSummary) =>
            normalizeName(supplier.name).includes(needle),
          )
          .slice(0, 20)
          .map((supplier: SupplierSummary) => ({
            id: supplier._id,
            name: supplier.name,
            active: supplier.active,
          }));
      },
    }),
    resolveSupplier: tool({
      description:
        "Resolve a supplier/vendor. Creates it only when no existing supplier is a clear match.",
      inputSchema: z.object({
        name: z.string(),
        websiteUrl: z.string().nullable(),
        allowCreate: z.boolean(),
      }),
      execute: async ({
        name,
        websiteUrl,
        allowCreate,
      }: {
        name: string;
        websiteUrl: string | null;
        allowCreate: boolean;
      }): Promise<{
        id: string | null;
        name: string;
        created: boolean;
        error?: string;
      }> => {
        const suppliers: SupplierSummary[] = await listSuppliers(ctx);
        const match: SupplierSummary | undefined = findNameMatch(suppliers, name);
        if (match) {
          return { id: match._id, name: match.name, created: false };
        }
        if (!allowCreate) {
          return {
            id: null,
            name,
            created: false,
            error: "No clear supplier match and creation was not allowed.",
          };
        }
        try {
          const supplierId: Id<"inventorySuppliers"> = await createSupplier(ctx, {
            name,
            websiteUrl: websiteUrl ?? undefined,
            description: "Created from an AI invoice import.",
            active: true,
          });
          return { id: supplierId, name, created: true };
        } catch (error) {
          return {
            id: null,
            name,
            created: false,
            error: getErrorMessage(error),
          };
        }
      },
    }),
    lookupItems: tool({
      description:
        "Look up inventory items by supplier and search text before creating new items.",
      inputSchema: z.object({
        supplierId: z.string().nullable(),
        query: z.string(),
      }),
      execute: async ({
        supplierId,
        query,
      }: {
        supplierId: string | null;
        query: string;
      }): Promise<
        Array<{
          id: string;
          name: string;
          sku: string | null;
          partNumber: string | null;
          supplierId: string;
          supplierName: string;
          defaultUnit: string;
          defaultUnitCostCents: number | null;
          active: boolean;
        }>
      > => {
        const items: ItemSummary[] = await listItems(ctx, {
          supplierId: supplierId
            ? (supplierId as Id<"inventorySuppliers">)
            : undefined,
        });
        const needle = normalizeName(query);
        return items
          .filter((item: ItemSummary) =>
            [item.name, item.sku ?? "", item.partNumber ?? ""]
              .map(normalizeName)
              .some((value) => value.includes(needle)),
          )
          .slice(0, 20)
          .map((item: ItemSummary) => ({
            id: item._id,
            name: item.name,
            sku: item.sku ?? null,
            partNumber: item.partNumber ?? null,
            supplierId: item.supplierId,
            supplierName: item.supplierName,
            defaultUnit: item.defaultUnit,
            defaultUnitCostCents: item.defaultUnitCostCents ?? null,
            active: item.active,
          }));
      },
    }),
    resolveItem: tool({
      description:
        "Resolve an inventory item for a supplier. If there is no clear match, return a pending item so it can be created when the invoice is approved and received.",
      inputSchema: z.object({
        supplierId: z.string(),
        name: z.string(),
        description: z.string().nullable(),
        sku: z.string().nullable(),
        partNumber: z.string().nullable(),
        defaultUnit: z.string(),
        defaultUnitCostCents: z.number().int().nonnegative().nullable(),
        allowCreate: z.boolean(),
      }),
      execute: async (input: {
        supplierId: string;
        name: string;
        description: string | null;
        sku: string | null;
        partNumber: string | null;
        defaultUnit: string;
        defaultUnitCostCents: number | null;
        allowCreate: boolean;
      }): Promise<{
        id: string | null;
        name: string;
        sku?: string | null;
        created: boolean;
        error?: string;
      }> => {
        const supplierId = input.supplierId as Id<"inventorySuppliers">;
        const items: ItemSummary[] = await listItems(ctx, {
          supplierId,
        });
        const skuMatch: ItemSummary | undefined = input.sku
          ? items.find(
              (item: ItemSummary) =>
                item.sku &&
                item.sku.trim().toLowerCase() === input.sku!.trim().toLowerCase(),
            )
          : undefined;
        const match: ItemSummary | undefined =
          skuMatch ?? findNameMatch(items, input.name);
        if (match) {
          return {
            id: match._id,
            name: match.name,
            sku: match.sku ?? null,
            created: false,
          };
        }
        if (!input.allowCreate) {
          return {
            id: null,
            name: input.name,
            created: false,
            error: "No clear item match and creation was not allowed.",
          };
        }
        return {
          id: null,
          name: input.name,
          sku: input.sku,
          created: true,
        };
      },
    }),
  };
}

async function resolveStructuredSupplier(
  ctx: ActionCtx,
  supplier: ExtractedInvoice["supplier"],
): Promise<Id<"inventorySuppliers">> {
  if (supplier.id) {
    return supplier.id as Id<"inventorySuppliers">;
  }

  const suppliers: SupplierSummary[] = await listSuppliers(ctx);
  const match: SupplierSummary | undefined = findNameMatch(
    suppliers,
    supplier.name,
  );
  if (match) {
    return match._id;
  }

  return await createSupplier(ctx, {
    name: supplier.name,
    description: "Created from an AI invoice import.",
    active: true,
  });
}

async function listSuppliers(ctx: ActionCtx): Promise<SupplierSummary[]> {
  return (await ctx.runQuery(convexInventoryApi.catalog.listSuppliers, {
    includeInactive: true,
    limit: 200,
  })) as SupplierSummary[];
}

async function listItems(
  ctx: ActionCtx,
  args: {
    supplierId?: Id<"inventorySuppliers">;
  },
): Promise<ItemSummary[]> {
  return (await ctx.runQuery(convexInventoryApi.catalog.listItems, {
    ...(args.supplierId ? { supplierId: args.supplierId } : {}),
    includeInactive: true,
    limit: 200,
  })) as ItemSummary[];
}

async function createSupplier(
  ctx: ActionCtx,
  args: {
    name: string;
    description?: string;
    websiteUrl?: string;
    active?: boolean;
  },
): Promise<Id<"inventorySuppliers">> {
  return (await ctx.runMutation(
    convexInventoryApi.catalog.createSupplier,
    args,
  )) as Id<"inventorySuppliers">;
}

async function createInvoiceDraft(
  ctx: ActionCtx,
  args: {
    supplierId: Id<"inventorySuppliers">;
    invoiceDate?: number;
    notes?: string;
  },
): Promise<Id<"invoices">> {
  return (await ctx.runMutation(
    convexInventoryApi.invoices.createInvoice,
    args,
  )) as Id<"invoices">;
}

async function updateInvoiceDraftCharges(
  ctx: ActionCtx,
  args: {
    invoiceId: Id<"invoices">;
    taxCents: number;
    shippingCents: number;
    discountCents: number;
  },
): Promise<void> {
  await ctx.runMutation(convexInventoryApi.invoices.updateInvoiceDraft, args);
}

async function upsertInvoiceLine(
  ctx: ActionCtx,
  args: {
    invoiceId: Id<"invoices">;
    itemId?: Id<"inventoryItems">;
    newItem?: {
      name: string;
      description?: string;
      sku?: string;
      partNumber?: string;
      defaultUnit: string;
      defaultUnitCostCents: number;
    };
    description?: string;
    quantity: number;
    unit: string;
    unitCostCents: number;
  },
): Promise<Id<"invoiceLineItems">> {
  return (await ctx.runMutation(
    convexInventoryApi.invoices.upsertLineItem,
    args,
  )) as Id<"invoiceLineItems">;
}

function normalizeLinesForCreate(invoice: ExtractedInvoice): ImportLine[] {
  const lines = invoice.lineItems.map((line) => ({
    itemId: line.itemId,
    itemName: line.itemName,
    description: line.description,
    sku: line.sku,
    partNumber: line.partNumber,
    quantity: line.quantity,
    unit: line.unit || "each",
    unitCostCents: line.unitCostCents,
  }));

  return lines;
}

function sumCreatedTotalCents(invoice: ExtractedInvoice, lines: ImportLine[]) {
  const subtotalCents = lines.reduce(
    (sum, line) => sum + line.quantity * line.unitCostCents,
    0,
  );
  return (
    subtotalCents +
    invoice.taxCents +
    invoice.shippingCents -
    invoice.discountCents
  );
}

function tryReadGeneratedOutput(result: { output: unknown }) {
  try {
    return result.output;
  } catch (error) {
    if (isNoOutputGeneratedError(error)) {
      return null;
    }
    throw error;
  }
}

function isNoOutputGeneratedError(error: unknown) {
  return (
    error instanceof Error &&
    (error.name === "AI_NoOutputGeneratedError" ||
      error.constructor.name === "NoOutputGeneratedError" ||
      error.message.includes("No output generated"))
  );
}

function buildImportedInvoiceNotes(fileName: string, invoice: ExtractedInvoice) {
  return [
    `Imported from uploaded invoice: ${fileName}`,
    invoice.invoiceNumber ? `Invoice number: ${invoice.invoiceNumber}` : null,
    invoice.notes ? `AI notes: ${invoice.notes}` : null,
    invoice.warnings.length > 0
      ? `AI warnings: ${invoice.warnings.join("; ")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");
}

function parseInvoiceDate(invoiceDate: string | null) {
  if (!invoiceDate) return undefined;
  const parsed = Date.parse(`${invoiceDate}T00:00:00.000Z`);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function getEnv(name: string) {
  const runtime = globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
  };
  return runtime.process?.env?.[name];
}

function getS3Client() {
  const endpoint = getEnv("S3_ENDPOINT_URL");
  const region = getEnv("S3_REGION");
  const bucket = getEnv("S3_BUCKET_NAME");
  const accessKeyId = getEnv("S3_ACCESS_KEY_ID");
  const secretAccessKey = getEnv("S3_SECRET_ACCESS_KEY");

  const missing = [
    ["S3_ENDPOINT_URL", endpoint],
    ["S3_REGION", region],
    ["S3_BUCKET_NAME", bucket],
    ["S3_ACCESS_KEY_ID", accessKeyId],
    ["S3_SECRET_ACCESS_KEY", secretAccessKey],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(`Missing S3 environment variables: ${missing.join(", ")}`);
  }

  return {
    bucket: bucket!,
    client: new S3Client({
      endpoint,
      region,
      forcePathStyle: true,
      credentials: {
        accessKeyId: accessKeyId!,
        secretAccessKey: secretAccessKey!,
      },
    }),
  };
}

function assertSupportedUpload(contentType: string, byteSize: number) {
  if (!Number.isFinite(byteSize) || byteSize <= 0) {
    throw new Error("Invoice upload must not be empty.");
  }
  if (byteSize > MAX_UPLOAD_BYTES) {
    throw new Error("Invoice upload must be 10 MB or smaller.");
  }
  if (!supportedContentTypes.has(contentType)) {
    throw new Error("Upload a PDF, JPEG, PNG, or WebP invoice.");
  }
}

function normalizeContentType(fileName: string, contentType: string) {
  const normalized = contentType.split(";")[0]?.trim().toLowerCase();
  if (normalized && normalized !== "application/octet-stream") {
    return normalized;
  }

  const extension = fileName.split(".").pop()?.toLowerCase();
  if (extension === "pdf") return "application/pdf";
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  return normalized || "application/octet-stream";
}

function sanitizeFileName(fileName: string) {
  const sanitized = fileName
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return sanitized || "invoice";
}

function sanitizeMetadataValue(value: string) {
  return value.replace(/[^\x20-\x7E]+/g, " ").slice(0, 200);
}

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function findNameMatch<T extends { name: string }>(rows: T[], name: string) {
  const normalized = normalizeName(name);
  return (
    rows.find((row) => normalizeName(row.name) === normalized) ??
    rows.find((row) => normalizeName(row.name).includes(normalized))
  );
}

async function bodyToUint8Array(body: unknown) {
  if (!body) {
    throw new Error("Uploaded invoice file was empty.");
  }
  if (body instanceof Uint8Array) {
    return body;
  }
  if (typeof body === "string") {
    return new TextEncoder().encode(body);
  }
  if (
    typeof body === "object" &&
    "transformToByteArray" in body &&
    typeof body.transformToByteArray === "function"
  ) {
    return await body.transformToByteArray();
  }

  const chunks: Uint8Array[] = [];
  for await (const chunk of body as AsyncIterable<Uint8Array | string>) {
    chunks.push(typeof chunk === "string" ? new TextEncoder().encode(chunk) : chunk);
  }

  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const output = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
