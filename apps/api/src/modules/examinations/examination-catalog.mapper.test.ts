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
    "../../../../../content/editorial/pt-BR/examination-catalog.v3.json",
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
          objectiveMatterOperator:
            option.objectiveMatter.classification ===
            "grave_when_conditions_met"
              ? option.objectiveMatter.operator
              : null,
          summaryIncludeWhen: option.summary.includeWhen,
          summaryPdfText: option.summary.pdfText,
          summaryAskQuantity: option.summary.askQuantity,
          summaryAskFrequency: option.summary.askFrequency,
          summaryBehavior: null,
        });
        if (
          option.objectiveMatter.classification ===
          "grave_when_conditions_met"
        ) {
          followUpPrompts.push(
            ...option.objectiveMatter.conditions.map((prompt) => ({
              optionId,
              code: prompt.code,
              position: prompt.position,
              prompt: prompt.prompt,
              ruleStatus: "mapped" as const,
              kind: "objective_condition" as const,
              answerKind: prompt.answerKind,
              requiredAnswer: prompt.requiredAnswer,
              effect: null,
              inputKind: null,
            })),
          );
        }
        followUpPrompts.push(
          ...option.conductConfirmationPrompts.map((prompt) => ({
            optionId,
            code: prompt.code,
            position: prompt.position,
            prompt: prompt.prompt,
            ruleStatus: "mapped" as const,
            kind: "conduct_confirmation" as const,
            answerKind: prompt.answerKind,
            requiredAnswer: prompt.requiredAnswer,
            effect: null,
            inputKind: null,
          })),
          ...option.consentConsiderations.map((prompt) => ({
            optionId,
            code: prompt.code,
            position: prompt.position,
            prompt: prompt.prompt,
            ruleStatus: "mapped" as const,
            kind: "consent_consideration" as const,
            answerKind: prompt.answerKind,
            requiredAnswer: null,
            effect: prompt.effect,
            inputKind: null,
          })),
          ...option.localDetailPrompts.map((prompt) => ({
            optionId,
            code: prompt.code,
            position: prompt.position,
            prompt: prompt.prompt,
            ruleStatus: "mapped" as const,
            kind: "local_detail" as const,
            answerKind: null,
            requiredAnswer: null,
            effect: null,
            inputKind: prompt.inputKind,
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
          objectiveMatterOperator: null,
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
      catalogVersion: "0.3.0",
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
      askBefore: draft.assessment.limitations.askBefore,
      effect: draft.assessment.limitations.effect,
    },
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
    expect(options).toHaveLength(76);
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
