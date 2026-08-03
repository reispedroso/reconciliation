import { currentExaminationCatalogSchema, type CurrentExaminationCatalog } from "@addiopeccati/contracts";

export interface CurrentCatalogRecord {
  catalog: { id: number; schemaVersion: string; locale: string; title: string; purpose: string; globalNotice: string };
  sources: Array<{ id: number; catalogId: number; code: string; document: string; locator: string; authorityLevel: string; officialUrl: string }>;
  questions: Array<{ id: number; code: string; position: number; title: string; prompt: string; helpText: string }>;
  options: Array<{ id: number; questionId: number; code: string; position: number; label: string; responseKind: "affirmation" | "denial"; exclusive: boolean; summaryText: string | null }>;
  optionSourceLinks: Array<{ optionId: number; doctrinalSourceId: number }>;
}

function groupBy<Key, Value>(values: readonly Value[], key: (value: Value) => Key): Map<Key, Value[]> {
  const groups = new Map<Key, Value[]>();
  for (const value of values) {
    const group = groups.get(key(value));
    if (group === undefined) groups.set(key(value), [value]);
    else group.push(value);
  }
  return groups;
}

export function mapCurrentExaminationCatalog(record: CurrentCatalogRecord): CurrentExaminationCatalog {
  const sourceCodeById = new Map(record.sources.map(({ id, code }) => [id, code]));
  const linksByOptionId = groupBy(record.optionSourceLinks, ({ optionId }) => optionId);
  const optionsByQuestionId = groupBy(record.options, ({ questionId }) => questionId);
  return currentExaminationCatalogSchema.parse({
    schemaVersion: record.catalog.schemaVersion, locale: record.catalog.locale, title: record.catalog.title, purpose: record.catalog.purpose, globalNotice: record.catalog.globalNotice,
    doctrinalSources: [...record.sources].sort((a, b) => a.code.localeCompare(b.code)).map(({ id: _id, catalogId: _catalogId, ...source }) => source),
    questions: [...record.questions].sort((a, b) => a.position - b.position).map((question) => ({
      code: question.code, position: question.position, title: question.title, prompt: question.prompt, helpText: question.helpText, control: "checkbox_group", selectionMode: "multiple",
      options: [...(optionsByQuestionId.get(question.id) ?? [])].sort((a, b) => a.position - b.position).map((option) => option.responseKind === "affirmation" ? ({ code: option.code, position: option.position, label: option.label, responseKind: option.responseKind, exclusive: option.exclusive, summaryText: option.summaryText ?? (() => { throw new Error(`Current catalog option ${option.code} is missing summaryText.`); })(), doctrinalSourceCodes: (linksByOptionId.get(option.id) ?? []).map(({ doctrinalSourceId }) => sourceCodeById.get(doctrinalSourceId) ?? (() => { throw new Error(`Current catalog option ${option.code} has an unknown source.`); })()).sort() }) : ({ code: option.code, position: option.position, label: option.label, responseKind: option.responseKind, exclusive: option.exclusive })),
    })),
  });
}
