import type { CurrentExaminationCatalogQuery } from "@addiopeccati/contracts";
import { currentEditorialCatalog, doctrinalSources, examinationOptions, examinationQuestions, optionDoctrinalSources, type Database } from "@addiopeccati/database";
import { asc, eq } from "drizzle-orm";
import { mapCurrentExaminationCatalog, type CurrentCatalogRecord } from "./examination-catalog.mapper.js";
import type { CurrentExaminationCatalogRepository } from "./examination-catalog.service.js";

export class DrizzleCurrentExaminationCatalogRepository implements CurrentExaminationCatalogRepository {
  public constructor(private readonly database: Database) {}
  public async findCurrentByLocale(locale: CurrentExaminationCatalogQuery["locale"]) {
    return this.database.transaction(async (transaction) => {
      const [catalog] = await transaction.select().from(currentEditorialCatalog).where(eq(currentEditorialCatalog.locale, locale)).limit(1);
      if (catalog === undefined) return null;
      const [sources, questions] = await Promise.all([transaction.select().from(doctrinalSources).where(eq(doctrinalSources.catalogId, catalog.id)).orderBy(asc(doctrinalSources.code)), transaction.select().from(examinationQuestions).where(eq(examinationQuestions.catalogId, catalog.id)).orderBy(asc(examinationQuestions.position))]);
      const questionIds = questions.map(({ id }) => id);
      const allOptions = (await Promise.all(questionIds.map((id) => transaction.select().from(examinationOptions).where(eq(examinationOptions.questionId, id))))).flat();
      const links = (await Promise.all(allOptions.map((option) => transaction.select().from(optionDoctrinalSources).where(eq(optionDoctrinalSources.optionId, option.id))))).flat();
      return mapCurrentExaminationCatalog({ catalog, sources, questions, options: allOptions, optionSourceLinks: links } satisfies CurrentCatalogRecord);
    });
  }
}
