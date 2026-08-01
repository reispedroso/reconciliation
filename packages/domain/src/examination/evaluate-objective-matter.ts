import type {
  ObjectiveMatterStatus,
  SelfReportedCondition,
} from "./evaluate-item.js";

export interface AnswerConditionDefinition {
  readonly code: string;
  readonly requiredAnswer: "yes" | "no";
}

export type ObjectiveMatterRule =
  | { readonly classification: "always_grave" }
  | {
      readonly classification: "grave_when_conditions_met";
      readonly operator: "all" | "any";
      readonly conditions: readonly AnswerConditionDefinition[];
    };

export type ConditionAnswers = Readonly<
  Record<string, SelfReportedCondition | undefined>
>;

function answerMatches(
  answer: SelfReportedCondition | undefined,
  requiredAnswer: "yes" | "no",
): boolean {
  return answer === requiredAnswer;
}

export function evaluateObjectiveMatter(
  rule: ObjectiveMatterRule,
  answers: ConditionAnswers,
): ObjectiveMatterStatus {
  if (rule.classification === "always_grave") {
    return "grave_matter";
  }

  if (rule.conditions.length === 0) {
    throw new Error("A conditional objective matter rule requires conditions.");
  }

  if (rule.operator === "any") {
    if (
      rule.conditions.some(({ code, requiredAnswer }) =>
        answerMatches(answers[code], requiredAnswer),
      )
    ) {
      return "grave_matter";
    }

    if (
      rule.conditions.some(({ code }) => {
        const answer = answers[code];
        return answer === undefined || answer === "unanswered";
      })
    ) {
      return "pending";
    }

    return "not_established";
  }

  if (
    rule.conditions.some(({ code, requiredAnswer }) => {
      const answer = answers[code];
      return (
        answer === "unsure" ||
        (answer !== undefined &&
          answer !== "unanswered" &&
          !answerMatches(answer, requiredAnswer))
      );
    })
  ) {
    return "not_established";
  }

  if (
    rule.conditions.some(({ code }) => {
      const answer = answers[code];
      return answer === undefined || answer === "unanswered";
    })
  ) {
    return "pending";
  }

  return "grave_matter";
}

export type ConductConfirmationStatus =
  | "pending"
  | "not_confirmed"
  | "confirmed";

export function evaluateConductConfirmation(
  prompts: readonly AnswerConditionDefinition[],
  answers: ConditionAnswers,
): ConductConfirmationStatus {
  if (prompts.length === 0) {
    return "confirmed";
  }

  if (
    prompts.some(({ code, requiredAnswer }) => {
      const answer = answers[code];
      return (
        answer === "unsure" ||
        (answer !== undefined &&
          answer !== "unanswered" &&
          !answerMatches(answer, requiredAnswer))
      );
    })
  ) {
    return "not_confirmed";
  }

  if (
    prompts.some(({ code }) => {
      const answer = answers[code];
      return answer === undefined || answer === "unanswered";
    })
  ) {
    return "pending";
  }

  return "confirmed";
}

