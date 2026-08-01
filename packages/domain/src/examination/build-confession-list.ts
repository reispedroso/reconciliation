export interface ConfessionListCandidate {
  readonly optionCode: string;
  readonly selected: boolean;
  readonly text: string;
  readonly quantity?: string;
  readonly frequency?: string;
}

export interface ConfessionListEntry {
  readonly optionCode: string;
  readonly text: string;
  readonly quantity?: string;
  readonly frequency?: string;
}

export function buildConfessionList(
  candidates: readonly ConfessionListCandidate[],
): readonly ConfessionListEntry[] {
  return candidates.flatMap((candidate) => {
    if (!candidate.selected) {
      return [];
    }

    return [
      {
        optionCode: candidate.optionCode,
        text: candidate.text,
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
