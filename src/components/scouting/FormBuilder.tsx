import { useState, type ReactNode } from "react";
import { CSS } from "@dnd-kit/utilities";
import {
  type CollisionDetection,
  DndContext,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
  type DragCancelEvent,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  ArrowDown,
  ChevronDown,
  ChevronRight,
  FileStack,
  GitBranch,
  GripVertical,
  Layers3,
  ListChecks,
  Plus,
  Settings2,
  Tags,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createDefaultOption,
  createDefaultPage,
  createDefaultQuestion,
  createDefaultSection,
  createScoutingId,
  getPageItems,
  getQuestions,
  getQuestionsBeforeOrder,
  reorderFormItems,
  type ScoutingConditionGroup,
  type ScoutingConditionLeaf,
  type ScoutingConditionNode,
  type ScoutingFormItem,
  type ScoutingPage,
  type ScoutingQuestion,
  type ScoutingQuestionType,
  type ScoutingSection,
  type ScoutingTagLookupEntry,
} from "@/lib/scouting";

type Props = {
  name: string;
  description: string;
  teamBindingMode: "preselected" | "selectAtSubmission";
  items: ScoutingFormItem[];
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onTeamBindingModeChange: (value: "preselected" | "selectAtSubmission") => void;
  onItemsChange: (items: ScoutingFormItem[]) => void;
};

const QUESTION_TYPE_OPTIONS: Array<{
  value: ScoutingQuestionType;
  label: string;
}> = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "singleSelect", label: "Single Select" },
  { value: "multiSelect", label: "Multi Select" },
  { value: "scale", label: "Scale" },
];

const OPERATOR_OPTIONS = [
  "equals",
  "notEquals",
  "containsAny",
  "containsAll",
  "gt",
  "gte",
  "lt",
  "lte",
  "isAnswered",
  "isNotAnswered",
] as const;

function ensureGroupRule(
  item: ScoutingQuestion | ScoutingPage | ScoutingSection,
): ScoutingConditionGroup {
  return (
    item.visibilityRule ?? {
      id: createScoutingId("grp"),
      kind: "group",
      mode: "all",
      children: [],
    }
  );
}

function getLookupCandidates(question: ScoutingQuestion): string[] {
  if (question.type === "singleSelect" || question.type === "multiSelect") {
    return (question.options ?? []).map((option) => option.value);
  }

  if (question.type === "scale" && question.scaleConfig) {
    const values: string[] = [];
    for (
      let current = question.scaleConfig.min;
      current <= question.scaleConfig.max;
      current += question.scaleConfig.step
    ) {
      values.push(String(current));
    }
    return values;
  }

  return [];
}

function Disclosure({
  title,
  icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-border bg-muted/20">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        onClick={() => setOpen(!open)}
      >
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        {icon}
        <span>{title}</span>
      </button>
      {open && <div className="border-t border-border px-4 pb-4 pt-3">{children}</div>}
    </div>
  );
}

function LookupMapEditor({
  entries,
  candidates,
  onChange,
}: {
  entries: ScoutingTagLookupEntry[];
  candidates: string[];
  onChange: (entries: ScoutingTagLookupEntry[]) => void;
}) {
  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <div key={entry.id} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
          <select
            className="border-input bg-background flex h-9 rounded-lg border px-3 py-2 text-sm"
            value={entry.from}
            onChange={(event) =>
              onChange(
                entries.map((current) =>
                  current.id === entry.id
                    ? { ...current, from: event.target.value }
                    : current,
                ),
              )
            }
          >
            <option value="">Source value</option>
            {candidates.map((candidate) => (
              <option key={candidate} value={candidate}>
                {candidate}
              </option>
            ))}
          </select>
          <Input
            value={entry.to}
            onChange={(event) =>
              onChange(
                entries.map((current) =>
                  current.id === entry.id
                    ? { ...current, to: event.target.value }
                    : current,
                ),
              )
            }
            placeholder="Stored tag value"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() =>
              onChange(entries.filter((current) => current.id !== entry.id))
            }
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          onChange([
            ...entries,
            { id: createScoutingId("map"), from: candidates[0] ?? "", to: "" },
          ])
        }
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Mapping
      </Button>
    </div>
  );
}

function ConditionEditor({
  node,
  availableQuestions,
  onChange,
  onDelete,
  isRoot = false,
}: {
  node: ScoutingConditionNode;
  availableQuestions: ScoutingQuestion[];
  onChange: (node: ScoutingConditionNode) => void;
  onDelete?: () => void;
  isRoot?: boolean;
}) {
  if (node.kind === "condition") {
    return (
      <div className="grid gap-2 rounded-lg border border-border bg-background p-3 md:grid-cols-[1fr_1fr_1fr_auto]">
        <select
          className="border-input bg-background flex h-9 rounded-lg border px-3 py-2 text-sm"
          value={node.questionId}
          onChange={(event) => onChange({ ...node, questionId: event.target.value })}
        >
          <option value="">Question</option>
          {availableQuestions.map((question) => (
            <option key={question.id} value={question.id}>
              {question.title || "Untitled question"}
            </option>
          ))}
        </select>

        <select
          className="border-input bg-background flex h-9 rounded-lg border px-3 py-2 text-sm"
          value={node.operator}
          onChange={(event) =>
            onChange({
              ...node,
              operator: event.target.value as ScoutingConditionLeaf["operator"],
            })
          }
        >
          {OPERATOR_OPTIONS.map((operator) => (
            <option key={operator} value={operator}>
              {operator}
            </option>
          ))}
        </select>

        {node.operator === "isAnswered" || node.operator === "isNotAnswered" ? (
          <div className="flex h-9 items-center rounded-lg border border-dashed px-3 text-sm text-muted-foreground">
            No value needed
          </div>
        ) : (
          <Input
            value={Array.isArray(node.value) ? node.value.join(",") : String(node.value ?? "")}
            onChange={(event) =>
              onChange({
                ...node,
                value:
                  node.operator === "containsAny" || node.operator === "containsAll"
                    ? event.target.value
                        .split(",")
                        .map((entry) => entry.trim())
                        .filter(Boolean)
                    : event.target.value,
              })
            }
            placeholder="Value"
          />
        )}

        <div className="flex justify-end">
          <Button type="button" variant="ghost" size="icon-sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-muted-foreground" />
          <select
            className="border-input bg-background flex h-9 rounded-lg border px-3 py-2 text-sm"
            value={node.mode}
            onChange={(event) =>
              onChange({
                ...node,
                mode: event.target.value as ScoutingConditionGroup["mode"],
              })
            }
          >
            <option value="all">All conditions</option>
            <option value="any">Any condition</option>
          </select>
        </div>
        {isRoot ? null : (
          <Button type="button" variant="ghost" size="icon-sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {node.children.map((child) => (
          <ConditionEditor
            key={child.id}
            node={child}
            availableQuestions={availableQuestions}
            onChange={(nextChild) =>
              onChange({
                ...node,
                children: node.children.map((current) =>
                  current.id === child.id ? nextChild : current,
                ),
              })
            }
            onDelete={() =>
              onChange({
                ...node,
                children: node.children.filter((current) => current.id !== child.id),
              })
            }
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            onChange({
              ...node,
              children: [
                ...node.children,
                {
                  id: createScoutingId("cond"),
                  kind: "condition",
                  questionId: availableQuestions[0]?.id ?? "",
                  operator: "equals",
                  value: "",
                },
              ],
            })
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Condition
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            onChange({
              ...node,
              children: [
                ...node.children,
                {
                  id: createScoutingId("grp"),
                  kind: "group",
                  mode: "all",
                  children: [],
                },
              ],
            })
          }
        >
          <GitBranch className="mr-2 h-4 w-4" />
          Add Group
        </Button>
      </div>
    </div>
  );
}

function VisibilityEditor({
  item,
  availableQuestions,
  onChange,
}: {
  item: ScoutingQuestion | ScoutingPage | ScoutingSection;
  availableQuestions: ScoutingQuestion[];
  onChange: (item: ScoutingQuestion | ScoutingPage | ScoutingSection) => void;
}) {
  return (
    <div className="space-y-3">
      {availableQuestions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Add earlier questions before configuring visibility rules.
        </p>
      ) : item.visibilityRule ? (
        <>
          <ConditionEditor
            node={ensureGroupRule(item)}
            availableQuestions={availableQuestions}
            isRoot
            onChange={(nextRule) =>
              onChange({
                ...item,
                visibilityRule: nextRule as ScoutingConditionGroup,
              })
            }
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange({ ...item, visibilityRule: null })}
          >
            Clear Visibility Rule
          </Button>
        </>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            onChange({
              ...item,
              visibilityRule: {
                id: createScoutingId("grp"),
                kind: "group",
                mode: "all",
                children: [],
              },
            })
          }
        >
          <ArrowDown className="mr-2 h-4 w-4" />
          Add Visibility Rule
        </Button>
      )}
    </div>
  );
}

function SortableSectionGroupCard({
  section,
  questionCount,
  availableQuestions,
  onChange,
  onDelete,
  children,
}: {
  section: ScoutingSection;
  questionCount: number;
  availableQuestions: ScoutingQuestion[];
  onChange: (section: ScoutingSection) => void;
  onDelete: () => void;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: section.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className="rounded-xl border-2 border-blue-200 bg-blue-50/40 dark:border-blue-900 dark:bg-blue-950/20"
    >
      <div className="flex items-center justify-between border-b border-blue-200 px-4 py-3 dark:border-blue-900">
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" size="icon-sm" {...attributes} {...listeners}>
            <GripVertical className="h-4 w-4" />
          </Button>
          <Layers3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-semibold text-foreground">
            {section.title || "Untitled section"}
          </span>
          <Badge variant="secondary" className="rounded-full text-xs">
            {questionCount} question{questionCount === 1 ? "" : "s"}
          </Badge>
        </div>
        <Button type="button" variant="ghost" size="icon-sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Section Title
            </label>
            <Input
              value={section.title}
              onChange={(event) => onChange({ ...section, title: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Description
            </label>
            <Input
              value={section.description}
              onChange={(event) => onChange({ ...section, description: event.target.value })}
            />
          </div>
        </div>

        <Disclosure
          title="Conditional Visibility"
          icon={<GitBranch className="h-3.5 w-3.5" />}
        >
          <VisibilityEditor
            item={section}
            availableQuestions={availableQuestions}
            onChange={(nextItem) => onChange(nextItem as ScoutingSection)}
          />
        </Disclosure>

        <div className="space-y-3 pl-4 border-l-2 border-blue-200 dark:border-blue-900">
          {children}
        </div>
      </div>
    </div>
  );
}

function SortableQuestionCard({
  question,
  parentLabel: _parentLabel,
  availableQuestions,
  displayIndex,
  onChange,
  onDelete,
}: {
  question: ScoutingQuestion;
  parentLabel: string;
  availableQuestions: ScoutingQuestion[];
  displayIndex: number;
  onChange: (question: ScoutingQuestion) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: question.id,
  });

  const lookupCandidates = getLookupCandidates(question);
  const tagConfig = question.tagConfig ?? {
    enabled: false,
    key: "",
    conversionMode: "raw" as const,
    lookupMap: [],
    multiValueFormat: "jsonArray" as const,
  };

  const typeLabel = QUESTION_TYPE_OPTIONS.find((option) => option.value === question.type)?.label;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className="rounded-xl border border-border bg-card shadow-sm"
    >
      {/* Question header bar */}
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" size="icon-sm" {...attributes} {...listeners}>
            <GripVertical className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
              {displayIndex}
            </span>
            <span className="text-sm font-semibold">
              {question.title || "Untitled question"}
            </span>
          </div>
          <Badge variant="outline" className="rounded-full text-xs">
            {typeLabel}
          </Badge>
          {question.required && (
            <Badge variant="destructive" className="rounded-full text-xs">
              Required
            </Badge>
          )}
        </div>
        <Button type="button" variant="ghost" size="icon-sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Question body */}
      <div className="space-y-4 p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Question Title
            </label>
            <Input
              value={question.title}
              onChange={(event) => onChange({ ...question, title: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Type
            </label>
            <select
              className="border-input bg-background flex h-9 rounded-lg border px-3 py-2 text-sm"
              value={question.type}
              onChange={(event) => {
                const nextType = event.target.value as ScoutingQuestionType;
                const replacement = createDefaultQuestion(nextType, question.order);
                onChange({
                  ...question,
                  type: nextType,
                  options: replacement.options,
                  scaleConfig: replacement.scaleConfig,
                });
              }}
            >
              {QUESTION_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Required
            </label>
            <label className="flex h-9 items-center gap-2 rounded-lg border border-input px-3 text-sm cursor-pointer hover:bg-muted/50">
              <input
                type="checkbox"
                checked={question.required}
                onChange={(event) => onChange({ ...question, required: event.target.checked })}
                className="accent-primary"
              />
              Yes
            </label>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Description / Instructions
          </label>
          <Textarea
            value={question.description}
            onChange={(event) => onChange({ ...question, description: event.target.value })}
            rows={2}
            placeholder="Optional help text shown to scouts"
          />
        </div>

        {/* Options editor for select types */}
        {question.type === "singleSelect" || question.type === "multiSelect" ? (
          <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Options
              </h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  onChange({
                    ...question,
                    options: [
                      ...(question.options ?? []),
                      createDefaultOption((question.options ?? []).length),
                    ],
                  })
                }
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add
              </Button>
            </div>
            {(question.options ?? []).map((option) => (
              <div key={option.id} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                <Input
                  value={option.label}
                  placeholder="Label"
                  onChange={(event) =>
                    onChange({
                      ...question,
                      options: (question.options ?? []).map((current) =>
                        current.id === option.id
                          ? { ...current, label: event.target.value }
                          : current,
                      ),
                    })
                  }
                />
                <Input
                  value={option.value}
                  placeholder="Value"
                  onChange={(event) =>
                    onChange({
                      ...question,
                      options: (question.options ?? []).map((current) =>
                        current.id === option.id
                          ? { ...current, value: event.target.value }
                          : current,
                      ),
                    })
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() =>
                    onChange({
                      ...question,
                      options: (question.options ?? []).filter(
                        (current) => current.id !== option.id,
                      ),
                    })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : null}

        {/* Scale settings */}
        {question.type === "scale" && question.scaleConfig ? (
          <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Scale Settings
            </h4>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Min</label>
                <Input
                  type="number"
                  value={question.scaleConfig.min}
                  onChange={(event) =>
                    onChange({
                      ...question,
                      scaleConfig: { ...question.scaleConfig!, min: Number(event.target.value) },
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Max</label>
                <Input
                  type="number"
                  value={question.scaleConfig.max}
                  onChange={(event) =>
                    onChange({
                      ...question,
                      scaleConfig: { ...question.scaleConfig!, max: Number(event.target.value) },
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Step</label>
                <Input
                  type="number"
                  value={question.scaleConfig.step}
                  onChange={(event) =>
                    onChange({
                      ...question,
                      scaleConfig: {
                        ...question.scaleConfig!,
                        step: Number(event.target.value) || 1,
                      },
                    })
                  }
                />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Min Label</label>
                <Input
                  value={question.scaleConfig.minLabel}
                  onChange={(event) =>
                    onChange({
                      ...question,
                      scaleConfig: { ...question.scaleConfig!, minLabel: event.target.value },
                    })
                  }
                  placeholder="e.g. Low"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Max Label</label>
                <Input
                  value={question.scaleConfig.maxLabel}
                  onChange={(event) =>
                    onChange({
                      ...question,
                      scaleConfig: { ...question.scaleConfig!, maxLabel: event.target.value },
                    })
                  }
                  placeholder="e.g. High"
                />
              </div>
            </div>
          </div>
        ) : null}

        {/* Collapsible advanced sections */}
        <Disclosure
          title="Conditional Visibility"
          icon={<GitBranch className="h-3.5 w-3.5" />}
        >
          <VisibilityEditor
            item={question}
            availableQuestions={availableQuestions}
            onChange={(nextItem) => onChange(nextItem as ScoutingQuestion)}
          />
        </Disclosure>

        <Disclosure
          title="Tag Writing"
          icon={<Tags className="h-3.5 w-3.5" />}
        >
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={tagConfig.enabled}
                className="accent-primary"
                onChange={(event) =>
                  onChange({
                    ...question,
                    tagConfig: { ...tagConfig, enabled: event.target.checked },
                  })
                }
              />
              Writes to team tag
            </label>

            {tagConfig.enabled ? (
              <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Tag Key</label>
                  <Input
                    value={tagConfig.key}
                    onChange={(event) =>
                      onChange({
                        ...question,
                        tagConfig: { ...tagConfig, key: event.target.value },
                      })
                    }
                    placeholder="e.g. drivetrain_type"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Conversion Mode</label>
                  <select
                    className="border-input bg-background flex h-9 rounded-lg border px-3 py-2 text-sm"
                    value={lookupCandidates.length === 0 ? "raw" : tagConfig.conversionMode}
                    onChange={(event) =>
                      onChange({
                        ...question,
                        tagConfig: {
                          ...tagConfig,
                          conversionMode: event.target.value as "raw" | "lookupMap",
                        },
                      })
                    }
                  >
                    <option value="raw">Raw answer</option>
                    {lookupCandidates.length > 0 ? (
                      <option value="lookupMap">Lookup map</option>
                    ) : null}
                  </select>
                </div>

                {tagConfig.conversionMode === "lookupMap" && lookupCandidates.length > 0 ? (
                  <LookupMapEditor
                    entries={tagConfig.lookupMap}
                    candidates={lookupCandidates}
                    onChange={(lookupMap) =>
                      onChange({
                        ...question,
                        tagConfig: { ...tagConfig, lookupMap },
                      })
                    }
                  />
                ) : null}
              </div>
            ) : null}
          </div>
        </Disclosure>
      </div>
    </div>
  );
}

function getPageItemIds(
  items: ScoutingFormItem[],
  pageEntry: ReturnType<typeof getPageItems>[number],
): string[] {
  const ids: string[] = [];
  for (const entry of pageEntry.items) {
    if (entry.section) {
      ids.push(entry.section.id);
    }
    for (const question of entry.questions) {
      ids.push(question.id);
    }
  }
  return ids;
}

function getInsertOrder(
  items: ScoutingFormItem[],
  pageItems: ReturnType<typeof getPageItems>,
  pageIndex: number,
): number {
  if (pageIndex + 1 < pageItems.length) {
    const nextEntry = pageItems[pageIndex + 1];
    if (nextEntry.page) {
      return nextEntry.page.order;
    }
  }
  return items.length;
}

function insertItemAtOrder(
  items: ScoutingFormItem[],
  newItem: ScoutingFormItem,
  atOrder: number,
): ScoutingFormItem[] {
  const shifted = items.map((item) =>
    item.order >= atOrder ? { ...item, order: item.order + 1 } : item,
  );
  return [...shifted, { ...newItem, order: atOrder }].sort((a, b) => a.order - b.order);
}

type DropIndicatorState = {
  activeId: string | null;
  overId: string | null;
  insertPosition: "before" | "after" | null;
};

type DropTarget =
  | { kind: "item"; id: string }
  | { kind: "inside-section"; sectionId: string; position: "start" | "end" }
  | { kind: "before-section"; sectionId: string }
  | { kind: "after-section"; sectionId: string };

function createInsideSectionDropId(
  sectionId: string,
  position: "start" | "end" = "end",
): string {
  return `inside-section:${sectionId}:${position}`;
}

function createAfterSectionDropId(sectionId: string): string {
  return `after-section:${sectionId}`;
}

function createBeforeSectionDropId(sectionId: string): string {
  return `before-section:${sectionId}`;
}

function parseDropTarget(id: string): DropTarget {
  if (id.startsWith("inside-section:")) {
    const [, rawSectionId = "", rawPosition = "end"] = id.split(":");
    return {
      kind: "inside-section",
      sectionId: rawSectionId,
      position: rawPosition === "start" ? "start" : "end",
    };
  }
  if (id.startsWith("after-section:")) {
    return { kind: "after-section", sectionId: id.slice("after-section:".length) };
  }
  if (id.startsWith("before-section:")) {
    return { kind: "before-section", sectionId: id.slice("before-section:".length) };
  }
  return { kind: "item", id };
}

function buildDropIndicatorState(
  items: ScoutingFormItem[],
  activeId: string | null,
  overId: string | null,
): DropIndicatorState {
  if (!activeId || !overId || activeId === overId) {
    return { activeId, overId, insertPosition: null };
  }

  if (overId.startsWith("inside-section:") || overId.startsWith("after-section:")) {
    return { activeId, overId, insertPosition: null };
  }

  const activeIndex = items.findIndex((item) => item.id === activeId);
  const overIndex = items.findIndex((item) => item.id === overId);
  if (activeIndex < 0 || overIndex < 0) {
    return { activeId, overId, insertPosition: null };
  }

  return {
    activeId,
    overId,
    insertPosition: activeIndex < overIndex ? "after" : "before",
  };
}

function DropPositionOverlay({ label }: { label: string }) {
  return (
    <div className="rounded-lg border-2 border-dashed border-primary/60 bg-primary/5 px-3 py-2 text-xs font-medium text-primary">
      {label}
    </div>
  );
}

function isExplicitDropZoneId(id: string): boolean {
  return (
    id.startsWith("inside-section:") ||
    id.startsWith("after-section:") ||
    id.startsWith("before-section:")
  );
}

const sectionAwareCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  const explicitZones = pointerCollisions.filter((collision) =>
    isExplicitDropZoneId(String(collision.id)),
  );
  if (explicitZones.length > 0) {
    return explicitZones;
  }
  return closestCenter(args);
};

function SectionDropZone({
  id,
  label,
  active,
  forceVisible = false,
}: {
  id: string;
  label: string;
  active: boolean;
  forceVisible?: boolean;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });

  if (!active && !forceVisible) {
    return null;
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-10 rounded-lg border-2 border-dashed px-3 py-2 text-xs font-medium transition-colors",
        isOver
          ? "border-primary/70 bg-primary/10 text-primary"
          : "border-border/70 bg-muted/20 text-muted-foreground",
      )}
    >
      {label}
    </div>
  );
}

function moveItemToIndex(
  items: ScoutingFormItem[],
  activeId: string,
  targetIndex: number,
  updateItem?: (item: ScoutingFormItem) => ScoutingFormItem,
): ScoutingFormItem[] {
  const oldIndex = items.findIndex((item) => item.id === activeId);
  if (oldIndex < 0) {
    return items;
  }

  const activeItem = items[oldIndex];
  const nextItem = updateItem ? updateItem(activeItem) : activeItem;
  const remaining = items.filter((item) => item.id !== activeId);
  const adjustedIndex = Math.max(
    0,
    Math.min(oldIndex < targetIndex ? targetIndex - 1 : targetIndex, remaining.length),
  );
  const reordered = [
    ...remaining.slice(0, adjustedIndex),
    nextItem,
    ...remaining.slice(adjustedIndex),
  ];
  return reorderFormItems(reordered, reordered.map((item) => item.id));
}

export function FormBuilder({
  name,
  description,
  teamBindingMode,
  items,
  onNameChange,
  onDescriptionChange,
  onTeamBindingModeChange,
  onItemsChange,
}: Props) {
  const sensors = useSensors(useSensor(PointerSensor));
  const questionIds = getQuestions(items).map((question) => question.id);
  const pageItems = getPageItems(items);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [dropIndicator, setDropIndicator] = useState<DropIndicatorState>({
    activeId: null,
    overId: null,
    insertPosition: null,
  });

  const clampedIndex = Math.min(activePageIndex, Math.max(pageItems.length - 1, 0));
  const currentPageEntry = pageItems[clampedIndex] ?? null;
  const questionSectionByQuestionId = new Map<string, string | null>();
  const sectionLastItemIdBySectionId = new Map<string, string>();
  if (currentPageEntry) {
    for (const entry of currentPageEntry.items) {
      if (entry.section) {
        sectionLastItemIdBySectionId.set(
          entry.section.id,
          entry.questions[entry.questions.length - 1]?.id ?? entry.section.id,
        );
      }
      for (const question of entry.questions) {
        questionSectionByQuestionId.set(question.id, entry.section?.id ?? null);
      }
    }
  }
  const activeDraggedItem = dropIndicator.activeId
    ? items.find((item) => item.id === dropIndicator.activeId) ?? null
    : null;
  const isDraggingQuestion = activeDraggedItem?.kind === "question";

  const handleDragStart = (event: DragStartEvent) => {
    setDropIndicator({
      activeId: String(event.active.id),
      overId: null,
      insertPosition: null,
    });
  };

  const handleDragOver = (event: DragOverEvent) => {
    setDropIndicator(
      buildDropIndicatorState(
        items,
        String(event.active.id),
        event.over ? String(event.over.id) : null,
      ),
    );
  };

  const clearDropIndicator = (_event?: DragCancelEvent | DragEndEvent) => {
    setDropIndicator({ activeId: null, overId: null, insertPosition: null });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      clearDropIndicator(event);
      return;
    }

    const activeId = String(active.id);
    const activeItem = items.find((item) => item.id === activeId);
    if (!activeItem) {
      clearDropIndicator(event);
      return;
    }

    const overTarget = parseDropTarget(String(over.id));

    if (overTarget.kind === "inside-section") {
      if (activeItem.kind !== "question") {
        clearDropIndicator(event);
        return;
      }

      const anchorId =
        overTarget.position === "start"
          ? overTarget.sectionId
          : (sectionLastItemIdBySectionId.get(overTarget.sectionId) ?? overTarget.sectionId);
      const targetIndex = items.findIndex((item) => item.id === anchorId);
      if (targetIndex < 0) {
        clearDropIndicator(event);
        return;
      }

      onItemsChange(
        moveItemToIndex(items, activeId, targetIndex + 1, (item) =>
          item.kind === "question" ? { ...item, sectionId: overTarget.sectionId } : item,
        ),
      );
      clearDropIndicator(event);
      return;
    }

    if (overTarget.kind === "before-section") {
      if (activeItem.kind !== "question") {
        clearDropIndicator(event);
        return;
      }

      const targetIndex = items.findIndex((item) => item.id === overTarget.sectionId);
      if (targetIndex < 0) {
        clearDropIndicator(event);
        return;
      }

      onItemsChange(
        moveItemToIndex(items, activeId, targetIndex, (item) =>
          item.kind === "question" ? { ...item, sectionId: null } : item,
        ),
      );
      clearDropIndicator(event);
      return;
    }

    if (overTarget.kind === "after-section") {
      if (activeItem.kind !== "question") {
        clearDropIndicator(event);
        return;
      }

      const lastItemId = sectionLastItemIdBySectionId.get(overTarget.sectionId) ?? overTarget.sectionId;
      const targetIndex = items.findIndex((item) => item.id === lastItemId);
      if (targetIndex < 0) {
        clearDropIndicator(event);
        return;
      }

      onItemsChange(
        moveItemToIndex(items, activeId, targetIndex + 1, (item) =>
          item.kind === "question" ? { ...item, sectionId: null } : item,
        ),
      );
      clearDropIndicator(event);
      return;
    }

    const overId = overTarget.id;
    const overItem = items.find((item) => item.id === overId);
    if (!overItem) {
      clearDropIndicator(event);
      return;
    }

    const overIndex = items.findIndex((item) => item.id === overId);
    if (overIndex < 0) {
      clearDropIndicator(event);
      return;
    }

    if (activeItem.kind === "question" && overItem.kind === "section") {
      const targetIndex =
        dropIndicator.insertPosition === "before"
          ? overIndex
          : (items.findIndex(
              (item) =>
                item.id === (sectionLastItemIdBySectionId.get(overItem.id) ?? overItem.id),
            ) + 1);

      onItemsChange(
        moveItemToIndex(items, activeId, targetIndex, (item) =>
          item.kind === "question"
            ? {
                ...item,
                sectionId: dropIndicator.insertPosition === "before" ? null : overItem.id,
              }
            : item,
        ),
      );
      clearDropIndicator(event);
      return;
    }

    if (activeItem.kind === "section" && overItem.kind === "question") {
      const targetSectionId = questionSectionByQuestionId.get(overItem.id) ?? null;
      const targetIndex =
        targetSectionId && dropIndicator.insertPosition === "after"
          ? items.findIndex(
              (item) =>
                item.id === (sectionLastItemIdBySectionId.get(targetSectionId) ?? targetSectionId),
            ) + 1
          : overIndex;

      onItemsChange(moveItemToIndex(items, activeId, targetIndex));
      clearDropIndicator(event);
      return;
    }

    const targetIndex = overIndex + (dropIndicator.insertPosition === "after" ? 1 : 0);
    onItemsChange(
      moveItemToIndex(items, activeId, targetIndex, (item) => {
        if (item.kind !== "question") {
          return item;
        }
        return {
          ...item,
          sectionId:
            overItem.kind === "question"
              ? (questionSectionByQuestionId.get(overItem.id) ?? null)
              : null,
        };
      }),
    );
    clearDropIndicator(event);
  };

  const handleAddPage = () => {
    onItemsChange([...items, createDefaultPage(items.length)]);
    setActivePageIndex(pageItems.length);
  };

  const handleDeletePage = () => {
    if (!currentPageEntry?.page) return;
    const idsToRemove = new Set<string>();
    idsToRemove.add(currentPageEntry.page.id);
    for (const entry of currentPageEntry.items) {
      if (entry.section) idsToRemove.add(entry.section.id);
      for (const question of entry.questions) idsToRemove.add(question.id);
    }
    const remaining = items
      .filter((item) => !idsToRemove.has(item.id))
      .map((item, index) => ({ ...item, order: index }));
    onItemsChange(remaining);
    setActivePageIndex(Math.max(0, clampedIndex - 1));
  };

  const handleAddToCurrentPage = (newItem: ScoutingFormItem) => {
    if (pageItems.length === 0) {
      onItemsChange([...items, newItem]);
      return;
    }
    const order = getInsertOrder(items, pageItems, clampedIndex);
    onItemsChange(insertItemAtOrder(items, newItem, order));
  };

  const currentPageItemIds = currentPageEntry
    ? getPageItemIds(items, currentPageEntry)
    : [];

  return (
    <div className="space-y-6">
      {/* Form settings */}
      <Card className="border-border shadow-sm">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Form Settings</CardTitle>
          </div>
          <CardDescription>
            Configure the scout-facing title, intro, and how team selection works.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Form Name
            </label>
            <Input value={name} onChange={(event) => onNameChange(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Team Binding
            </label>
            <select
              className="border-input bg-background flex h-9 w-full rounded-lg border px-3 py-2 text-sm"
              value={teamBindingMode}
              onChange={(event) =>
                onTeamBindingModeChange(
                  event.target.value as "preselected" | "selectAtSubmission",
                )
              }
            >
              <option value="selectAtSubmission">Scout chooses the team</option>
              <option value="preselected">Admin preselects the team</option>
            </select>
          </div>
          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(event) => onDescriptionChange(event.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Builder */}
      <Card className="border-border shadow-sm overflow-hidden">
        <CardHeader className="space-y-2 pb-0">
          <div className="flex items-center gap-2">
            <FileStack className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Pages & Questions</CardTitle>
          </div>
          <CardDescription>
            Build the scout experience page by page. Switch tabs to edit each page's
            content.
          </CardDescription>
        </CardHeader>

        {/* Page tab bar */}
        <div className="border-b border-border px-6 pt-4">
          <div className="-mb-px flex items-end gap-1 overflow-x-auto">
            {pageItems.map((entry, i) => {
              const pageTitle = entry.page?.title || (i === 0 && !entry.page ? "Intro" : `Page ${i + 1}`);
              const qCount = entry.items.reduce(
                (count, sectionEntry) => count + sectionEntry.questions.length,
                0,
              );
              return (
                <button
                  key={entry.page?.id ?? `implicit-${i}`}
                  type="button"
                  onClick={() => setActivePageIndex(i)}
                  className={cn(
                    "flex items-center gap-2 whitespace-nowrap rounded-t-lg border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                    clampedIndex === i
                      ? "border-primary bg-background text-primary"
                      : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
                  )}
                >
                  {!entry.page && (
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  )}
                  {pageTitle}
                  <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
                    {qCount}
                  </span>
                </button>
              );
            })}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAddPage}
              className="mb-0.5 ml-1 shrink-0"
            >
              <Plus className="mr-1 h-4 w-4" />
              New Page
            </Button>
          </div>
        </div>

        {/* Active page content */}
        <CardContent className="pt-6">
          {pageItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20 py-16">
              <ListChecks className="h-10 w-10 text-muted-foreground/60" />
              <p className="mt-4 text-base font-semibold">No pages yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first page to start building the scouting form.
              </p>
              <Button
                type="button"
                className="mt-4"
                onClick={handleAddPage}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create First Page
              </Button>
            </div>
          ) : currentPageEntry ? (
            <div className="space-y-6">
              {/* Page settings (only for explicit pages) */}
              {currentPageEntry.page && (
                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileStack className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-sm font-semibold">Page Settings</h3>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={handleDeletePage}
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                      Delete Page
                    </Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Page Title
                      </label>
                      <Input
                        value={currentPageEntry.page.title}
                        onChange={(event) =>
                          onItemsChange(
                            items.map((item) =>
                              item.id === currentPageEntry.page!.id
                                ? { ...item, title: event.target.value }
                                : item,
                            ),
                          )
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Continue Button Label
                      </label>
                      <Input
                        value={currentPageEntry.page.continueLabel ?? "Continue"}
                        onChange={(event) =>
                          onItemsChange(
                            items.map((item) =>
                              item.id === currentPageEntry.page!.id
                                ? { ...item, continueLabel: event.target.value }
                                : item,
                            ),
                          )
                        }
                        placeholder="Continue"
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Page Description
                      </label>
                      <Textarea
                        value={currentPageEntry.page.description}
                        onChange={(event) =>
                          onItemsChange(
                            items.map((item) =>
                              item.id === currentPageEntry.page!.id
                                ? { ...item, description: event.target.value }
                                : item,
                            ),
                          )
                        }
                        rows={2}
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <Disclosure
                      title="Page Visibility Rules"
                      icon={<GitBranch className="h-3.5 w-3.5" />}
                    >
                      <VisibilityEditor
                        item={currentPageEntry.page}
                        availableQuestions={getQuestionsBeforeOrder(
                          items,
                          currentPageEntry.page.order,
                        )}
                        onChange={(nextItem) =>
                          onItemsChange(
                            items.map((item) =>
                              item.id === currentPageEntry.page!.id
                                ? (nextItem as ScoutingPage)
                                : item,
                            ),
                          )
                        }
                      />
                    </Disclosure>
                  </div>
                </div>
              )}

              {/* Implicit page notice */}
              {!currentPageEntry.page && (
                <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3 dark:border-amber-900 dark:bg-amber-950/20">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Intro page</strong> &mdash; Questions
                    placed before the first explicit page. Add a page above to organize your form.
                  </p>
                </div>
              )}

              {/* Page content: sections and questions */}
              {currentPageEntry.items.length === 0 ||
              currentPageEntry.items.every((e) => e.questions.length === 0 && !e.section) ? (
                <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-border bg-muted/10 py-12">
                  <ListChecks className="h-8 w-8 text-muted-foreground/50" />
                  <p className="mt-3 text-sm font-medium">This page is empty</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Add sections or questions below to build this page.
                  </p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={sectionAwareCollisionDetection}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragCancel={clearDropIndicator}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={currentPageItemIds}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-4">
                      {dropIndicator.activeId ? (
                        <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 px-3 py-2 text-xs text-primary/90">
                          Dotted zones show valid drop positions. Drag onto a section to place a
                          question inside it, or use the outside zone to move it back to page
                          level.
                        </div>
                      ) : null}
                      {currentPageEntry.items.map((entry, entryIndex) => {
                        if (entry.section) {
                          const sectionAvailableQuestions = getQuestionsBeforeOrder(
                            items,
                            entry.section.order,
                          );
                          return (
                            <div key={entry.section.id} className="space-y-2">
                              <SectionDropZone
                                id={createBeforeSectionDropId(entry.section.id)}
                                label="Drop outside before this section"
                                active={isDraggingQuestion}
                              />
                              {!isDraggingQuestion &&
                              dropIndicator.overId === entry.section.id &&
                              dropIndicator.insertPosition === "before" ? (
                                <DropPositionOverlay label="Drop here" />
                              ) : null}
                              <SortableSectionGroupCard
                                section={entry.section}
                                questionCount={entry.questions.length}
                                availableQuestions={sectionAvailableQuestions}
                                onChange={(nextSection) =>
                                  onItemsChange(
                                    items.map((current) =>
                                      current.id === entry.section!.id ? nextSection : current,
                                    ),
                                  )
                                }
                                onDelete={() =>
                                  onItemsChange(
                                    items
                                      .filter((current) => current.id !== entry.section!.id)
                                      .map((current, index) => ({ ...current, order: index })),
                                  )
                                }
                              >
                                {entry.questions.length === 0 ? (
                                  <SectionDropZone
                                    id={createInsideSectionDropId(entry.section.id, "start")}
                                    label="Drop question into this section"
                                    active={isDraggingQuestion}
                                    forceVisible
                                  />
                                ) : (
                                  <>
                                    <SectionDropZone
                                      id={createInsideSectionDropId(entry.section.id, "start")}
                                      label="Drop at start of this section"
                                      active={isDraggingQuestion}
                                    />
                                    {entry.questions.map((question) => (
                                      <div key={question.id} className="space-y-2">
                                        {dropIndicator.overId === question.id &&
                                        dropIndicator.insertPosition === "before" ? (
                                          <DropPositionOverlay label="Drop here" />
                                        ) : null}
                                        <SortableQuestionCard
                                          question={question}
                                          parentLabel={entry.section?.title || "this section"}
                                          availableQuestions={getQuestionsBeforeOrder(
                                            items,
                                            question.order,
                                          )}
                                          displayIndex={questionIds.indexOf(question.id) + 1}
                                          onChange={(nextQuestion) =>
                                            onItemsChange(
                                              items.map((current) =>
                                                current.id === question.id ? nextQuestion : current,
                                              ),
                                            )
                                          }
                                          onDelete={() =>
                                            onItemsChange(
                                              items
                                                .filter((current) => current.id !== question.id)
                                                .map((current, index) => ({
                                                  ...current,
                                                  order: index,
                                                })),
                                            )
                                          }
                                        />
                                        {dropIndicator.overId === question.id &&
                                        dropIndicator.insertPosition === "after" ? (
                                          <DropPositionOverlay label="Drop here" />
                                        ) : null}
                                      </div>
                                    ))}
                                    <SectionDropZone
                                      id={createInsideSectionDropId(entry.section.id, "end")}
                                      label="Drop at end of this section"
                                      active={isDraggingQuestion}
                                    />
                                  </>
                                )}
                              </SortableSectionGroupCard>
                              <SectionDropZone
                                id={createAfterSectionDropId(entry.section.id)}
                                label="Drop outside this section"
                                active={isDraggingQuestion}
                              />
                              {!isDraggingQuestion &&
                              dropIndicator.overId === entry.section.id &&
                              dropIndicator.insertPosition === "after" ? (
                                <DropPositionOverlay label="Drop here" />
                              ) : null}
                            </div>
                          );
                        }

                        if (entry.questions.length === 0) return null;

                        return (
                          <div key={`inline-${clampedIndex}-${entryIndex}`} className="space-y-4">
                            {entry.questions.map((question) => (
                              <div key={question.id} className="space-y-2">
                                {dropIndicator.overId === question.id &&
                                dropIndicator.insertPosition === "before" ? (
                                  <DropPositionOverlay label="Drop here" />
                                ) : null}
                                <SortableQuestionCard
                                  question={question}
                                  parentLabel={currentPageEntry.page?.title || "this page"}
                                  availableQuestions={getQuestionsBeforeOrder(
                                    items,
                                    question.order,
                                  )}
                                  displayIndex={questionIds.indexOf(question.id) + 1}
                                  onChange={(nextQuestion) =>
                                    onItemsChange(
                                      items.map((current) =>
                                        current.id === question.id ? nextQuestion : current,
                                      ),
                                    )
                                  }
                                  onDelete={() =>
                                    onItemsChange(
                                      items
                                        .filter((current) => current.id !== question.id)
                                        .map((current, index) => ({
                                          ...current,
                                          order: index,
                                        })),
                                    )
                                  }
                                />
                                {dropIndicator.overId === question.id &&
                                dropIndicator.insertPosition === "after" ? (
                                  <DropPositionOverlay label="Drop here" />
                                ) : null}
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
              )}

              {/* Add controls for this page */}
              <div className="rounded-xl border border-dashed border-border bg-muted/10 p-4">
                <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Add to this page
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleAddToCurrentPage(
                        createDefaultSection(getInsertOrder(items, pageItems, clampedIndex)),
                      )
                    }
                  >
                    <Layers3 className="mr-1.5 h-4 w-4" />
                    Section
                  </Button>
                  {QUESTION_TYPE_OPTIONS.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleAddToCurrentPage(
                          createDefaultQuestion(
                            option.value,
                            getInsertOrder(items, pageItems, clampedIndex),
                          ),
                        )
                      }
                    >
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
