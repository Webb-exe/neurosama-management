import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
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
  getVisiblePages,
  type ScoutingAnswers,
  type ScoutingAnswerValue,
  type ScoutingFormItem,
  type ScoutingQuestion,
  type VisibleScoutingSection,
} from "@/lib/scouting";

type Props = {
  items: ScoutingFormItem[];
  answers: ScoutingAnswers;
  onAnswerChange: (questionId: string, value: string | number | string[]) => void;
  teamBindingMode: "preselected" | "selectAtSubmission";
  selectedTeamNumber: string;
  onSelectedTeamNumberChange: (value: string) => void;
  onSubmit?: () => Promise<void> | void;
  submitting?: boolean;
  submitError?: string | null;
  disabled?: boolean;
};

function isAnswerMissing(answer: ScoutingAnswerValue): boolean {
  return Array.isArray(answer)
    ? answer.length === 0
    : answer === null || answer === undefined || String(answer).trim() === "";
}

function QuestionField({
  question,
  answer,
  onChange,
  disabled = false,
}: {
  question: ScoutingQuestion;
  answer: ScoutingAnswerValue;
  onChange: (value: string | number | string[]) => void;
  disabled?: boolean;
}) {
  switch (question.type) {
    case "text":
      return (
        <Textarea
          value={typeof answer === "string" ? answer : ""}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          rows={4}
          placeholder="Write your response"
          className="min-h-28 rounded-2xl"
        />
      );
    case "number":
      return (
        <Input
          type="number"
          value={typeof answer === "number" || typeof answer === "string" ? answer : ""}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          placeholder="Enter a number"
          className="h-11 rounded-2xl"
        />
      );
    case "singleSelect":
      return (
        <select
          className="border-input bg-background flex h-11 w-full rounded-2xl border px-4 py-2 text-sm"
          value={typeof answer === "string" ? answer : ""}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
        >
          <option value="">Select an option</option>
          {(question.options ?? []).map((option) => (
            <option key={option.id} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    case "multiSelect": {
      const selectedValues = Array.isArray(answer) ? answer : [];
      return (
        <div className="grid gap-3">
          {(question.options ?? []).map((option) => {
            const checked = selectedValues.includes(option.value);
            return (
              <label
                key={option.id}
                className={[
                  "flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition-colors",
                  checked
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border/80 bg-background hover:bg-muted/40",
                ].join(" ")}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={(event) => {
                    const nextValues = event.target.checked
                      ? [...selectedValues, option.value]
                      : selectedValues.filter((value) => value !== option.value);
                    onChange(nextValues);
                  }}
                />
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>
      );
    }
    case "scale": {
      const min = question.scaleConfig?.min ?? 1;
      const max = question.scaleConfig?.max ?? 5;
      const step = question.scaleConfig?.step ?? 1;
      const value =
        typeof answer === "number"
          ? answer
          : typeof answer === "string" && answer !== ""
            ? Number(answer)
            : min;

      const options: number[] = [];
      for (let current = min; current <= max; current += step) {
        options.push(current);
      }

      return (
        <div className="space-y-4">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 text-sm text-muted-foreground">
            <span>{question.scaleConfig?.minLabel ?? "Low"}</span>
            <div className="h-px bg-border" />
            <span>{question.scaleConfig?.maxLabel ?? "High"}</span>
          </div>
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-7">
            {options.map((optionValue) => {
              const checked = value === optionValue;
              return (
                <button
                  key={optionValue}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange(optionValue)}
                  className={[
                    "rounded-2xl border px-3 py-3 text-sm font-medium transition-colors",
                    checked
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border/80 bg-background hover:bg-muted/40",
                  ].join(" ")}
                >
                  {optionValue}
                </button>
              );
            })}
          </div>
        </div>
      );
    }
    default:
      return null;
  }
}

function QuestionBlock({
  question,
  answer,
  onChange,
  disabled,
  invalid = false,
}: {
  question: ScoutingQuestion;
  answer: ScoutingAnswerValue;
  onChange: (value: string | number | string[]) => void;
  disabled: boolean;
  invalid?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-[24px] border bg-background/90 p-5 shadow-xs",
        invalid ? "border-destructive/60" : "border-border/80",
      ].join(" ")}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold leading-tight">
            {question.title}
            {question.required ? <span className="text-primary"> *</span> : null}
          </h3>
          {question.required ? <Badge variant="secondary">Required</Badge> : null}
        </div>
        {question.description ? (
          <p className="text-sm leading-relaxed text-muted-foreground">{question.description}</p>
        ) : null}
      </div>
      <div className="mt-4">
        <QuestionField
          question={question}
          answer={answer}
          onChange={onChange}
          disabled={disabled}
        />
      </div>
      {invalid ? <p className="mt-3 text-sm text-destructive">Required question.</p> : null}
    </div>
  );
}

export function FormRenderer({
  items,
  answers,
  onAnswerChange,
  teamBindingMode,
  selectedTeamNumber,
  onSelectedTeamNumberChange,
  onSubmit,
  submitting = false,
  submitError = null,
  disabled = false,
}: Props) {
  const visiblePages = getVisiblePages(items, answers);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  useEffect(() => {
    setCurrentPageIndex((current) =>
      Math.min(current, Math.max(visiblePages.length - 1, 0)),
    );
  }, [visiblePages.length]);

  const currentPage = visiblePages[currentPageIndex];
  const isLastPage = currentPageIndex === visiblePages.length - 1;
  const missingRequiredQuestionIds = new Set(
    currentPage
      ? currentPage.sections
          .flatMap((section) => section.questions)
          .filter((question) => question.required && isAnswerMissing(answers[question.id]))
          .map((question) => question.id)
      : [],
  );
  const hasPageValidationErrors = missingRequiredQuestionIds.size > 0;

  useEffect(() => {
    setShowValidationErrors(false);
  }, [currentPageIndex]);

  return (
    <div className="space-y-6">
      {currentPage ? (
        <Card className="rounded-[32px] border-border/70 bg-card/95 shadow-sm">
          <CardHeader className="space-y-4 border-b border-border/60 pb-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Page {currentPageIndex + 1}</Badge>
              <Badge variant="secondary">
                {currentPage.questionCount} question
                {currentPage.questionCount === 1 ? "" : "s"}
              </Badge>
            </div>
            {!currentPage.isImplicit && currentPage.title ? (
              <CardTitle className="text-3xl leading-tight">{currentPage.title}</CardTitle>
            ) : (
              <CardTitle className="text-3xl leading-tight">Scout Submission</CardTitle>
            )}
            {currentPage.description ? (
              <CardDescription className="max-w-2xl text-base leading-relaxed">
                {currentPage.description}
              </CardDescription>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            {teamBindingMode === "selectAtSubmission" ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">Team Number</p>
                <Input
                  type="number"
                  placeholder="Enter team number"
                  value={selectedTeamNumber}
                  onChange={(event) => onSelectedTeamNumberChange(event.target.value)}
                  disabled={disabled}
                  className="h-12 rounded-2xl"
                />
              </div>
            ) : null}

            {currentPage.sections.map((section) => (
              <SectionBlock
                key={section.id}
                section={section}
                answers={answers}
                onAnswerChange={onAnswerChange}
                disabled={disabled}
                showValidationErrors={showValidationErrors}
                missingRequiredQuestionIds={missingRequiredQuestionIds}
              />
            ))}

            <div className="space-y-3 border-t border-border/60 pt-6">
              {showValidationErrors && hasPageValidationErrors ? (
                <p className="text-sm text-destructive">
                  Fill all required questions on this page before continuing.
                </p>
              ) : null}
              {isLastPage && submitError ? (
                <p className="text-sm text-destructive">{submitError}</p>
              ) : null}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  disabled={disabled || currentPageIndex === 0}
                  onClick={() => setCurrentPageIndex((current) => Math.max(current - 1, 0))}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
                <div className="text-sm text-muted-foreground">
                  {isLastPage ? "Last page" : "Next page available"}
                </div>
                {isLastPage ? (
                  <Button
                    type="button"
                    disabled={disabled || submitting}
                    onClick={async () => {
                      setShowValidationErrors(true);
                      if (hasPageValidationErrors || !onSubmit) {
                        return;
                      }
                      await onSubmit();
                    }}
                  >
                    {submitting ? "Submitting..." : "Submit Response"}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      setShowValidationErrors(true);
                      if (hasPageValidationErrors) {
                        return;
                      }
                      setCurrentPageIndex((current) =>
                        Math.min(current + 1, visiblePages.length - 1),
                      );
                    }}
                  >
                    {currentPage.continueLabel || "Continue"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-[32px] border-dashed">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            This form does not have any visible questions yet.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SectionBlock({
  section,
  answers,
  onAnswerChange,
  disabled,
  showValidationErrors,
  missingRequiredQuestionIds,
}: {
  section: VisibleScoutingSection;
  answers: ScoutingAnswers;
  onAnswerChange: (questionId: string, value: string | number | string[]) => void;
  disabled: boolean;
  showValidationErrors: boolean;
  missingRequiredQuestionIds: Set<string>;
}) {
  if (section.isImplicit) {
    return (
      <div className="space-y-5">
        {section.questions.map((question) => (
          <QuestionBlock
            key={question.id}
            question={question}
            answer={answers[question.id]}
            onChange={(value) => onAnswerChange(question.id, value)}
            disabled={disabled}
            invalid={showValidationErrors && missingRequiredQuestionIds.has(question.id)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-[28px] border border-border/70 bg-muted/20 p-5">
      <div className="space-y-2 border-b border-border/60 pb-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline">Section</Badge>
          <Badge variant="secondary">
            {section.questions.length} question{section.questions.length === 1 ? "" : "s"}
          </Badge>
        </div>
        <h3 className="text-xl font-semibold leading-tight">{section.title || "Untitled section"}</h3>
        {section.description ? (
          <p className="text-sm leading-relaxed text-muted-foreground">{section.description}</p>
        ) : null}
      </div>
      <div className="mt-5 space-y-5">
        {section.questions.map((question) => (
          <QuestionBlock
            key={question.id}
            question={question}
            answer={answers[question.id]}
            onChange={(value) => onAnswerChange(question.id, value)}
            disabled={disabled}
            invalid={showValidationErrors && missingRequiredQuestionIds.has(question.id)}
          />
        ))}
      </div>
    </div>
  );
}
