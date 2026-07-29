import { readFileSync } from "node:fs";

import {
  examinationCatalogSchema,
  type ExaminationCatalog,
} from "@confession/contracts";
import { and, eq } from "drizzle-orm";

import type { Database } from "../client.js";
import {
  assessmentAnswers,
  assessmentQuestions,
  doctrinalSources,
  editorialCatalogVersions,
  examinationOptions,
  examinationQuestions,
  limitationOptions,
  limitationQuestions,
  limitationTriggers,
  optionDoctrinalSources,
  optionFollowUpPrompts,
} from "../schema/index.js";

export interface EditorialSeedResult {
  catalogVersion: string;
  catalogVersionId: number;
  doctrinalSourceCount: number;
  questionCount: number;
  optionCount: number;
  followUpPromptCount: number;
  replacedExistingDraft: boolean;
}

export function readEditorialCatalog(): ExaminationCatalog {
  const catalogUrl = new URL(
    "../../../../content/editorial/pt-BR/examination-catalog.v2.json",
    import.meta.url,
  );
  const value: unknown = JSON.parse(readFileSync(catalogUrl, "utf8"));

  return examinationCatalogSchema.parse(value);
}

export async function seedEditorialCatalog(
  database: Database,
  catalog: ExaminationCatalog,
): Promise<EditorialSeedResult> {
  return database.transaction(async (transaction) => {
    const [existingCatalog] = await transaction
      .select({
        id: editorialCatalogVersions.id,
        status: editorialCatalogVersions.status,
      })
      .from(editorialCatalogVersions)
      .where(
        and(
          eq(
            editorialCatalogVersions.catalogVersion,
            catalog.catalogVersion,
          ),
          eq(editorialCatalogVersions.locale, catalog.locale),
        ),
      )
      .limit(1);

    if (existingCatalog?.status === "published") {
      throw new Error(
        `Refusing to replace published catalog ${catalog.catalogVersion} (${catalog.locale}).`,
      );
    }

    if (existingCatalog !== undefined) {
      await transaction
        .delete(editorialCatalogVersions)
        .where(eq(editorialCatalogVersions.id, existingCatalog.id));
    }

    const [insertedCatalog] = await transaction
      .insert(editorialCatalogVersions)
      .values({
        schemaVersion: catalog.schemaVersion,
        catalogVersion: catalog.catalogVersion,
        locale: catalog.locale,
        title: catalog.title,
        purpose: catalog.purpose,
        globalNotice: catalog.globalNotice,
        mortalSinResultMessage: catalog.mortalSinResultMessage,
        status: catalog.editorial.status,
        requiresClericalReview: catalog.editorial.requiresClericalReview,
        reviewedAt: catalog.editorial.reviewedAt,
        publishedAt: catalog.editorial.publishedAt,
        sourceFileName: catalog.sourceArtifact.fileName,
        sourceSha256: catalog.sourceArtifact.sha256,
      })
      .returning({ id: editorialCatalogVersions.id });

    if (insertedCatalog === undefined) {
      throw new Error("PostgreSQL did not return the inserted catalog id.");
    }

    const catalogVersionId = insertedCatalog.id;
    const insertedSources = await transaction
      .insert(doctrinalSources)
      .values(
        catalog.doctrinalSources.map((source) => ({
          catalogVersionId,
          ...source,
        })),
      )
      .returning({ id: doctrinalSources.id, code: doctrinalSources.code });
    const sourceIdByCode = new Map(
      insertedSources.map(({ code, id }) => [code, id]),
    );

    const globalAssessmentQuestions = [
      catalog.assessment.fullKnowledge,
      catalog.assessment.deliberateConsent,
    ];

    for (const [questionPosition, assessmentQuestion] of
      globalAssessmentQuestions.entries()) {
      const [insertedQuestion] = await transaction
        .insert(assessmentQuestions)
        .values({
          catalogVersionId,
          code: assessmentQuestion.code,
          position: questionPosition,
          prompt: assessmentQuestion.prompt,
        })
        .returning({ id: assessmentQuestions.id });

      if (insertedQuestion === undefined) {
        throw new Error("PostgreSQL did not return an assessment question id.");
      }

      await transaction.insert(assessmentAnswers).values(
        assessmentQuestion.answers.map((answer, answerPosition) => ({
          assessmentQuestionId: insertedQuestion.id,
          code: answer.code,
          position: answerPosition,
          label: answer.label,
        })),
      );
    }

    const [insertedLimitationQuestion] = await transaction
      .insert(limitationQuestions)
      .values({
        catalogVersionId,
        code: catalog.assessment.limitations.code,
        prompt: catalog.assessment.limitations.prompt,
        note: catalog.assessment.limitations.note,
        ruleStatus: catalog.assessment.limitations.ruleStatus,
      })
      .returning({ id: limitationQuestions.id });

    if (insertedLimitationQuestion === undefined) {
      throw new Error("PostgreSQL did not return the limitation question id.");
    }

    await transaction.insert(limitationTriggers).values(
      catalog.assessment.limitations.askWhen.map((trigger, position) => ({
        limitationQuestionId: insertedLimitationQuestion.id,
        position,
        field: trigger.field,
        answer: trigger.answer,
      })),
    );
    await transaction.insert(limitationOptions).values(
      catalog.assessment.limitations.options.map((option, position) => ({
        limitationQuestionId: insertedLimitationQuestion.id,
        position,
        ...option,
      })),
    );

    let optionCount = 0;
    let followUpPromptCount = 0;

    for (const question of catalog.questions) {
      const [insertedQuestion] = await transaction
        .insert(examinationQuestions)
        .values({
          catalogVersionId,
          code: question.code,
          position: question.position,
          title: question.title,
          prompt: question.prompt,
          helpText: question.helpText,
          control: question.control,
          selectionMode: question.selectionMode,
        })
        .returning({ id: examinationQuestions.id });

      if (insertedQuestion === undefined) {
        throw new Error("PostgreSQL did not return an examination question id.");
      }

      for (const option of question.options) {
        const values =
          option.responseKind === "affirmation"
            ? {
                questionId: insertedQuestion.id,
                code: option.code,
                position: option.position,
                label: option.label,
                responseKind: option.responseKind,
                exclusive: option.exclusive,
                startsMortalSinAssessment:
                  option.startsMortalSinAssessment,
                objectiveMatterClassification:
                  option.objectiveMatter.classification,
                summaryIncludeWhen: option.summary.includeWhen,
                summaryPdfText: option.summary.pdfText,
                summaryAskQuantity: option.summary.askQuantity,
                summaryAskFrequency: option.summary.askFrequency,
              }
            : {
                questionId: insertedQuestion.id,
                code: option.code,
                position: option.position,
                label: option.label,
                responseKind: option.responseKind,
                exclusive: option.exclusive,
                clearAffirmativeSelections:
                  option.clearAffirmativeSelections,
                disableAffirmativeOptionsWhileSelected:
                  option.disableAffirmativeOptionsWhileSelected,
                summaryBehavior: option.summaryBehavior,
              };
        const [insertedOption] = await transaction
          .insert(examinationOptions)
          .values(values)
          .returning({ id: examinationOptions.id });

        if (insertedOption === undefined) {
          throw new Error("PostgreSQL did not return an examination option id.");
        }

        optionCount += 1;

        if (option.responseKind === "affirmation") {
          if (option.followUpPrompts.length > 0) {
            await transaction.insert(optionFollowUpPrompts).values(
              option.followUpPrompts.map((followUpPrompt) => ({
                optionId: insertedOption.id,
                ...followUpPrompt,
              })),
            );
          }

          followUpPromptCount += option.followUpPrompts.length;

          await transaction.insert(optionDoctrinalSources).values(
            option.doctrinalSourceCodes.map((sourceCode) => {
              const doctrinalSourceId = sourceIdByCode.get(sourceCode);

              if (doctrinalSourceId === undefined) {
                throw new Error(`Missing doctrinal source: ${sourceCode}`);
              }

              return {
                optionId: insertedOption.id,
                doctrinalSourceId,
              };
            }),
          );
        }
      }
    }

    return {
      catalogVersion: catalog.catalogVersion,
      catalogVersionId,
      doctrinalSourceCount: catalog.doctrinalSources.length,
      questionCount: catalog.questions.length,
      optionCount,
      followUpPromptCount,
      replacedExistingDraft: existingCatalog !== undefined,
    };
  });
}

