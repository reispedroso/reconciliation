import { z } from "zod";

const stableCodeSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const doctrinalSourceSchema = z.strictObject({
  code: stableCodeSchema,
  document: z.string().min(1),
  locator: z.string().min(1),
  authorityLevel: z.string().min(1),
  officialUrl: z.url(),
});

const affirmativeOptionSchema = z.strictObject({
  code: stableCodeSchema,
  position: z.number().int().nonnegative(),
  label: z.string().min(1),
  responseKind: z.literal("affirmation"),
  exclusive: z.literal(false),
  summaryText: z.string().min(1),
  doctrinalSourceCodes: z.array(stableCodeSchema).min(1),
});

const denialOptionSchema = z.strictObject({
  code: stableCodeSchema,
  position: z.number().int().nonnegative(),
  label: z.string().min(1),
  responseKind: z.literal("denial"),
  exclusive: z.literal(true),
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

export const currentExaminationCatalogSchema = z
  .strictObject({
    schemaVersion: z.literal("1.0.0"),
    locale: z.literal("pt-BR"),
    title: z.string().min(1),
    purpose: z.string().min(1),
    globalNotice: z.string().min(1),
    doctrinalSources: z.array(doctrinalSourceSchema).min(1),
    questions: z.array(questionSchema).min(1),
  })
  .superRefine((catalog, context) => {
    addUniqueCodeIssues(
      catalog.doctrinalSources.map(({ code }) => code),
      ["doctrinalSources"],
      context,
    );
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
    const sourceCodes = new Set(catalog.doctrinalSources.map(({ code }) => code));

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
      if (
        question.options.filter(({ responseKind }) => responseKind === "denial")
          .length !== 1
      ) {
        context.addIssue({
          code: "custom",
          message: "Each question must have exactly one denial option.",
          path: ["questions", questionIndex, "options"],
        });
      }
      question.options.forEach((option, optionIndex) => {
        if (option.responseKind !== "affirmation") return;
        option.doctrinalSourceCodes.forEach((sourceCode, sourceIndex) => {
          if (!sourceCodes.has(sourceCode)) {
            context.addIssue({
              code: "custom",
              message: `Unknown doctrinal source code: ${sourceCode}`,
              path: ["questions", questionIndex, "options", optionIndex, "doctrinalSourceCodes", sourceIndex],
            });
          }
        });
      });
    });
  });

export const currentExaminationCatalogQuerySchema = z.strictObject({
  locale: z.literal("pt-BR"),
});

export const apiErrorSchema = z.strictObject({
  error: z.strictObject({
    code: z.enum(["invalid_request", "catalog_not_found", "internal_error"]),
    message: z.string().min(1),
  }),
});

export const healthResponseSchema = z.strictObject({ status: z.literal("ok") });

export type CurrentExaminationCatalog = z.infer<
  typeof currentExaminationCatalogSchema
>;
export type ExaminationCatalogQuestion = CurrentExaminationCatalog["questions"][number];
export type ExaminationOption = ExaminationCatalogQuestion["options"][number];
export type CurrentExaminationCatalogQuery = z.infer<
  typeof currentExaminationCatalogQuerySchema
>;
export type ApiError = z.infer<typeof apiErrorSchema>;
export type HealthResponse = z.infer<typeof healthResponseSchema>;
