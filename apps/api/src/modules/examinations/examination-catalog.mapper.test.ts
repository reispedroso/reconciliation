import { readFileSync } from "node:fs";

import {
  examinationCatalogSchema,
  publishedExaminationCatalogSchema,
} from "@confession/contracts";
import { describe, expect, it } from "vitest";

import {
  mapPublishedExaminationCatalog,
  type PublishedCatalogRecord,
} from "./examination-catalog.mapper.js";

function createRecord(): PublishedCatalogRecord {
  const catalogUrl = new URL(
    "../../../../../content/editorial/pt-BR/examination-catalog.v2.json",
    import.meta.url,
  );
  const draft = examinationCatalogSchema.parse(
    JSON.parse(readFileSync(catalogUrl, "utf8")),
  );
  const sourceIdByCode = new Map(
    draft.doctrinalSources.map(({ code }, index) => [code, index + 1]),
  );
  let nextQuestionId = 1;
  let nextOptionId = 1;
  const questions: PublishedCatalogRecord["questions"] = [];
  const options: PublishedCatalogRecord["options"] = [];
  const followUpPrompts: PublishedCatalogRecord["followUpPrompts"] = [];
  const optionSourceLinks: PublishedCatalogRecord["optionSourceLinks"] = [];

  for (const question of draft.questions) {
    const questionId = nextQuestionId++;
    questions.push({ id: questionId, ...question });

    for (const option of question.options) {
      const optionId = nextOptionId++;

      if (option.responseKind === "affirmation") {
        options.push({
          id: optionId,
          questionId,
          code: option.code,
          position: option.position,
          label: option.label,
          responseKind: option.responseKind,
          exclusive: option.exclusive,
          startsMortalSinAssessment: option.startsMortalSinAssessment,
          clearAffirmativeSelections: null,
          disableAffirmativeOptionsWhileSelected: null,
          objectiveMatterClassification:
            option.objectiveMatter.classification,
          summaryIncludeWhen: option.summary.includeWhen,
          summaryPdfText: option.summary.pdfText,
          summaryAskQuantity: option.summary.askQuantity,
          summaryAskFrequency: option.summary.askFrequency,
          summaryBehavior: null,
        });
        followUpPrompts.push(
          ...option.followUpPrompts.map((prompt) => ({
            optionId,
            ...prompt,
          })),
        );
        optionSourceLinks.push(
          ...option.doctrinalSourceCodes.map((sourceCode) => ({
            optionId,
            doctrinalSourceId: sourceIdByCode.get(sourceCode) ?? -1,
          })),
        );
      } else {
        options.push({
          id: optionId,
          questionId,
          code: option.code,
          position: option.position,
          label: option.label,
          responseKind: option.responseKind,
          exclusive: option.exclusive,
          startsMortalSinAssessment: null,
          clearAffirmativeSelections: option.clearAffirmativeSelections,
          disableAffirmativeOptionsWhileSelected:
            option.disableAffirmativeOptionsWhileSelected,
          objectiveMatterClassification: null,
          summaryIncludeWhen: null,
          summaryPdfText: null,
          summaryAskQuantity: null,
          summaryAskFrequency: null,
          summaryBehavior: option.summaryBehavior,
        });
      }
    }
  }

  const globalQuestions = [
    draft.assessment.fullKnowledge,
    draft.assessment.deliberateConsent,
  ];

  return {
    catalog: {
      id: 1,
      schemaVersion: draft.schemaVersion,
      catalogVersion: "0.2.0",
      locale: draft.locale,
      title: draft.title,
      purpose: draft.purpose,
      globalNotice: draft.globalNotice,
      mortalSinResultMessage: draft.mortalSinResultMessage,
      reviewedAt: new Date("2026-07-29T12:00:00.000Z"),
      publishedAt: new Date("2026-07-29T13:00:00.000Z"),
    },
    sources: draft.doctrinalSources.map((source) => ({
      id: sourceIdByCode.get(source.code) ?? -1,
      ...source,
    })),
    questions,
    options,
    followUpPrompts,
    optionSourceLinks,
    assessmentQuestions: globalQuestions.map((question, index) => ({
      id: index + 1,
      code: question.code,
      position: index,
      prompt: question.prompt,
    })),
    assessmentAnswers: globalQuestions.flatMap((question, questionIndex) =>
      question.answers.map((answer, position) => ({
        assessmentQuestionId: questionIndex + 1,
        code: answer.code,
        position,
        label: answer.label,
      })),
    ),
    limitationQuestion: {
      id: 1,
      code: draft.assessment.limitations.code,
      prompt: draft.assessment.limitations.prompt,
      note: draft.assessment.limitations.note,
      ruleStatus: draft.assessment.limitations.ruleStatus,
    },
    limitationTriggers: draft.assessment.limitations.askWhen.map(
      (trigger, position) => ({ position, ...trigger }),
    ),
    limitationOptions: draft.assessment.limitations.options.map(
      (option, position) => ({ position, ...option }),
    ),
  };
}

describe("published examination catalog mapper", () => {
  it("reconstructs a valid public DTO from relational records", () => {
    const catalog = mapPublishedExaminationCatalog(createRecord());
    const options = catalog.questions.flatMap((question) => question.options);

    expect(publishedExaminationCatalogSchema.safeParse(catalog).success).toBe(
      true,
    );
    expect(catalog.questions).toHaveLength(9);
    expect(options).toHaveLength(74);
    expect(catalog.doctrinalSources).toHaveLength(7);
    expect("id" in catalog).toBe(false);
    expect("sourceArtifact" in catalog).toBe(false);
  });

  it("rejects an incomplete affirmative option instead of serving bad data", () => {
    const record = createRecord();
    const affirmation = record.options.find(
      ({ responseKind }) => responseKind === "affirmation",
    );

    if (affirmation === undefined) {
      throw new Error("Expected an affirmative option fixture.");
    }

    affirmation.summaryPdfText = null;

    expect(() => mapPublishedExaminationCatalog(record)).toThrow(
      /summaryPdfText/,
    );
  });
});

