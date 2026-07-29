CREATE TYPE "public"."editorial_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."objective_matter_classification" AS ENUM('always_grave', 'grave_when_conditions_met');--> statement-breakpoint
CREATE TYPE "public"."response_kind" AS ENUM('affirmation', 'denial');--> statement-breakpoint
CREATE TYPE "public"."rule_status" AS ENUM('requires_rule_mapping', 'mapped');--> statement-breakpoint
CREATE TABLE "assessment_answers" (
	"id" serial PRIMARY KEY NOT NULL,
	"assessment_question_id" integer NOT NULL,
	"code" text NOT NULL,
	"position" integer NOT NULL,
	"label" text NOT NULL,
	CONSTRAINT "assessment_answers_question_code_unique" UNIQUE("assessment_question_id","code"),
	CONSTRAINT "assessment_answers_question_position_unique" UNIQUE("assessment_question_id","position"),
	CONSTRAINT "assessment_answers_position_check" CHECK ("assessment_answers"."position" >= 0)
);
--> statement-breakpoint
CREATE TABLE "assessment_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"catalog_version_id" integer NOT NULL,
	"code" text NOT NULL,
	"position" integer NOT NULL,
	"prompt" text NOT NULL,
	CONSTRAINT "assessment_questions_catalog_code_unique" UNIQUE("catalog_version_id","code"),
	CONSTRAINT "assessment_questions_catalog_position_unique" UNIQUE("catalog_version_id","position"),
	CONSTRAINT "assessment_questions_position_check" CHECK ("assessment_questions"."position" >= 0)
);
--> statement-breakpoint
CREATE TABLE "doctrinal_sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"catalog_version_id" integer NOT NULL,
	"code" text NOT NULL,
	"document" text NOT NULL,
	"locator" text NOT NULL,
	"authority_level" text NOT NULL,
	"official_url" text NOT NULL,
	CONSTRAINT "doctrinal_sources_catalog_code_unique" UNIQUE("catalog_version_id","code")
);
--> statement-breakpoint
CREATE TABLE "editorial_catalog_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"schema_version" text NOT NULL,
	"catalog_version" text NOT NULL,
	"locale" text NOT NULL,
	"title" text NOT NULL,
	"purpose" text NOT NULL,
	"global_notice" text NOT NULL,
	"mortal_sin_result_message" text NOT NULL,
	"status" "editorial_status" NOT NULL,
	"requires_clerical_review" boolean NOT NULL,
	"reviewed_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"source_file_name" text NOT NULL,
	"source_sha256" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "editorial_catalog_versions_version_locale_unique" UNIQUE("catalog_version","locale"),
	CONSTRAINT "editorial_catalog_versions_sha256_check" CHECK ("editorial_catalog_versions"."source_sha256" ~ '^[a-f0-9]{64}$'),
	CONSTRAINT "editorial_catalog_versions_publication_check" CHECK (("editorial_catalog_versions"."status" = 'published' AND "editorial_catalog_versions"."published_at" IS NOT NULL) OR ("editorial_catalog_versions"."status" <> 'published' AND "editorial_catalog_versions"."published_at" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "examination_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"question_id" integer NOT NULL,
	"code" text NOT NULL,
	"position" integer NOT NULL,
	"label" text NOT NULL,
	"response_kind" "response_kind" NOT NULL,
	"exclusive" boolean NOT NULL,
	"starts_mortal_sin_assessment" boolean,
	"clear_affirmative_selections" boolean,
	"disable_affirmative_options_while_selected" boolean,
	"objective_matter_classification" "objective_matter_classification",
	"summary_include_when" text,
	"summary_pdf_text" text,
	"summary_ask_quantity" boolean,
	"summary_ask_frequency" boolean,
	"summary_behavior" text,
	CONSTRAINT "examination_options_question_code_unique" UNIQUE("question_id","code"),
	CONSTRAINT "examination_options_question_position_unique" UNIQUE("question_id","position"),
	CONSTRAINT "examination_options_position_check" CHECK ("examination_options"."position" >= 0),
	CONSTRAINT "examination_options_shape_check" CHECK ((
        "examination_options"."response_kind" = 'affirmation'
        AND "examination_options"."exclusive" = false
        AND "examination_options"."starts_mortal_sin_assessment" = true
        AND "examination_options"."objective_matter_classification" IS NOT NULL
        AND "examination_options"."summary_include_when" = 'mortal_sin'
        AND "examination_options"."summary_pdf_text" IS NOT NULL
        AND "examination_options"."summary_ask_quantity" IS NOT NULL
        AND "examination_options"."summary_ask_frequency" IS NOT NULL
        AND "examination_options"."clear_affirmative_selections" IS NULL
        AND "examination_options"."disable_affirmative_options_while_selected" IS NULL
        AND "examination_options"."summary_behavior" IS NULL
      ) OR (
        "examination_options"."response_kind" = 'denial'
        AND "examination_options"."exclusive" = true
        AND "examination_options"."clear_affirmative_selections" = true
        AND "examination_options"."disable_affirmative_options_while_selected" = true
        AND "examination_options"."summary_behavior" = 'omit'
        AND "examination_options"."starts_mortal_sin_assessment" IS NULL
        AND "examination_options"."objective_matter_classification" IS NULL
        AND "examination_options"."summary_include_when" IS NULL
        AND "examination_options"."summary_pdf_text" IS NULL
        AND "examination_options"."summary_ask_quantity" IS NULL
        AND "examination_options"."summary_ask_frequency" IS NULL
      ))
);
--> statement-breakpoint
CREATE TABLE "examination_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"catalog_version_id" integer NOT NULL,
	"code" text NOT NULL,
	"position" integer NOT NULL,
	"title" text NOT NULL,
	"prompt" text NOT NULL,
	"help_text" text NOT NULL,
	"control" text NOT NULL,
	"selection_mode" text NOT NULL,
	CONSTRAINT "examination_questions_catalog_code_unique" UNIQUE("catalog_version_id","code"),
	CONSTRAINT "examination_questions_catalog_position_unique" UNIQUE("catalog_version_id","position"),
	CONSTRAINT "examination_questions_position_check" CHECK ("examination_questions"."position" >= 0),
	CONSTRAINT "examination_questions_control_check" CHECK ("examination_questions"."control" = 'checkbox_group'),
	CONSTRAINT "examination_questions_selection_mode_check" CHECK ("examination_questions"."selection_mode" = 'multiple')
);
--> statement-breakpoint
CREATE TABLE "limitation_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"limitation_question_id" integer NOT NULL,
	"code" text NOT NULL,
	"position" integer NOT NULL,
	"label" text NOT NULL,
	CONSTRAINT "limitation_options_question_code_unique" UNIQUE("limitation_question_id","code"),
	CONSTRAINT "limitation_options_question_position_unique" UNIQUE("limitation_question_id","position"),
	CONSTRAINT "limitation_options_position_check" CHECK ("limitation_options"."position" >= 0)
);
--> statement-breakpoint
CREATE TABLE "limitation_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"catalog_version_id" integer NOT NULL,
	"code" text NOT NULL,
	"prompt" text NOT NULL,
	"note" text NOT NULL,
	"rule_status" "rule_status" NOT NULL,
	CONSTRAINT "limitation_questions_catalog_version_id_unique" UNIQUE("catalog_version_id")
);
--> statement-breakpoint
CREATE TABLE "limitation_triggers" (
	"id" serial PRIMARY KEY NOT NULL,
	"limitation_question_id" integer NOT NULL,
	"position" integer NOT NULL,
	"field" text NOT NULL,
	"answer" text NOT NULL,
	CONSTRAINT "limitation_triggers_question_position_unique" UNIQUE("limitation_question_id","position"),
	CONSTRAINT "limitation_triggers_position_check" CHECK ("limitation_triggers"."position" >= 0),
	CONSTRAINT "limitation_triggers_field_check" CHECK ("limitation_triggers"."field" = 'deliberate_consent'),
	CONSTRAINT "limitation_triggers_answer_check" CHECK ("limitation_triggers"."answer" IN ('no', 'unsure'))
);
--> statement-breakpoint
CREATE TABLE "option_doctrinal_sources" (
	"option_id" integer NOT NULL,
	"doctrinal_source_id" integer NOT NULL,
	CONSTRAINT "option_doctrinal_sources_option_id_doctrinal_source_id_pk" PRIMARY KEY("option_id","doctrinal_source_id")
);
--> statement-breakpoint
CREATE TABLE "option_follow_up_prompts" (
	"id" serial PRIMARY KEY NOT NULL,
	"option_id" integer NOT NULL,
	"code" text NOT NULL,
	"position" integer NOT NULL,
	"prompt" text NOT NULL,
	"rule_status" "rule_status" NOT NULL,
	CONSTRAINT "option_follow_up_prompts_option_code_unique" UNIQUE("option_id","code"),
	CONSTRAINT "option_follow_up_prompts_option_position_unique" UNIQUE("option_id","position"),
	CONSTRAINT "option_follow_up_prompts_position_check" CHECK ("option_follow_up_prompts"."position" >= 0)
);
--> statement-breakpoint
ALTER TABLE "assessment_answers" ADD CONSTRAINT "assessment_answers_assessment_question_id_assessment_questions_id_fk" FOREIGN KEY ("assessment_question_id") REFERENCES "public"."assessment_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_questions" ADD CONSTRAINT "assessment_questions_catalog_version_id_editorial_catalog_versions_id_fk" FOREIGN KEY ("catalog_version_id") REFERENCES "public"."editorial_catalog_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctrinal_sources" ADD CONSTRAINT "doctrinal_sources_catalog_version_id_editorial_catalog_versions_id_fk" FOREIGN KEY ("catalog_version_id") REFERENCES "public"."editorial_catalog_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "examination_options" ADD CONSTRAINT "examination_options_question_id_examination_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."examination_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "examination_questions" ADD CONSTRAINT "examination_questions_catalog_version_id_editorial_catalog_versions_id_fk" FOREIGN KEY ("catalog_version_id") REFERENCES "public"."editorial_catalog_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "limitation_options" ADD CONSTRAINT "limitation_options_limitation_question_id_limitation_questions_id_fk" FOREIGN KEY ("limitation_question_id") REFERENCES "public"."limitation_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "limitation_questions" ADD CONSTRAINT "limitation_questions_catalog_version_id_editorial_catalog_versions_id_fk" FOREIGN KEY ("catalog_version_id") REFERENCES "public"."editorial_catalog_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "limitation_triggers" ADD CONSTRAINT "limitation_triggers_limitation_question_id_limitation_questions_id_fk" FOREIGN KEY ("limitation_question_id") REFERENCES "public"."limitation_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "option_doctrinal_sources" ADD CONSTRAINT "option_doctrinal_sources_option_id_examination_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."examination_options"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "option_doctrinal_sources" ADD CONSTRAINT "option_doctrinal_sources_doctrinal_source_id_doctrinal_sources_id_fk" FOREIGN KEY ("doctrinal_source_id") REFERENCES "public"."doctrinal_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "option_follow_up_prompts" ADD CONSTRAINT "option_follow_up_prompts_option_id_examination_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."examination_options"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "doctrinal_sources_catalog_idx" ON "doctrinal_sources" USING btree ("catalog_version_id");--> statement-breakpoint
CREATE INDEX "option_doctrinal_sources_source_idx" ON "option_doctrinal_sources" USING btree ("doctrinal_source_id");