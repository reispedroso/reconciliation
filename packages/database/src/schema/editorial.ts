import { sql } from "drizzle-orm";
import { boolean, check, index, integer, pgEnum, pgTable, primaryKey, serial, text, unique } from "drizzle-orm/pg-core";

export const responseKind = pgEnum("response_kind", ["affirmation", "denial"]);

export const currentEditorialCatalog = pgTable("current_editorial_catalog", {
  id: serial("id").primaryKey(),
  schemaVersion: text("schema_version").notNull(),
  locale: text("locale").notNull().unique(),
  title: text("title").notNull(),
  purpose: text("purpose").notNull(),
  globalNotice: text("global_notice").notNull(),
});

export const doctrinalSources = pgTable("doctrinal_sources", {
  id: serial("id").primaryKey(),
  catalogId: integer("catalog_id").notNull().references(() => currentEditorialCatalog.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  document: text("document").notNull(),
  locator: text("locator").notNull(),
  authorityLevel: text("authority_level").notNull(),
  officialUrl: text("official_url").notNull(),
}, (table) => [unique("doctrinal_sources_catalog_code_unique").on(table.catalogId, table.code), index("doctrinal_sources_catalog_idx").on(table.catalogId)]);

export const examinationQuestions = pgTable("examination_questions", {
  id: serial("id").primaryKey(),
  catalogId: integer("catalog_id").notNull().references(() => currentEditorialCatalog.id, { onDelete: "cascade" }),
  code: text("code").notNull(), position: integer("position").notNull(), title: text("title").notNull(), prompt: text("prompt").notNull(), helpText: text("help_text").notNull(),
}, (table) => [unique("examination_questions_catalog_code_unique").on(table.catalogId, table.code), unique("examination_questions_catalog_position_unique").on(table.catalogId, table.position), check("examination_questions_position_check", sql`${table.position} >= 0`)]);

export const examinationOptions = pgTable("examination_options", {
  id: serial("id").primaryKey(), questionId: integer("question_id").notNull().references(() => examinationQuestions.id, { onDelete: "cascade" }), code: text("code").notNull(), position: integer("position").notNull(), label: text("label").notNull(), responseKind: responseKind("response_kind").notNull(), exclusive: boolean("exclusive").notNull(), summaryText: text("summary_text"),
}, (table) => [unique("examination_options_question_code_unique").on(table.questionId, table.code), unique("examination_options_question_position_unique").on(table.questionId, table.position), check("examination_options_position_check", sql`${table.position} >= 0`), check("examination_options_shape_check", sql`(${table.responseKind} = 'affirmation' AND ${table.exclusive} = false AND ${table.summaryText} IS NOT NULL) OR (${table.responseKind} = 'denial' AND ${table.exclusive} = true AND ${table.summaryText} IS NULL)`)]);

export const optionDoctrinalSources = pgTable("option_doctrinal_sources", {
  optionId: integer("option_id").notNull().references(() => examinationOptions.id, { onDelete: "cascade" }), doctrinalSourceId: integer("doctrinal_source_id").notNull().references(() => doctrinalSources.id, { onDelete: "cascade" }),
}, (table) => [primaryKey({ columns: [table.optionId, table.doctrinalSourceId] })]);
