import { readFileSync } from "node:fs";
import { currentExaminationCatalogSchema, type CurrentExaminationCatalog } from "@addiopeccati/contracts";
import type { Database } from "../client.js";
import { currentEditorialCatalog, doctrinalSources, examinationOptions, examinationQuestions, optionDoctrinalSources } from "../schema/index.js";

export interface EditorialSeedResult { locale: string; questionCount: number; optionCount: number; replacedExistingCatalog: boolean; }

export function readEditorialCatalog(): CurrentExaminationCatalog {
  const catalogUrl = new URL("../../../../content/editorial/pt-BR/examination-catalog.json", import.meta.url);
  return currentExaminationCatalogSchema.parse(JSON.parse(readFileSync(catalogUrl, "utf8")));
}

export async function seedEditorialCatalog(database: Database, catalog: CurrentExaminationCatalog): Promise<EditorialSeedResult> {
  return database.transaction(async (transaction) => {
    const existing = await transaction.select({ id: currentEditorialCatalog.id }).from(currentEditorialCatalog).limit(1);
    await transaction.delete(currentEditorialCatalog);
    const [insertedCatalog] = await transaction.insert(currentEditorialCatalog).values({ schemaVersion: catalog.schemaVersion, locale: catalog.locale, title: catalog.title, purpose: catalog.purpose, globalNotice: catalog.globalNotice }).returning({ id: currentEditorialCatalog.id });
    if (insertedCatalog === undefined) throw new Error("PostgreSQL did not return the current catalog id.");
    const sources = await transaction.insert(doctrinalSources).values(catalog.doctrinalSources.map((source) => ({ ...source, catalogId: insertedCatalog.id }))).returning({ id: doctrinalSources.id, code: doctrinalSources.code });
    const sourceIdByCode = new Map(sources.map(({ code, id }) => [code, id]));
    let optionCount = 0;
    for (const question of catalog.questions) {
      const [insertedQuestion] = await transaction.insert(examinationQuestions).values({ catalogId: insertedCatalog.id, code: question.code, position: question.position, title: question.title, prompt: question.prompt, helpText: question.helpText }).returning({ id: examinationQuestions.id });
      if (insertedQuestion === undefined) throw new Error("PostgreSQL did not return an examination question id.");
      for (const option of question.options) {
        const [insertedOption] = await transaction.insert(examinationOptions).values({ questionId: insertedQuestion.id, code: option.code, position: option.position, label: option.label, responseKind: option.responseKind, exclusive: option.exclusive, summaryText: option.responseKind === "affirmation" ? option.summaryText : null }).returning({ id: examinationOptions.id });
        if (insertedOption === undefined) throw new Error("PostgreSQL did not return an examination option id.");
        optionCount += 1;
        if (option.responseKind === "affirmation") await transaction.insert(optionDoctrinalSources).values(option.doctrinalSourceCodes.map((code) => ({ optionId: insertedOption.id, doctrinalSourceId: sourceIdByCode.get(code) ?? (() => { throw new Error(`Missing doctrinal source: ${code}`); })() })));
      }
    }
    return { locale: catalog.locale, questionCount: catalog.questions.length, optionCount, replacedExistingCatalog: existing.length > 0 };
  });
}
