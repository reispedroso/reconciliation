import type { CurrentExaminationCatalogQuery } from "@confession/contracts";
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
  type Database,
} from "@confession/database";
import { and, asc, desc, eq } from "drizzle-orm";

import {
  mapPublishedExaminationCatalog,
  type PublishedCatalogRecord,
} from "./examination-catalog.mapper.js";
import type { PublishedExaminationCatalogRepository } from "./examination-catalog.service.js";

export class DrizzlePublishedExaminationCatalogRepository
  implements PublishedExaminationCatalogRepository
{
  public constructor(private readonly database: Database) {}

  public async findCurrentPublishedByLocale(
    locale: CurrentExaminationCatalogQuery["locale"],
  ) {
    const record = await this.database.transaction(async (transaction) => {
      const [catalog] = await transaction
        .select({
          id: editorialCatalogVersions.id,
          schemaVersion: editorialCatalogVersions.schemaVersion,
          catalogVersion: editorialCatalogVersions.catalogVersion,
          locale: editorialCatalogVersions.locale,
          title: editorialCatalogVersions.title,
          purpose: editorialCatalogVersions.purpose,
          globalNotice: editorialCatalogVersions.globalNotice,
          mortalSinResultMessage:
            editorialCatalogVersions.mortalSinResultMessage,
          reviewedAt: editorialCatalogVersions.reviewedAt,
          publishedAt: editorialCatalogVersions.publishedAt,
        })
        .from(editorialCatalogVersions)
        .where(
          and(
            eq(editorialCatalogVersions.locale, locale),
            eq(editorialCatalogVersions.status, "published"),
          ),
        )
        .orderBy(desc(editorialCatalogVersions.publishedAt))
        .limit(1);

      if (
        catalog === undefined ||
        catalog.reviewedAt === null ||
        catalog.publishedAt === null
      ) {
        return null;
      }

      const publishedCatalog = {
        ...catalog,
        reviewedAt: catalog.reviewedAt,
        publishedAt: catalog.publishedAt,
      };

      const catalogVersionId = catalog.id;
      const sources = await transaction
        .select({
          id: doctrinalSources.id,
          code: doctrinalSources.code,
          document: doctrinalSources.document,
          locator: doctrinalSources.locator,
          authorityLevel: doctrinalSources.authorityLevel,
          officialUrl: doctrinalSources.officialUrl,
        })
        .from(doctrinalSources)
        .where(eq(doctrinalSources.catalogVersionId, catalogVersionId))
        .orderBy(asc(doctrinalSources.code));
      const questions = await transaction
        .select({
          id: examinationQuestions.id,
          code: examinationQuestions.code,
          position: examinationQuestions.position,
          title: examinationQuestions.title,
          prompt: examinationQuestions.prompt,
          helpText: examinationQuestions.helpText,
          control: examinationQuestions.control,
          selectionMode: examinationQuestions.selectionMode,
        })
        .from(examinationQuestions)
        .where(eq(examinationQuestions.catalogVersionId, catalogVersionId))
        .orderBy(asc(examinationQuestions.position));
      const options = await transaction
        .select({
          id: examinationOptions.id,
          questionId: examinationOptions.questionId,
          code: examinationOptions.code,
          position: examinationOptions.position,
          label: examinationOptions.label,
          responseKind: examinationOptions.responseKind,
          exclusive: examinationOptions.exclusive,
          startsMortalSinAssessment:
            examinationOptions.startsMortalSinAssessment,
          clearAffirmativeSelections:
            examinationOptions.clearAffirmativeSelections,
          disableAffirmativeOptionsWhileSelected:
            examinationOptions.disableAffirmativeOptionsWhileSelected,
          objectiveMatterClassification:
            examinationOptions.objectiveMatterClassification,
          summaryIncludeWhen: examinationOptions.summaryIncludeWhen,
          summaryPdfText: examinationOptions.summaryPdfText,
          summaryAskQuantity: examinationOptions.summaryAskQuantity,
          summaryAskFrequency: examinationOptions.summaryAskFrequency,
          summaryBehavior: examinationOptions.summaryBehavior,
        })
        .from(examinationOptions)
        .innerJoin(
          examinationQuestions,
          eq(examinationOptions.questionId, examinationQuestions.id),
        )
        .where(eq(examinationQuestions.catalogVersionId, catalogVersionId))
        .orderBy(
          asc(examinationQuestions.position),
          asc(examinationOptions.position),
        );
      const followUpPrompts = await transaction
        .select({
          optionId: optionFollowUpPrompts.optionId,
          code: optionFollowUpPrompts.code,
          position: optionFollowUpPrompts.position,
          prompt: optionFollowUpPrompts.prompt,
          ruleStatus: optionFollowUpPrompts.ruleStatus,
        })
        .from(optionFollowUpPrompts)
        .innerJoin(
          examinationOptions,
          eq(optionFollowUpPrompts.optionId, examinationOptions.id),
        )
        .innerJoin(
          examinationQuestions,
          eq(examinationOptions.questionId, examinationQuestions.id),
        )
        .where(eq(examinationQuestions.catalogVersionId, catalogVersionId))
        .orderBy(asc(optionFollowUpPrompts.position));
      const optionSourceLinks = await transaction
        .select({
          optionId: optionDoctrinalSources.optionId,
          doctrinalSourceId: optionDoctrinalSources.doctrinalSourceId,
        })
        .from(optionDoctrinalSources)
        .innerJoin(
          examinationOptions,
          eq(optionDoctrinalSources.optionId, examinationOptions.id),
        )
        .innerJoin(
          examinationQuestions,
          eq(examinationOptions.questionId, examinationQuestions.id),
        )
        .where(eq(examinationQuestions.catalogVersionId, catalogVersionId));
      const globalAssessmentQuestions = await transaction
        .select({
          id: assessmentQuestions.id,
          code: assessmentQuestions.code,
          position: assessmentQuestions.position,
          prompt: assessmentQuestions.prompt,
        })
        .from(assessmentQuestions)
        .where(eq(assessmentQuestions.catalogVersionId, catalogVersionId))
        .orderBy(asc(assessmentQuestions.position));
      const globalAssessmentAnswers = await transaction
        .select({
          assessmentQuestionId: assessmentAnswers.assessmentQuestionId,
          code: assessmentAnswers.code,
          position: assessmentAnswers.position,
          label: assessmentAnswers.label,
        })
        .from(assessmentAnswers)
        .innerJoin(
          assessmentQuestions,
          eq(assessmentAnswers.assessmentQuestionId, assessmentQuestions.id),
        )
        .where(eq(assessmentQuestions.catalogVersionId, catalogVersionId))
        .orderBy(
          asc(assessmentQuestions.position),
          asc(assessmentAnswers.position),
        );
      const [limitationQuestion] = await transaction
        .select({
          id: limitationQuestions.id,
          code: limitationQuestions.code,
          prompt: limitationQuestions.prompt,
          note: limitationQuestions.note,
          ruleStatus: limitationQuestions.ruleStatus,
        })
        .from(limitationQuestions)
        .where(eq(limitationQuestions.catalogVersionId, catalogVersionId))
        .limit(1);

      if (limitationQuestion === undefined) {
        throw new Error("Published catalog has no limitation question.");
      }

      const triggers = await transaction
        .select({
          position: limitationTriggers.position,
          field: limitationTriggers.field,
          answer: limitationTriggers.answer,
        })
        .from(limitationTriggers)
        .where(
          eq(
            limitationTriggers.limitationQuestionId,
            limitationQuestion.id,
          ),
        )
        .orderBy(asc(limitationTriggers.position));
      const limitationOptionRows = await transaction
        .select({
          code: limitationOptions.code,
          position: limitationOptions.position,
          label: limitationOptions.label,
        })
        .from(limitationOptions)
        .where(
          eq(limitationOptions.limitationQuestionId, limitationQuestion.id),
        )
        .orderBy(asc(limitationOptions.position));

      return {
        catalog: publishedCatalog,
        sources,
        questions,
        options,
        followUpPrompts,
        optionSourceLinks,
        assessmentQuestions: globalAssessmentQuestions,
        assessmentAnswers: globalAssessmentAnswers,
        limitationQuestion,
        limitationTriggers: triggers,
        limitationOptions: limitationOptionRows,
      } satisfies PublishedCatalogRecord;
    });

    return record === null ? null : mapPublishedExaminationCatalog(record);
  }
}
