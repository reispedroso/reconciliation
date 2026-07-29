import type { AssessmentResult } from "./evaluate-item.js";

export interface SummaryCandidate {
  readonly optionCode: string;
  readonly pdfText: string;
  readonly assessment: AssessmentResult;
  readonly quantity?: string;
  readonly frequency?: string;
}

export interface ConfessionSummaryEntry {
  readonly optionCode: string;
  readonly text: string;
  readonly quantity?: string;
  readonly frequency?: string;
}

export function buildConfessionSummary(
  candidates: readonly SummaryCandidate[],
): readonly ConfessionSummaryEntry[] {
  return candidates.flatMap((candidate) => {
    if (
      candidate.assessment.classification !== "mortal_sin" ||
      !candidate.assessment.includeInMainSummary
    ) {
      return [];
    }

    return [
      {
        optionCode: candidate.optionCode,
        text: candidate.pdfText,
        ...(candidate.quantity === undefined
          ? {}
          : { quantity: candidate.quantity }),
        ...(candidate.frequency === undefined
          ? {}
          : { frequency: candidate.frequency }),
      },
    ];
  });
}
