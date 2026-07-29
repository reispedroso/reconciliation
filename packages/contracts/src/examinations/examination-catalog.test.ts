import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { examinationCatalogSchema } from "./examination-catalog.js";

const catalogUrl = new URL(
  "../../../../content/editorial/pt-BR/examination-catalog.v2.json",
  import.meta.url,
);
const catalogText = readFileSync(catalogUrl, "utf8");
const catalog = examinationCatalogSchema.parse(JSON.parse(catalogText));

describe("examination catalog contract", () => {
  it("validates the complete normalized catalog", () => {
    const options = catalog.questions.flatMap(({ options }) => options);

    expect(catalog.questions).toHaveLength(9);
    expect(options).toHaveLength(74);
    expect(
      options.filter(({ responseKind }) => responseKind === "affirmation"),
    ).toHaveLength(65);
    expect(
      options.filter(({ responseKind }) => responseKind === "denial"),
    ).toHaveLength(9);
  });

  it("keeps every conditional prompt explicitly pending rule mapping", () => {
    const followUpPrompts = catalog.questions.flatMap(({ options }) =>
      options.flatMap((option) =>
        option.responseKind === "affirmation"
          ? option.followUpPrompts
          : [],
      ),
    );

    expect(followUpPrompts.length).toBeGreaterThan(0);
    expect(
      followUpPrompts.every(
        ({ ruleStatus }) => ruleStatus === "requires_rule_mapping",
      ),
    ).toBe(true);
  });

  it("records the exact source artifact hash", () => {
    expect(catalog.sourceArtifact.sha256).toBe(
      "a00f014aaf06186da4b27a184220834f05e21b8d5109fbe154573dc8c3a10b66",
    );
  });

  it("rejects duplicate option codes inside a question", () => {
    const invalidCatalog = structuredClone(catalog);
    const firstQuestion = invalidCatalog.questions[0];

    if (firstQuestion === undefined || firstQuestion.options.length < 2) {
      throw new Error("Expected a question with at least two options.");
    }

    const firstOption = firstQuestion.options[0];
    const secondOption = firstQuestion.options[1];

    if (firstOption === undefined || secondOption === undefined) {
      throw new Error("Expected two options.");
    }

    secondOption.code = firstOption.code;

    expect(examinationCatalogSchema.safeParse(invalidCatalog).success).toBe(
      false,
    );
  });

  it("rejects references to unknown doctrinal sources", () => {
    const invalidCatalog = structuredClone(catalog);
    const affirmativeOption = invalidCatalog.questions
      .flatMap(({ options }) => options)
      .find(({ responseKind }) => responseKind === "affirmation");

    if (
      affirmativeOption === undefined ||
      affirmativeOption.responseKind !== "affirmation"
    ) {
      throw new Error("Expected an affirmative option.");
    }

    affirmativeOption.doctrinalSourceCodes[0] = "unknown-source";

    expect(examinationCatalogSchema.safeParse(invalidCatalog).success).toBe(
      false,
    );
  });

  it("rejects conditional grave matter without follow-up prompts", () => {
    const invalidCatalog = structuredClone(catalog);
    const conditionalOption = invalidCatalog.questions
      .flatMap(({ options }) => options)
      .find(
        (option) =>
          option.responseKind === "affirmation" &&
          option.objectiveMatter.classification ===
            "grave_when_conditions_met",
      );

    if (
      conditionalOption === undefined ||
      conditionalOption.responseKind !== "affirmation"
    ) {
      throw new Error("Expected a conditional affirmative option.");
    }

    conditionalOption.followUpPrompts = [];

    expect(examinationCatalogSchema.safeParse(invalidCatalog).success).toBe(
      false,
    );
  });
});
