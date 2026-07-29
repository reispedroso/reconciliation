export type ObjectiveMatterStatus =
  | "pending"
  | "not_established"
  | "grave_matter";

export type SelfReportedCondition = "unanswered" | "yes" | "no" | "unsure";

export interface AssessmentInput {
  readonly conductConfirmed: boolean;
  readonly objectiveMatter: ObjectiveMatterStatus;
  readonly fullKnowledge: SelfReportedCondition;
  readonly deliberateConsent: SelfReportedCondition;
}

export type AssessmentClassification =
  | "not_selected"
  | "objective_conditions_pending"
  | "subjective_conditions_pending"
  | "not_established_as_mortal"
  | "mortal_sin";

export interface AssessmentResult {
  readonly classification: AssessmentClassification;
  readonly includeInMainSummary: boolean;
}

export function evaluateItem(input: AssessmentInput): AssessmentResult {
  if (!input.conductConfirmed) {
    return {
      classification: "not_selected",
      includeInMainSummary: false,
    };
  }

  if (input.objectiveMatter === "pending") {
    return {
      classification: "objective_conditions_pending",
      includeInMainSummary: false,
    };
  }

  if (input.objectiveMatter === "not_established") {
    return {
      classification: "not_established_as_mortal",
      includeInMainSummary: false,
    };
  }

  if (input.fullKnowledge === "no" || input.deliberateConsent === "no") {
    return {
      classification: "not_established_as_mortal",
      includeInMainSummary: false,
    };
  }

  if (
    input.fullKnowledge === "yes" &&
    input.deliberateConsent === "yes"
  ) {
    return {
      classification: "mortal_sin",
      includeInMainSummary: true,
    };
  }

  return {
    classification: "subjective_conditions_pending",
    includeInMainSummary: false,
  };
}
