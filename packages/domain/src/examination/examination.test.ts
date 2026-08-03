import { describe, expect, it } from "vitest";

import { buildConfessionList } from "./build-confession-list.js";
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
      summaryText: "Pratiquei a primeira conduta.",
    },
    {
      code: "affirmative-two",
      label: "Pratiquei a segunda conduta.",
      responseKind: "affirmation",
      exclusive: false,
      summaryText: "Pratiquei a segunda conduta.",
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
