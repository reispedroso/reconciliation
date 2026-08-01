import { describe, expect, it } from "vitest";

import { buildConfessionList } from "./build-confession-list.js";
import { evaluateItem } from "./evaluate-item.js";
import type { ExaminationQuestionDefinition } from "./model.js";
import { isOptionDisabled, selectOption } from "./select-option.js";

const syntheticQuestion = {
  stableCode: "synthetic-grave-matter-question",
  prompt: "Pratiquei alguma destas condutas?",
  selectionMode: "multiple",
  options: [
    {
      code: "affirmative-one",
      label: "Pratiquei a primeira conduta.",
      responseKind: "affirmation",
      exclusive: false,
      summary: { text: "Pratiquei a primeira conduta." },
    },
    {
      code: "affirmative-two",
      label: "Pratiquei a segunda conduta.",
      responseKind: "affirmation",
      exclusive: false,
      summary: { text: "Pratiquei a segunda conduta." },
    },
    {
      code: "none-of-the-above",
      label: "Não pratiquei nenhuma das condutas acima.",
      responseKind: "denial",
      exclusive: true,
    },
  ],
} satisfies ExaminationQuestionDefinition;

describe("examination selection", () => {
  it("allows multiple affirmative options", () => {
    const firstSelection = selectOption(
      syntheticQuestion,
      [],
      "affirmative-one",
    );
    const secondSelection = selectOption(
      syntheticQuestion,
      firstSelection,
      "affirmative-two",
    );

    expect(secondSelection).toEqual(["affirmative-one", "affirmative-two"]);
  });

  it("clears affirmatives and blocks them while the negative option is selected", () => {
    const negativeSelection = selectOption(
      syntheticQuestion,
      ["affirmative-one", "affirmative-two"],
      "none-of-the-above",
    );

    expect(negativeSelection).toEqual(["none-of-the-above"]);
    expect(
      isOptionDisabled(
        syntheticQuestion,
        negativeSelection,
        "affirmative-one",
      ),
    ).toBe(true);
    expect(
      selectOption(
        syntheticQuestion,
        negativeSelection,
        "affirmative-one",
      ),
    ).toEqual(["none-of-the-above"]);

    const clearedSelection = selectOption(
      syntheticQuestion,
      negativeSelection,
      "none-of-the-above",
    );

    expect(clearedSelection).toEqual([]);
    expect(
      isOptionDisabled(
        syntheticQuestion,
        clearedSelection,
        "affirmative-one",
      ),
    ).toBe(false);
  });
});

describe("item assessment", () => {
  it("does not classify a selection before objective conditions are established", () => {
    expect(
      evaluateItem({
        conductConfirmed: true,
        objectiveMatter: "pending",
        fullKnowledge: "unanswered",
        deliberateConsent: "unanswered",
      }),
    ).toEqual({
      classification: "objective_conditions_pending",
      includeInMainSummary: false,
    });
  });

  it.each([
    { fullKnowledge: "no", deliberateConsent: "yes" },
    { fullKnowledge: "yes", deliberateConsent: "no" },
  ] as const)(
    "does not establish mortal sin when a required condition is absent",
    ({ fullKnowledge, deliberateConsent }) => {
      expect(
        evaluateItem({
          conductConfirmed: true,
          objectiveMatter: "grave_matter",
          fullKnowledge,
          deliberateConsent,
        }),
      ).toEqual({
        classification: "not_established_as_mortal",
        includeInMainSummary: false,
      });
    },
  );

  it("classifies the item when all three conditions are confirmed", () => {
    expect(
      evaluateItem({
        conductConfirmed: true,
        objectiveMatter: "grave_matter",
        fullKnowledge: "yes",
        deliberateConsent: "yes",
      }),
    ).toEqual({
      classification: "mortal_sin",
      includeInMainSummary: true,
    });
  });
});

describe("confession list", () => {
  it("includes only selected affirmative items", () => {
    expect(
      buildConfessionList([
        {
          optionCode: "affirmative-one",
          selected: true,
          text: "Pratiquei a primeira conduta.",
          frequency: "algumas vezes",
        },
        {
          optionCode: "affirmative-two",
          selected: false,
          text: "Pratiquei a segunda conduta.",
        },
      ]),
    ).toEqual([
      {
        optionCode: "affirmative-one",
        text: "Pratiquei a primeira conduta.",
        frequency: "algumas vezes",
      },
    ]);
  });
});
