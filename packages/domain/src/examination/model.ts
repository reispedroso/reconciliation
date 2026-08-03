export type SelectionMode = "single" | "multiple";

export type ResponseKind = "affirmation" | "denial";

export interface ExaminationOptionDefinition {
  readonly code: string;
  readonly label: string;
  readonly responseKind: ResponseKind;
  readonly exclusive: boolean;
  readonly summaryText?: string;
}

export interface ExaminationQuestionDefinition {
  readonly stableCode: string;
  readonly prompt: string;
  readonly selectionMode: SelectionMode;
  readonly options: readonly ExaminationOptionDefinition[];
}

export type SelectedOptionCodes = readonly string[];
