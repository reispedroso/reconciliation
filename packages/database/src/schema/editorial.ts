import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

export const editorialStatus = pgEnum("editorial_status", [
  "draft",
  "published",
  "archived",
]);

export const responseKind = pgEnum("response_kind", [
  "affirmation",
  "denial",
]);

export const objectiveMatterClassification = pgEnum(
  "objective_matter_classification",
  ["always_grave", "grave_when_conditions_met"],
);

export const ruleStatus = pgEnum("rule_status", [
  "requires_rule_mapping",
  "mapped",
]);

export const editorialCatalogVersions = pgTable(
  "editorial_catalog_versions",
  {
    id: serial("id").primaryKey(),
    schemaVersion: text("schema_version").notNull(),
    catalogVersion: text("catalog_version").notNull(),
    locale: text("locale").notNull(),
    title: text("title").notNull(),
    purpose: text("purpose").notNull(),
    globalNotice: text("global_notice").notNull(),
    mortalSinResultMessage: text("mortal_sin_result_message").notNull(),
    status: editorialStatus("status").notNull(),
    requiresClericalReview: boolean("requires_clerical_review").notNull(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    sourceFileName: text("source_file_name").notNull(),
    sourceSha256: text("source_sha256").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("editorial_catalog_versions_version_locale_unique").on(
      table.catalogVersion,
      table.locale,
    ),
    check(
      "editorial_catalog_versions_sha256_check",
      sql`${table.sourceSha256} ~ '^[a-f0-9]{64}$'`,
    ),
    check(
      "editorial_catalog_versions_publication_check",
      sql`(${table.status} = 'published' AND ${table.publishedAt} IS NOT NULL) OR (${table.status} <> 'published' AND ${table.publishedAt} IS NULL)`,
    ),
  ],
);

export const doctrinalSources = pgTable(
  "doctrinal_sources",
  {
    id: serial("id").primaryKey(),
    catalogVersionId: integer("catalog_version_id")
      .notNull()
      .references(() => editorialCatalogVersions.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    document: text("document").notNull(),
    locator: text("locator").notNull(),
    authorityLevel: text("authority_level").notNull(),
    officialUrl: text("official_url").notNull(),
  },
  (table) => [
    unique("doctrinal_sources_catalog_code_unique").on(
      table.catalogVersionId,
      table.code,
    ),
    index("doctrinal_sources_catalog_idx").on(table.catalogVersionId),
  ],
);

export const examinationQuestions = pgTable(
  "examination_questions",
  {
    id: serial("id").primaryKey(),
    catalogVersionId: integer("catalog_version_id")
      .notNull()
      .references(() => editorialCatalogVersions.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    position: integer("position").notNull(),
    title: text("title").notNull(),
    prompt: text("prompt").notNull(),
    helpText: text("help_text").notNull(),
    control: text("control").notNull(),
    selectionMode: text("selection_mode").notNull(),
  },
  (table) => [
    unique("examination_questions_catalog_code_unique").on(
      table.catalogVersionId,
      table.code,
    ),
    unique("examination_questions_catalog_position_unique").on(
      table.catalogVersionId,
      table.position,
    ),
    check("examination_questions_position_check", sql`${table.position} >= 0`),
    check(
      "examination_questions_control_check",
      sql`${table.control} = 'checkbox_group'`,
    ),
    check(
      "examination_questions_selection_mode_check",
      sql`${table.selectionMode} = 'multiple'`,
    ),
  ],
);

export const examinationOptions = pgTable(
  "examination_options",
  {
    id: serial("id").primaryKey(),
    questionId: integer("question_id")
      .notNull()
      .references(() => examinationQuestions.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    position: integer("position").notNull(),
    label: text("label").notNull(),
    responseKind: responseKind("response_kind").notNull(),
    exclusive: boolean("exclusive").notNull(),
    startsMortalSinAssessment: boolean("starts_mortal_sin_assessment"),
    clearAffirmativeSelections: boolean("clear_affirmative_selections"),
    disableAffirmativeOptionsWhileSelected: boolean(
      "disable_affirmative_options_while_selected",
    ),
    objectiveMatterClassification: objectiveMatterClassification(
      "objective_matter_classification",
    ),
    summaryIncludeWhen: text("summary_include_when"),
    summaryPdfText: text("summary_pdf_text"),
    summaryAskQuantity: boolean("summary_ask_quantity"),
    summaryAskFrequency: boolean("summary_ask_frequency"),
    summaryBehavior: text("summary_behavior"),
  },
  (table) => [
    unique("examination_options_question_code_unique").on(
      table.questionId,
      table.code,
    ),
    unique("examination_options_question_position_unique").on(
      table.questionId,
      table.position,
    ),
    check("examination_options_position_check", sql`${table.position} >= 0`),
    check(
      "examination_options_shape_check",
      sql`(
        ${table.responseKind} = 'affirmation'
        AND ${table.exclusive} = false
        AND ${table.startsMortalSinAssessment} = true
        AND ${table.objectiveMatterClassification} IS NOT NULL
        AND ${table.summaryIncludeWhen} = 'mortal_sin'
        AND ${table.summaryPdfText} IS NOT NULL
        AND ${table.summaryAskQuantity} IS NOT NULL
        AND ${table.summaryAskFrequency} IS NOT NULL
        AND ${table.clearAffirmativeSelections} IS NULL
        AND ${table.disableAffirmativeOptionsWhileSelected} IS NULL
        AND ${table.summaryBehavior} IS NULL
      ) OR (
        ${table.responseKind} = 'denial'
        AND ${table.exclusive} = true
        AND ${table.clearAffirmativeSelections} = true
        AND ${table.disableAffirmativeOptionsWhileSelected} = true
        AND ${table.summaryBehavior} = 'omit'
        AND ${table.startsMortalSinAssessment} IS NULL
        AND ${table.objectiveMatterClassification} IS NULL
        AND ${table.summaryIncludeWhen} IS NULL
        AND ${table.summaryPdfText} IS NULL
        AND ${table.summaryAskQuantity} IS NULL
        AND ${table.summaryAskFrequency} IS NULL
      )`,
    ),
  ],
);

export const optionFollowUpPrompts = pgTable(
  "option_follow_up_prompts",
  {
    id: serial("id").primaryKey(),
    optionId: integer("option_id")
      .notNull()
      .references(() => examinationOptions.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    position: integer("position").notNull(),
    prompt: text("prompt").notNull(),
    ruleStatus: ruleStatus("rule_status").notNull(),
  },
  (table) => [
    unique("option_follow_up_prompts_option_code_unique").on(
      table.optionId,
      table.code,
    ),
    unique("option_follow_up_prompts_option_position_unique").on(
      table.optionId,
      table.position,
    ),
    check("option_follow_up_prompts_position_check", sql`${table.position} >= 0`),
  ],
);

export const optionDoctrinalSources = pgTable(
  "option_doctrinal_sources",
  {
    optionId: integer("option_id")
      .notNull()
      .references(() => examinationOptions.id, { onDelete: "cascade" }),
    doctrinalSourceId: integer("doctrinal_source_id")
      .notNull()
      .references(() => doctrinalSources.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.optionId, table.doctrinalSourceId] }),
    index("option_doctrinal_sources_source_idx").on(table.doctrinalSourceId),
  ],
);

export const assessmentQuestions = pgTable(
  "assessment_questions",
  {
    id: serial("id").primaryKey(),
    catalogVersionId: integer("catalog_version_id")
      .notNull()
      .references(() => editorialCatalogVersions.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    position: integer("position").notNull(),
    prompt: text("prompt").notNull(),
  },
  (table) => [
    unique("assessment_questions_catalog_code_unique").on(
      table.catalogVersionId,
      table.code,
    ),
    unique("assessment_questions_catalog_position_unique").on(
      table.catalogVersionId,
      table.position,
    ),
    check("assessment_questions_position_check", sql`${table.position} >= 0`),
  ],
);

export const assessmentAnswers = pgTable(
  "assessment_answers",
  {
    id: serial("id").primaryKey(),
    assessmentQuestionId: integer("assessment_question_id")
      .notNull()
      .references(() => assessmentQuestions.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    position: integer("position").notNull(),
    label: text("label").notNull(),
  },
  (table) => [
    unique("assessment_answers_question_code_unique").on(
      table.assessmentQuestionId,
      table.code,
    ),
    unique("assessment_answers_question_position_unique").on(
      table.assessmentQuestionId,
      table.position,
    ),
    check("assessment_answers_position_check", sql`${table.position} >= 0`),
  ],
);

export const limitationQuestions = pgTable("limitation_questions", {
  id: serial("id").primaryKey(),
  catalogVersionId: integer("catalog_version_id")
    .notNull()
    .unique()
    .references(() => editorialCatalogVersions.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  prompt: text("prompt").notNull(),
  note: text("note").notNull(),
  ruleStatus: ruleStatus("rule_status").notNull(),
});

export const limitationTriggers = pgTable(
  "limitation_triggers",
  {
    id: serial("id").primaryKey(),
    limitationQuestionId: integer("limitation_question_id")
      .notNull()
      .references(() => limitationQuestions.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    field: text("field").notNull(),
    answer: text("answer").notNull(),
  },
  (table) => [
    unique("limitation_triggers_question_position_unique").on(
      table.limitationQuestionId,
      table.position,
    ),
    check("limitation_triggers_position_check", sql`${table.position} >= 0`),
    check(
      "limitation_triggers_field_check",
      sql`${table.field} = 'deliberate_consent'`,
    ),
    check(
      "limitation_triggers_answer_check",
      sql`${table.answer} IN ('no', 'unsure')`,
    ),
  ],
);

export const limitationOptions = pgTable(
  "limitation_options",
  {
    id: serial("id").primaryKey(),
    limitationQuestionId: integer("limitation_question_id")
      .notNull()
      .references(() => limitationQuestions.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    position: integer("position").notNull(),
    label: text("label").notNull(),
  },
  (table) => [
    unique("limitation_options_question_code_unique").on(
      table.limitationQuestionId,
      table.code,
    ),
    unique("limitation_options_question_position_unique").on(
      table.limitationQuestionId,
      table.position,
    ),
    check("limitation_options_position_check", sql`${table.position} >= 0`),
  ],
);

