import { z } from "zod";

const stableCodeSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const answerPromptSchema = z.strictObject({
  code: stableCodeSchema,
  position: z.number().int().nonnegative(),
  prompt: z.string().min(1),
  answerKind: z.literal("yes_no_unsure"),
  requiredAnswer: z.enum(["yes", "no"]),
});

const consentConsiderationSchema = z.strictObject({
  code: stableCodeSchema,
  position: z.number().int().nonnegative(),
  prompt: z.string().min(1),
  answerKind: z.literal("yes_no_unsure"),
  effect: z.literal("inform_deliberate_consent"),
});

const localDetailPromptSchema = z.strictObject({
  code: stableCodeSchema,
  position: z.number().int().nonnegative(),
  prompt: z.string().min(1),
  inputKind: z.enum(["short_text", "money"]),
});

const doctrinalSourceSchema = z.strictObject({
  code: stableCodeSchema,
  document: z.string().min(1),
  locator: z.string().min(1),
  authorityLevel: z.string().min(1),
  officialUrl: z.url(),
});

const summarySchema = z.strictObject({
  includeWhen: z.literal("selected"),
  text: z.string().min(1),
  askQuantity: z.boolean(),
  askFrequency: z.boolean(),
});

const objectiveMatterSchema = z.discriminatedUnion("classification", [
  z.strictObject({
    classification: z.literal("always_grave"),
  }),
  z.strictObject({
    classification: z.literal("grave_when_conditions_met"),
    operator: z.enum(["all", "any"]),
    conditions: z.array(answerPromptSchema).min(1),
  }),
]);

const affirmativeOptionSchema = z.strictObject({
  code: stableCodeSchema,
  position: z.number().int().nonnegative(),
  label: z.string().min(1),
  responseKind: z.literal("affirmation"),
  exclusive: z.literal(false),
  startsMortalSinAssessment: z.literal(true),
  objectiveMatter: objectiveMatterSchema,
  conductConfirmationPrompts: z.array(answerPromptSchema),
  consentConsiderations: z.array(consentConsiderationSchema),
  localDetailPrompts: z.array(localDetailPromptSchema),
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
  ruleStatus: z.literal("mapped"),
  askBefore: z.literal("deliberate_consent"),
  effect: z.literal("inform_deliberate_consent"),
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

interface CatalogForRefinement {
  doctrinalSources: ReadonlyArray<{ code: string }>;
  questions: ReadonlyArray<z.infer<typeof questionSchema>>;
}

function addCatalogIssues(
  catalog: CatalogForRefinement,
  context: z.core.$RefinementCtx,
): void {
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

      const promptGroups: Array<{
        name: string;
        prompts: ReadonlyArray<{ code: string; position: number }>;
      }> = [
        {
          name: "conductConfirmationPrompts",
          prompts: option.conductConfirmationPrompts,
        },
        {
          name: "consentConsiderations",
          prompts: option.consentConsiderations,
        },
        { name: "localDetailPrompts", prompts: option.localDetailPrompts },
        ...(option.objectiveMatter.classification ===
        "grave_when_conditions_met"
          ? [
              {
                name: "objectiveMatter.conditions",
                prompts: option.objectiveMatter.conditions,
              },
            ]
          : []),
      ];

      for (const { name, prompts } of promptGroups) {
        addPositionIssues(
          prompts.map(({ position }) => position),
          ["questions", questionIndex, "options", optionIndex, name],
          context,
        );
      }

      addUniqueCodeIssues(
        promptGroups.flatMap(({ prompts }) => prompts).map(({ code }) => code),
        ["questions", questionIndex, "options", optionIndex, "prompts"],
        context,
      );

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
}

export const examinationCatalogSchema = z
  .strictObject({
    schemaVersion: z.literal("4.0.0"),
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
  .superRefine(addCatalogIssues);

export const currentExaminationCatalogQuerySchema = z.strictObject({
  locale: z.literal("pt-BR"),
});

export const draftExaminationCatalogPreviewQuerySchema = z.strictObject({
  locale: z.literal("pt-BR"),
  catalogVersion: z.string().regex(/^\d+\.\d+\.\d+-draft$/),
});

export const draftExaminationCatalogPreviewSchema = z
  .strictObject({
    schemaVersion: z.literal("4.0.0"),
    catalogVersion: z.string().regex(/^\d+\.\d+\.\d+-draft$/),
    locale: z.literal("pt-BR"),
    title: z.string().min(1),
    purpose: z.string().min(1),
    globalNotice: z.string().min(1),
    mortalSinResultMessage: z.string().min(1),
    preview: z.strictObject({
      status: z.literal("draft"),
      requiresClericalReview: z.literal(true),
    }),
    assessment: z.strictObject({
      fullKnowledge: assessmentQuestionSchema,
      deliberateConsent: assessmentQuestionSchema,
      limitations: limitationsSchema,
    }),
    doctrinalSources: z.array(doctrinalSourceSchema).min(1),
    questions: z.array(questionSchema).min(1),
  })
  .superRefine(addCatalogIssues);

export const publishedExaminationCatalogSchema = z
  .strictObject({
    schemaVersion: z.literal("4.0.0"),
    catalogVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
    locale: z.literal("pt-BR"),
    title: z.string().min(1),
    purpose: z.string().min(1),
    globalNotice: z.string().min(1),
    mortalSinResultMessage: z.string().min(1),
    reviewedAt: z.string().datetime({ offset: true }),
    publishedAt: z.string().datetime({ offset: true }),
    assessment: z.strictObject({
      fullKnowledge: assessmentQuestionSchema,
      deliberateConsent: assessmentQuestionSchema,
      limitations: limitationsSchema,
    }),
    doctrinalSources: z.array(doctrinalSourceSchema).min(1),
    questions: z.array(questionSchema).min(1),
  })
  .superRefine(addCatalogIssues);

export const apiErrorSchema = z.strictObject({
  error: z.strictObject({
    code: z.enum(["invalid_request", "catalog_not_found", "internal_error"]),
    message: z.string().min(1),
  }),
});

export const healthResponseSchema = z.strictObject({
  status: z.literal("ok"),
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
export type CurrentExaminationCatalogQuery = z.infer<
  typeof currentExaminationCatalogQuerySchema
>;
export type DraftExaminationCatalogPreviewQuery = z.infer<
  typeof draftExaminationCatalogPreviewQuerySchema
>;
export type DraftExaminationCatalogPreview = z.infer<
  typeof draftExaminationCatalogPreviewSchema
>;
export type PublishedExaminationCatalog = z.infer<
  typeof publishedExaminationCatalogSchema
>;
export type ApiError = z.infer<typeof apiErrorSchema>;
export type HealthResponse = z.infer<typeof healthResponseSchema>;
