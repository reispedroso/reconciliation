CREATE TYPE "public"."follow_up_prompt_kind" AS ENUM('objective_condition', 'conduct_confirmation', 'consent_consideration', 'local_detail');--> statement-breakpoint
CREATE TYPE "public"."objective_matter_operator" AS ENUM('all', 'any');--> statement-breakpoint
ALTER TABLE "examination_options" ADD COLUMN "objective_matter_operator" "objective_matter_operator";--> statement-breakpoint
ALTER TABLE "limitation_questions" ADD COLUMN "ask_before" text;--> statement-breakpoint
ALTER TABLE "limitation_questions" ADD COLUMN "effect" text;--> statement-breakpoint
ALTER TABLE "option_follow_up_prompts" ADD COLUMN "kind" "follow_up_prompt_kind";--> statement-breakpoint
ALTER TABLE "option_follow_up_prompts" ADD COLUMN "answer_kind" text;--> statement-breakpoint
ALTER TABLE "option_follow_up_prompts" ADD COLUMN "required_answer" text;--> statement-breakpoint
ALTER TABLE "option_follow_up_prompts" ADD COLUMN "effect" text;--> statement-breakpoint
ALTER TABLE "option_follow_up_prompts" ADD COLUMN "input_kind" text;--> statement-breakpoint
ALTER TABLE "option_follow_up_prompts" ADD CONSTRAINT "option_follow_up_prompts_shape_check" CHECK ((
        "option_follow_up_prompts"."kind" IS NULL
        AND "option_follow_up_prompts"."rule_status" = 'requires_rule_mapping'
        AND "option_follow_up_prompts"."answer_kind" IS NULL
        AND "option_follow_up_prompts"."required_answer" IS NULL
        AND "option_follow_up_prompts"."effect" IS NULL
        AND "option_follow_up_prompts"."input_kind" IS NULL
      ) OR (
        "option_follow_up_prompts"."kind" IN ('objective_condition', 'conduct_confirmation')
        AND "option_follow_up_prompts"."rule_status" = 'mapped'
        AND "option_follow_up_prompts"."answer_kind" = 'yes_no_unsure'
        AND "option_follow_up_prompts"."required_answer" IN ('yes', 'no')
        AND "option_follow_up_prompts"."effect" IS NULL
        AND "option_follow_up_prompts"."input_kind" IS NULL
      ) OR (
        "option_follow_up_prompts"."kind" = 'consent_consideration'
        AND "option_follow_up_prompts"."rule_status" = 'mapped'
        AND "option_follow_up_prompts"."answer_kind" = 'yes_no_unsure'
        AND "option_follow_up_prompts"."required_answer" IS NULL
        AND "option_follow_up_prompts"."effect" = 'inform_deliberate_consent'
        AND "option_follow_up_prompts"."input_kind" IS NULL
      ) OR (
        "option_follow_up_prompts"."kind" = 'local_detail'
        AND "option_follow_up_prompts"."rule_status" = 'mapped'
        AND "option_follow_up_prompts"."answer_kind" IS NULL
        AND "option_follow_up_prompts"."required_answer" IS NULL
        AND "option_follow_up_prompts"."effect" IS NULL
        AND "option_follow_up_prompts"."input_kind" IN ('short_text', 'money')
      ));