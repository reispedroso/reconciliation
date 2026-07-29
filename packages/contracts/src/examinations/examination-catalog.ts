import { z } from "zod";

const stableCodeSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const positionedPromptSchema = z.strictObject({
  code: stableCodeSchema,
  position: z.number().int().nonnegative(),
  prompt: z.string().min(1),
  ruleStatus: z.literal("requires_rule_mapping"),
});

const doctrinalSourceSchema = z.strictObject({
  code: stableCodeSchema,
  document: z.string().min(1),
  locator: z.string().min(1),
  authorityLevel: z.string().min(1),
  officialUrl: z.url(),
});

const summarySchema = z.strictObject({
  includeWhen: z.literal("mortal_sin"),
  pdfText: z.string().min(1),
  askQuantity: z.boolean(),
  askFrequency: z.boolean(),
});

const affirmativeOptionSchema = z.strictObject({
  code: stableCodeSchema,
  position: z.number().int().nonnegative(),
  label: z.string().min(1),
  responseKind: z.literal("affirmation"),
  exclusive: z.literal(false),
  startsMortalSinAssessment: z.literal(true),
  objectiveMatter: z.strictObject({
    classification: z.enum(["always_grave", "grave_when_conditions_met"]),
  }),
  followUpPrompts: z.array(positionedPromptSchema),
  summary: summarySchema,
  doctrinalSourceCodes: z.array(stableCodeSchema).min(1),
});

const denialOptionSchema = z.strictObject({
  code: stableCodeSchema,
  position: z.number().int().nonnegative(),
  label: z.string().min(1),
  responseKind: z.literal("denial"),
  exclusive: z.literal(true),
  clearAffirmativeSelections: z.literal(true),
  disableAffirmativeOptionsWhileSelected: z.literal(true),
  summaryBehavior: z.literal("omit"),
});

const examinationOptionSchema = z.discriminatedUnion("responseKind", [
  affirmativeOptionSchema,
  denialOptionSchema,
]);

const questionSchema = z.strictObject({
  code: stableCodeSchema,
  position: z.number().int().nonnegative(),
  title: z.string().min(1),
  prompt: z.string().min(1),
  helpText: z.string().min(1),
  control: z.literal("checkbox_group"),
  selectionMode: z.literal("multiple"),
  options: z.array(examinationOptionSchema).min(2),
});

const assessmentQuestionSchema = z.strictObject({
  code: stableCodeSchema,
  prompt: z.string().min(1),
  answers: z
    .array(
      z.strictObject({
        code: z.enum(["yes", "no", "unsure"]),
        label: z.string().min(1),
      }),
    )
    .length(3),
});

const limitationsSchema = z.strictObject({
  code: stableCodeSchema,
  ruleStatus: z.literal("requires_rule_mapping"),
  askWhen: z.array(
    z.strictObject({
      field: z.literal("deliberate_consent"),
      answer: z.enum(["no", "unsure"]),
    }),
  ),
  prompt: z.string().min(1),
  options: z.array(
    z.strictObject({
      code: stableCodeSchema,
      label: z.string().min(1),
    }),
  ),
  note: z.string().min(1),
});

function addUniqueCodeIssues(
  values: readonly string[],
  path: readonly (string | number)[],
  context: z.core.$RefinementCtx,
): void {
  const seen = new Set<string>();

  values.forEach((value, index) => {
    if (seen.has(value)) {
      context.addIssue({
        code: "custom",
        message: `Duplicate code: ${value}`,
        path: [...path, index, "code"],
      });
    }

    seen.add(value);
  });
}

function addPositionIssues(
  values: readonly number[],
  path: readonly (string | number)[],
  context: z.core.$RefinementCtx,
): void {
  values.forEach((value, index) => {
    if (value !== index) {
      context.addIssue({
        code: "custom",
        message: `Expected position ${index}, received ${value}.`,
        path: [...path, index, "position"],
      });
    }
  });
}

export const examinationCatalogSchema = z
  .strictObject({
    schemaVersion: z.literal("2.0.0"),
    catalogVersion: z.string().regex(/^\d+\.\d+\.\d+-draft$/),
    locale: z.literal("pt-BR"),
    title: z.string().min(1),
    purpose: z.string().min(1),
    globalNotice: z.string().min(1),
    mortalSinResultMessage: z.string().min(1),
    editorial: z.strictObject({
      status: z.literal("draft"),
      requiresClericalReview: z.literal(true),
      reviewedAt: z.null(),
      publishedAt: z.null(),
    }),
    sourceArtifact: z.strictObject({
      fileName: z.string().min(1),
      sha256: z.string().regex(/^[a-f0-9]{64}$/),
    }),
    assessment: z.strictObject({
      fullKnowledge: assessmentQuestionSchema,
      deliberateConsent: assessmentQuestionSchema,
      limitations: limitationsSchema,
    }),
    doctrinalSources: z.array(doctrinalSourceSchema).min(1),
    questions: z.array(questionSchema).min(1),
  })
  .superRefine((catalog, context) => {
    addUniqueCodeIssues(
      catalog.questions.map(({ code }) => code),
      ["questions"],
      context,
    );
    addPositionIssues(
      catalog.questions.map(({ position }) => position),
      ["questions"],
      context,
    );

    const sourceCodes = catalog.doctrinalSources.map(({ code }) => code);
    addUniqueCodeIssues(sourceCodes, ["doctrinalSources"], context);
    const sourceCodeSet = new Set(sourceCodes);

    catalog.questions.forEach((question, questionIndex) => {
      addUniqueCodeIssues(
        question.options.map(({ code }) => code),
        ["questions", questionIndex, "options"],
        context,
      );
      addPositionIssues(
        question.options.map(({ position }) => position),
        ["questions", questionIndex, "options"],
        context,
      );

      const denialCount = question.options.filter(
        ({ responseKind }) => responseKind === "denial",
      ).length;

      if (denialCount !== 1) {
        context.addIssue({
          code: "custom",
          message: "Each question must have exactly one denial option.",
          path: ["questions", questionIndex, "options"],
        });
      }

      question.options.forEach((option, optionIndex) => {
        if (option.responseKind !== "affirmation") {
          return;
        }

        addUniqueCodeIssues(
          option.followUpPrompts.map(({ code }) => code),
          [
            "questions",
            questionIndex,
            "options",
            optionIndex,
            "followUpPrompts",
          ],
          context,
        );
        addPositionIssues(
          option.followUpPrompts.map(({ position }) => position),
          [
            "questions",
            questionIndex,
            "options",
            optionIndex,
            "followUpPrompts",
          ],
          context,
        );

        if (
          option.objectiveMatter.classification ===
            "grave_when_conditions_met" &&
          option.followUpPrompts.length === 0
        ) {
          context.addIssue({
            code: "custom",
            message:
              "Conditional grave matter requires at least one follow-up prompt.",
            path: [
              "questions",
              questionIndex,
              "options",
              optionIndex,
              "followUpPrompts",
            ],
          });
        }

        option.doctrinalSourceCodes.forEach((sourceCode, sourceIndex) => {
          if (!sourceCodeSet.has(sourceCode)) {
            context.addIssue({
              code: "custom",
              message: `Unknown doctrinal source code: ${sourceCode}`,
              path: [
                "questions",
                questionIndex,
                "options",
                optionIndex,
                "doctrinalSourceCodes",
                sourceIndex,
              ],
            });
          }
        });
      });
    });
  });

export type ExaminationCatalog = z.infer<typeof examinationCatalogSchema>;
export type ExaminationCatalogQuestion = ExaminationCatalog["questions"][number];
export type ExaminationOption = ExaminationCatalogQuestion["options"][number];
export type AffirmativeOption = Extract<
  ExaminationOption,
  { responseKind: "affirmation" }
>;
export type DenialOption = Extract<
  ExaminationOption,
  { responseKind: "denial" }
>;
