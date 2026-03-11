import { print } from "graphql";
import type { TypedDocumentNode } from "@graphql-typed-document-node/core";

const FTC_SCOUT_URL = "https://api.ftcscout.org/graphql";

type GraphQLErrorResponse = {
  errors?: Array<{ message: string }>;
};

const documentTextCache = new WeakMap<object, string>();

function getOperationName(documentText: string): string {
  const match = documentText.match(/\b(query|mutation)\s+([A-Za-z0-9_]+)/);
  if (!match) {
    throw new Error("Unable to determine GraphQL operation name");
  }
  return match[2];
}

function getDocumentText<TData, TVariables>(
  document: TypedDocumentNode<TData, TVariables>,
): string {
  const cachedText = documentTextCache.get(document as object);
  if (cachedText) {
    return cachedText;
  }

  const documentText = print(document);
  documentTextCache.set(document as object, documentText);
  return documentText;
}

export async function fetchFtcScout<TData, TVariables extends Record<string, unknown>>(
  document: TypedDocumentNode<TData, TVariables>,
  variables: TVariables,
  options?: { signal?: AbortSignal },
): Promise<TData> {
  const documentText = getDocumentText(document);
  const operationName = getOperationName(documentText);
  const response = await fetch(FTC_SCOUT_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      operationName,
      query: documentText,
      variables,
    }),
    signal: options?.signal,
  });

  if (!response.ok) {
    throw new Error(`FTC Scout request failed with ${response.status}`);
  }

  const payload = (await response.json()) as { data?: TData } & GraphQLErrorResponse;

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join(", "));
  }

  if (payload.data === undefined) {
    throw new Error("FTC Scout response did not include data");
  }

  return payload.data;
}
