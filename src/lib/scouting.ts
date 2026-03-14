export type ScoutingQuestionType =
  | "text"
  | "number"
  | "singleSelect"
  | "multiSelect"
  | "scale";

export type ScoutingConditionOperator =
  | "equals"
  | "notEquals"
  | "containsAny"
  | "containsAll"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "isAnswered"
  | "isNotAnswered";

export type ScoutingAnswerValue = string | number | string[] | null | undefined;
export type ScoutingAnswers = Record<string, ScoutingAnswerValue>;

export type ScoutingOption = {
  id: string;
  label: string;
  value: string;
};

export type ScoutingScaleConfig = {
  min: number;
  max: number;
  step: number;
  minLabel: string;
  maxLabel: string;
};

export type ScoutingConditionLeaf = {
  id: string;
  kind: "condition";
  questionId: string;
  operator: ScoutingConditionOperator;
  value?: string | number | string[];
};

export type ScoutingConditionGroup = {
  id: string;
  kind: "group";
  mode: "all" | "any";
  children: ScoutingConditionNode[];
};

export type ScoutingConditionNode = ScoutingConditionLeaf | ScoutingConditionGroup;

export type ScoutingTagLookupEntry = {
  id: string;
  from: string;
  to: string;
};

export type ScoutingTagConfig = {
  enabled: boolean;
  key: string;
  conversionMode: "raw" | "lookupMap";
  lookupMap: ScoutingTagLookupEntry[];
  multiValueFormat: "jsonArray";
};

export type ScoutingFormQuestion = {
  id: string;
  kind: "question";
  // Optional explicit section membership for mixed layouts (question -> section -> question).
  sectionId?: string | null;
  type: ScoutingQuestionType;
  title: string;
  description: string;
  required: boolean;
  order: number;
  options?: ScoutingOption[];
  scaleConfig?: ScoutingScaleConfig;
  visibilityRule?: ScoutingConditionGroup | null;
  tagConfig?: ScoutingTagConfig | null;
};

export type ScoutingFormPage = {
  id: string;
  kind: "page";
  title: string;
  description: string;
  order: number;
  visibilityRule?: ScoutingConditionGroup | null;
  continueLabel?: string;
};

export type ScoutingFormSection = {
  id: string;
  kind: "section";
  title: string;
  description: string;
  order: number;
  visibilityRule?: ScoutingConditionGroup | null;
};

export type ScoutingFormItem = ScoutingFormQuestion | ScoutingFormPage | ScoutingFormSection;
export type ScoutingQuestion = ScoutingFormQuestion;
export type ScoutingPage = ScoutingFormPage;
export type ScoutingSection = ScoutingFormSection;

export type ScoutingFormDraft = {
  title: string;
  description: string;
  teamBindingMode: "preselected" | "selectAtSubmission";
  questions: ScoutingFormItem[];
};

export type ScoutingTagWrite = {
  questionId: string;
  key: string;
  value: string;
};

export type VisibleScoutingSection = {
  id: string;
  title: string;
  description: string;
  isImplicit: boolean;
  questions: ScoutingQuestion[];
};

export type VisibleScoutingPage = {
  id: string;
  title: string;
  description: string;
  order: number;
  continueLabel: string;
  isImplicit: boolean;
  sections: VisibleScoutingSection[];
  questionCount: number;
};

export type ScoutingSectionItems = {
  section: ScoutingSection | null;
  questions: ScoutingQuestion[];
};

export type ScoutingPageItems = {
  page: ScoutingPage | null;
  items: ScoutingSectionItems[];
};

type LegacyScoutingQuestion = Omit<ScoutingFormQuestion, "kind">;
type LegacyScoutingPage = Omit<ScoutingFormPage, "kind"> & {
  kind?: "page" | "section";
};
type LegacyScoutingSection = Omit<ScoutingFormSection, "kind"> & {
  kind: "section";
  continueLabel?: never;
};
type RawScoutingItem =
  | ScoutingFormItem
  | LegacyScoutingQuestion
  | LegacyScoutingPage
  | LegacyScoutingSection;

export function createScoutingId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createDefaultOption(index: number): ScoutingOption {
  return {
    id: createScoutingId("opt"),
    label: `Option ${index + 1}`,
    value: `option_${index + 1}`,
  };
}

export function createDefaultQuestion(
  type: ScoutingQuestionType,
  order: number,
): ScoutingQuestion {
  const base: ScoutingQuestion = {
    id: createScoutingId("q"),
    kind: "question",
    sectionId: null,
    type,
    title: "Untitled Question",
    description: "",
    required: false,
    order,
    visibilityRule: null,
    tagConfig: {
      enabled: false,
      key: "",
      conversionMode: "raw",
      lookupMap: [],
      multiValueFormat: "jsonArray",
    },
  };

  if (type === "singleSelect" || type === "multiSelect") {
    base.options = [createDefaultOption(0), createDefaultOption(1)];
  }

  if (type === "scale") {
    base.scaleConfig = {
      min: 1,
      max: 5,
      step: 1,
      minLabel: "Low",
      maxLabel: "High",
    };
  }

  return base;
}

export function createDefaultPage(order: number): ScoutingPage {
  return {
    id: createScoutingId("page"),
    kind: "page",
    title: "New page",
    description: "",
    order,
    visibilityRule: null,
    continueLabel: "Continue",
  };
}

export function createDefaultSection(order: number): ScoutingSection {
  return {
    id: createScoutingId("sec"),
    kind: "section",
    title: "New section",
    description: "",
    order,
    visibilityRule: null,
  };
}

export function isPage(item: ScoutingFormItem): item is ScoutingPage {
  return item.kind === "page";
}

export function isSection(item: ScoutingFormItem): item is ScoutingSection {
  return item.kind === "section";
}

export function isQuestion(item: ScoutingFormItem): item is ScoutingQuestion {
  return item.kind === "question";
}

function normalizeQuestion(rawQuestion: RawScoutingItem, order: number): ScoutingQuestion {
  const question = rawQuestion as LegacyScoutingQuestion;
  const type = question.type ?? "text";

  return {
    id: question.id ?? createScoutingId("q"),
    kind: "question",
    sectionId: "sectionId" in question ? (question.sectionId ?? null) : undefined,
    type,
    title: question.title ?? "Untitled Question",
    description: question.description ?? "",
    required: Boolean(question.required),
    order,
    options:
      type === "singleSelect" || type === "multiSelect"
        ? (question.options ?? []).map((option, index) => ({
            id: option.id ?? createScoutingId("opt"),
            label: option.label ?? `Option ${index + 1}`,
            value: option.value ?? `option_${index + 1}`,
          }))
        : undefined,
    scaleConfig:
      type === "scale"
        ? {
            min: question.scaleConfig?.min ?? 1,
            max: question.scaleConfig?.max ?? 5,
            step: question.scaleConfig?.step ?? 1,
            minLabel: question.scaleConfig?.minLabel ?? "Low",
            maxLabel: question.scaleConfig?.maxLabel ?? "High",
          }
        : undefined,
    visibilityRule: question.visibilityRule ?? null,
    tagConfig: question.tagConfig
      ? {
          enabled: question.tagConfig.enabled,
          key: question.tagConfig.key ?? "",
          conversionMode: question.tagConfig.conversionMode ?? "raw",
          lookupMap: question.tagConfig.lookupMap ?? [],
          multiValueFormat: "jsonArray",
        }
      : {
          enabled: false,
          key: "",
          conversionMode: "raw",
          lookupMap: [],
          multiValueFormat: "jsonArray",
        },
  };
}

function normalizePage(rawPage: RawScoutingItem, order: number): ScoutingPage {
  const page = rawPage as LegacyScoutingPage;
  return {
    id: page.id ?? createScoutingId("page"),
    kind: "page",
    title: page.title ?? "New page",
    description: page.description ?? "",
    order,
    visibilityRule: page.visibilityRule ?? null,
    continueLabel: page.continueLabel?.trim() || "Continue",
  };
}

function normalizeSection(rawSection: RawScoutingItem, order: number): ScoutingSection {
  const section = rawSection as LegacyScoutingSection;
  return {
    id: section.id ?? createScoutingId("sec"),
    kind: "section",
    title: section.title ?? "New section",
    description: section.description ?? "",
    order,
    visibilityRule: section.visibilityRule ?? null,
  };
}

export function normalizeFormItems(rawItems: unknown): ScoutingFormItem[] {
  if (!Array.isArray(rawItems)) {
    return [];
  }

  return rawItems
    .map((item, index) => {
      const candidate = item as RawScoutingItem;
      if ("type" in candidate) {
        return normalizeQuestion(candidate, index);
      }
      if ("kind" in candidate && candidate.kind === "page") {
        return normalizePage(candidate, index);
      }
      if ("kind" in candidate && candidate.kind === "section") {
        return "continueLabel" in candidate
          ? normalizePage(candidate, index)
          : normalizeSection(candidate, index);
      }
      return normalizePage(candidate, index);
    })
    .sort((left, right) => left.order - right.order)
    .map((item, index) => ({ ...item, order: index }));
}

export function reorderFormItems(
  items: ScoutingFormItem[],
  orderedIds: string[],
): ScoutingFormItem[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  return orderedIds
    .map((id, index) => {
      const item = byId.get(id);
      if (!item) {
        return null;
      }
      return { ...item, order: index };
    })
    .filter((item): item is ScoutingFormItem => item !== null);
}

export function getQuestions(items: ScoutingFormItem[]): ScoutingQuestion[] {
  return items.filter(isQuestion);
}

export function getQuestionsBeforeOrder(
  items: ScoutingFormItem[],
  order: number,
): ScoutingQuestion[] {
  return items.filter(
    (item): item is ScoutingQuestion => isQuestion(item) && item.order < order,
  );
}

export function getPageItems(items: ScoutingFormItem[]): ScoutingPageItems[] {
  const sortedItems = [...items].sort((left, right) => left.order - right.order);
  const pages: ScoutingPageItems[] = [];
  let currentPage: ScoutingPageItems = { page: null, items: [] };
  let legacyCurrentSection: ScoutingSectionItems | null = null;
  const sectionById = new Map<string, ScoutingSectionItems>();

  const appendImplicitQuestion = (question: ScoutingQuestion) => {
    const lastEntry = currentPage.items[currentPage.items.length - 1];
    if (lastEntry?.section === null) {
      lastEntry.questions.push(question);
      return;
    }
    currentPage.items.push({ section: null, questions: [question] });
  };

  const pushPage = () => {
    if (currentPage.page || currentPage.items.length > 0) {
      pages.push(currentPage);
    }
  };

  for (const item of sortedItems) {
    if (isPage(item)) {
      pushPage();
      currentPage = { page: item, items: [] };
      legacyCurrentSection = null;
      sectionById.clear();
      continue;
    }

    if (isSection(item)) {
      const sectionEntry: ScoutingSectionItems = { section: item, questions: [] };
      currentPage.items.push(sectionEntry);
      sectionById.set(item.id, sectionEntry);
      legacyCurrentSection = sectionEntry;
      continue;
    }

    if (item.sectionId !== undefined) {
      const explicitSectionId = item.sectionId;
      if (explicitSectionId) {
        const sectionEntry = sectionById.get(explicitSectionId);
        if (sectionEntry) {
          sectionEntry.questions.push(item);
          continue;
        }
      }
      appendImplicitQuestion(item);
      continue;
    }

    if (legacyCurrentSection) {
      legacyCurrentSection.questions.push(item);
      continue;
    }

    appendImplicitQuestion(item);
  }

  pushPage();
  return pages;
}

function toComparableString(value: ScoutingAnswerValue): string {
  if (Array.isArray(value)) {
    return value.join(",");
  }

  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function toArrayValue(value: ScoutingAnswerValue): string[] {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry));
  }

  if (value === null || value === undefined || value === "") {
    return [];
  }

  return [String(value)];
}

function toNumericValue(value: ScoutingAnswerValue): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function evaluateConditionLeaf(
  condition: ScoutingConditionLeaf,
  answers: ScoutingAnswers,
): boolean {
  const answer = answers[condition.questionId];

  switch (condition.operator) {
    case "equals":
      return toComparableString(answer) === String(condition.value ?? "");
    case "notEquals":
      return toComparableString(answer) !== String(condition.value ?? "");
    case "containsAny": {
      const actualValues = toArrayValue(answer);
      const expectedValues = Array.isArray(condition.value)
        ? condition.value.map((entry) => String(entry))
        : [String(condition.value ?? "")];
      return expectedValues.some((entry) => actualValues.includes(entry));
    }
    case "containsAll": {
      const actualValues = toArrayValue(answer);
      const expectedValues = Array.isArray(condition.value)
        ? condition.value.map((entry) => String(entry))
        : [String(condition.value ?? "")];
      return expectedValues.every((entry) => actualValues.includes(entry));
    }
    case "gt": {
      const actual = toNumericValue(answer);
      const expected = toNumericValue(condition.value as ScoutingAnswerValue);
      return actual !== null && expected !== null && actual > expected;
    }
    case "gte": {
      const actual = toNumericValue(answer);
      const expected = toNumericValue(condition.value as ScoutingAnswerValue);
      return actual !== null && expected !== null && actual >= expected;
    }
    case "lt": {
      const actual = toNumericValue(answer);
      const expected = toNumericValue(condition.value as ScoutingAnswerValue);
      return actual !== null && expected !== null && actual < expected;
    }
    case "lte": {
      const actual = toNumericValue(answer);
      const expected = toNumericValue(condition.value as ScoutingAnswerValue);
      return actual !== null && expected !== null && actual <= expected;
    }
    case "isAnswered":
      return Array.isArray(answer)
        ? answer.length > 0
        : answer !== null && answer !== undefined && String(answer).trim() !== "";
    case "isNotAnswered":
      return !evaluateConditionLeaf({ ...condition, operator: "isAnswered" }, answers);
    default:
      return true;
  }
}

export function evaluateVisibilityRule(
  rule: ScoutingConditionGroup | null | undefined,
  answers: ScoutingAnswers,
): boolean {
  if (!rule) {
    return true;
  }

  const children = rule.children ?? [];
  if (children.length === 0) {
    return true;
  }

  if (rule.mode === "all") {
    return children.every((child) =>
      child.kind === "group"
        ? evaluateVisibilityRule(child, answers)
        : evaluateConditionLeaf(child, answers),
    );
  }

  return children.some((child) =>
    child.kind === "group"
      ? evaluateVisibilityRule(child, answers)
      : evaluateConditionLeaf(child, answers),
  );
}

export function isItemVisible(item: ScoutingFormItem, answers: ScoutingAnswers): boolean {
  return evaluateVisibilityRule(item.visibilityRule ?? null, answers);
}

export function isQuestionVisible(question: ScoutingQuestion, answers: ScoutingAnswers): boolean {
  return isItemVisible(question, answers);
}

export function getVisiblePages(
  items: ScoutingFormItem[],
  answers: ScoutingAnswers,
): VisibleScoutingPage[] {
  const visiblePages: VisibleScoutingPage[] = [];

  for (const [pageIndex, pageEntry] of getPageItems(items).entries()) {
    if (pageEntry.page && !isItemVisible(pageEntry.page, answers)) {
      continue;
    }

    const visibleSections: VisibleScoutingSection[] = [];

    for (const [sectionIndex, sectionEntry] of pageEntry.items.entries()) {
      if (sectionEntry.section && !isItemVisible(sectionEntry.section, answers)) {
        continue;
      }

      const visibleQuestions = sectionEntry.questions.filter((question) =>
        isItemVisible(question, answers),
      );
      if (visibleQuestions.length === 0) {
        continue;
      }

      visibleSections.push({
        id:
          sectionEntry.section?.id ??
          pageEntry.page?.id ??
          `__implicit_page_section_${pageIndex}_${sectionIndex}__`,
        title: sectionEntry.section?.title ?? "",
        description: sectionEntry.section?.description ?? "",
        isImplicit: !sectionEntry.section,
        questions: visibleQuestions,
      });
    }

    if (visibleSections.length === 0) {
      continue;
    }

    visiblePages.push({
      id: pageEntry.page?.id ?? "__intro_page__",
      title: pageEntry.page?.title ?? "",
      description: pageEntry.page?.description ?? "",
      order: visiblePages.length,
      continueLabel: pageEntry.page?.continueLabel?.trim() || "Continue",
      isImplicit: !pageEntry.page,
      sections: visibleSections,
      questionCount: visibleSections.reduce(
        (count, section) => count + section.questions.length,
        0,
      ),
    });
  }

  return visiblePages;
}

export function getVisibleQuestions(
  items: ScoutingFormItem[],
  answers: ScoutingAnswers,
): ScoutingQuestion[] {
  return getVisiblePages(items, answers).flatMap((page) =>
    page.sections.flatMap((section) => section.questions),
  );
}

export function stripHiddenQuestionAnswers(
  items: ScoutingFormItem[],
  answers: ScoutingAnswers,
): ScoutingAnswers {
  const visibleQuestionIds = new Set(getVisibleQuestions(items, answers).map((question) => question.id));
  let changed = false;
  const nextAnswers: ScoutingAnswers = {};

  for (const [questionId, answer] of Object.entries(answers)) {
    if (!visibleQuestionIds.has(questionId)) {
      changed = true;
      continue;
    }
    nextAnswers[questionId] = answer;
  }

  return changed ? nextAnswers : answers;
}

export function normalizeAnswerForQuestion(
  question: ScoutingQuestion,
  answer: ScoutingAnswerValue,
): ScoutingAnswerValue {
  if (question.type === "multiSelect") {
    const answerValues = Array.isArray(answer) ? answer.map(String) : [];
    const orderedOptions = question.options ?? [];
    return orderedOptions
      .map((option) => option.value)
      .filter((value) => answerValues.includes(value));
  }

  if (question.type === "number" || question.type === "scale") {
    if (typeof answer === "number") {
      return answer;
    }
    if (typeof answer === "string" && answer.trim() !== "") {
      const parsed = Number(answer);
      return Number.isFinite(parsed) ? parsed : answer;
    }
  }

  return answer;
}

export function serializeTagValue(
  question: ScoutingQuestion,
  answer: ScoutingAnswerValue,
): string | null {
  if (answer === null || answer === undefined) {
    return null;
  }

  const tagConfig = question.tagConfig;
  if (!tagConfig?.enabled || !tagConfig.key.trim()) {
    return null;
  }

  const normalizedAnswer = normalizeAnswerForQuestion(question, answer);

  if (question.type === "multiSelect") {
    const values = Array.isArray(normalizedAnswer)
      ? normalizedAnswer.map(String)
      : [];

    if (tagConfig.conversionMode === "lookupMap") {
      const mappedValues = values.map((value) => {
        const lookup = tagConfig.lookupMap.find((entry) => entry.from === value);
        return lookup?.to ?? value;
      });
      return JSON.stringify(mappedValues);
    }

    return JSON.stringify(values);
  }

  const rawValue = String(normalizedAnswer);
  if (tagConfig.conversionMode === "lookupMap") {
    const lookup = tagConfig.lookupMap.find((entry) => entry.from === rawValue);
    return lookup?.to ?? rawValue;
  }

  return rawValue;
}

export function formatAnswerForDisplay(
  question: ScoutingQuestion,
  answer: ScoutingAnswerValue,
): string {
  if (answer === null || answer === undefined) {
    return "No answer";
  }

  if (Array.isArray(answer)) {
    if (
      question.type === "multiSelect" &&
      question.options &&
      answer.length > 0
    ) {
      return answer
        .map((value) => question.options?.find((option) => option.value === String(value))?.label ?? String(value))
        .join(", ");
    }
    return answer.length > 0 ? answer.join(", ") : "No answer";
  }

  if (
    (question.type === "singleSelect" || question.type === "multiSelect") &&
    question.options
  ) {
    const option = question.options.find((entry) => entry.value === String(answer));
    if (option) {
      return option.label;
    }
  }

  return String(answer);
}

export function compareTagValues(
  left: string | undefined,
  right: string | undefined,
  sortMode: "text" | "numeric",
): number {
  if (!left && !right) {
    return 0;
  }
  if (!left) {
    return 1;
  }
  if (!right) {
    return -1;
  }

  if (sortMode === "numeric") {
    const leftNumber = Number(left);
    const rightNumber = Number(right);
    const leftValid = Number.isFinite(leftNumber);
    const rightValid = Number.isFinite(rightNumber);

    if (!leftValid && !rightValid) {
      return left.localeCompare(right);
    }
    if (!leftValid) {
      return 1;
    }
    if (!rightValid) {
      return -1;
    }

    return leftNumber - rightNumber;
  }

  return left.localeCompare(right, undefined, { numeric: true });
}
