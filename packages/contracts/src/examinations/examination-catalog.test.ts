import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  currentExaminationCatalogQuerySchema,
  draftExaminationCatalogPreviewQuerySchema,
  draftExaminationCatalogPreviewSchema,
  examinationCatalogSchema,
  publishedExaminationCatalogSchema,
} from "./examination-catalog.js";

const catalogUrl = new URL(
  "../../../../content/editorial/pt-BR/examination-catalog.v3.json",
  import.meta.url,
);
const catalogText = readFileSync(catalogUrl, "utf8");
const catalog = examinationCatalogSchema.parse(JSON.parse(catalogText));

describe("examination catalog contract", () => {
  it("validates the complete normalized catalog", () => {
    const options = catalog.questions.flatMap(({ options }) => options);

    expect(catalog.questions).toHaveLength(9);
    expect(options).toHaveLength(76);
    expect(
      options.filter(({ responseKind }) => responseKind === "affirmation"),
    ).toHaveLength(67);
    expect(
      options.filter(({ responseKind }) => responseKind === "denial"),
    ).toHaveLength(9);
  });

  it("validates a public published catalog without seed metadata", () => {
    const {
      editorial: _editorial,
      sourceArtifact: _sourceArtifact,
      ...catalogContent
    } = catalog;
    const publishedCatalog = {
      ...catalogContent,
      catalogVersion: "0.3.0",
      reviewedAt: "2026-07-29T12:00:00.000Z",
      publishedAt: "2026-07-29T13:00:00.000Z",
    };

    expect(
      publishedExaminationCatalogSchema.safeParse(publishedCatalog).success,
    ).toBe(true);
    expect("sourceArtifact" in publishedCatalog).toBe(false);
  });

  it("validates a draft preview without exposing seed metadata", () => {
    const {
      editorial: _editorial,
      sourceArtifact: _sourceArtifact,
      ...catalogContent
    } = catalog;
    const preview = {
      ...catalogContent,
      preview: {
        status: "draft",
        requiresClericalReview: true,
      },
    };

    expect(draftExaminationCatalogPreviewSchema.safeParse(preview).success).toBe(
      true,
    );
    expect("sourceArtifact" in preview).toBe(false);
  });

  it("accepts only the supported public locale", () => {
    expect(
      currentExaminationCatalogQuerySchema.safeParse({ locale: "pt-BR" })
        .success,
    ).toBe(true);
    expect(
      currentExaminationCatalogQuerySchema.safeParse({ locale: "en-US" })
        .success,
    ).toBe(false);
  });

  it("requires an explicit draft version for preview", () => {
    expect(
      draftExaminationCatalogPreviewQuerySchema.safeParse({
        locale: "pt-BR",
        catalogVersion: "0.3.0-draft",
      }).success,
    ).toBe(true);
    expect(
      draftExaminationCatalogPreviewQuerySchema.safeParse({
        locale: "pt-BR",
        catalogVersion: "0.3.0",
      }).success,
    ).toBe(false);
  });

  it("maps every conditional option to an executable objective rule", () => {
    const conditionalOptions = catalog.questions
      .flatMap(({ options }) => options)
      .filter(
        (option) =>
          option.responseKind === "affirmation" &&
          option.objectiveMatter.classification ===
            "grave_when_conditions_met",
      );

    expect(conditionalOptions).toHaveLength(37);
    expect(
      conditionalOptions.every(
        (option) =>
          option.responseKind === "affirmation" &&
          option.objectiveMatter.classification ===
            "grave_when_conditions_met" &&
          option.objectiveMatter.conditions.length > 0,
      ),
    ).toBe(true);
    expect(catalog.assessment.limitations.ruleStatus).toBe("mapped");
  });

  it("records the exact source artifact hash", () => {
    expect(catalog.sourceArtifact.sha256).toBe(
      "d34c842310ffb43384ffc4544b218b2713b4438f91517bd86fb639354b280215",
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

  it("rejects conditional grave matter without objective conditions", () => {
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

    if (
      conditionalOption.objectiveMatter.classification !==
      "grave_when_conditions_met"
    ) {
      throw new Error("Expected a conditional matter rule.");
    }

    conditionalOption.objectiveMatter.conditions = [];

    expect(examinationCatalogSchema.safeParse(invalidCatalog).success).toBe(
      false,
    );
  });
});
