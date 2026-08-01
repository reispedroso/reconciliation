import {
  draftExaminationCatalogPreviewSchema,
  publishedExaminationCatalogSchema,
  type DraftExaminationCatalogPreview,
  type PublishedExaminationCatalog,
} from "@addiopeccati/contracts";

export interface PublishedCatalogRecord {
  catalog: {
    id: number;
    schemaVersion: string;
    catalogVersion: string;
    locale: string;
    title: string;
    purpose: string;
    globalNotice: string;
    mortalSinResultMessage: string;
    reviewedAt: Date | null;
    publishedAt: Date | null;
  };
  sources: Array<{
    id: number;
    code: string;
    document: string;
    locator: string;
    authorityLevel: string;
    officialUrl: string;
  }>;
  questions: Array<{
    id: number;
    code: string;
    position: number;
    title: string;
    prompt: string;
    helpText: string;
    control: string;
    selectionMode: string;
  }>;
  options: Array<{
    id: number;
    questionId: number;
    code: string;
    position: number;
    label: string;
    responseKind: "affirmation" | "denial";
    exclusive: boolean;
    startsMortalSinAssessment: boolean | null;
    clearAffirmativeSelections: boolean | null;
    disableAffirmativeOptionsWhileSelected: boolean | null;
    objectiveMatterClassification:
      | "always_grave"
      | "grave_when_conditions_met"
      | null;
    objectiveMatterOperator: "all" | "any" | null;
    summaryIncludeWhen: string | null;
    summaryText: string | null;
    summaryAskQuantity: boolean | null;
    summaryAskFrequency: boolean | null;
    summaryBehavior: string | null;
  }>;
  followUpPrompts: Array<{
    optionId: number;
    code: string;
    position: number;
    prompt: string;
    ruleStatus: "requires_rule_mapping" | "mapped";
    kind:
      | "objective_condition"
      | "conduct_confirmation"
      | "consent_consideration"
      | "local_detail"
      | null;
    answerKind: string | null;
    requiredAnswer: string | null;
    effect: string | null;
    inputKind: string | null;
  }>;
  optionSourceLinks: Array<{
    optionId: number;
    doctrinalSourceId: number;
  }>;
  assessmentQuestions: Array<{
    id: number;
    code: string;
    position: number;
    prompt: string;
  }>;
  assessmentAnswers: Array<{
    assessmentQuestionId: number;
    code: string;
    position: number;
    label: string;
  }>;
  limitationQuestion: {
    id: number;
    code: string;
    prompt: string;
    note: string;
    ruleStatus: "requires_rule_mapping" | "mapped";
    askBefore: string | null;
    effect: string | null;
  };
  limitationOptions: Array<{
    code: string;
    position: number;
    label: string;
  }>;
}

function required<T>(value: T | null | undefined, field: string): T {
  if (value === null || value === undefined) {
    throw new Error(`Published catalog is missing required field ${field}.`);
  }

  return value;
}

function groupBy<Key, Value>(
  values: readonly Value[],
  selectKey: (value: Value) => Key,
): Map<Key, Value[]> {
  const groups = new Map<Key, Value[]>();

  for (const value of values) {
    const key = selectKey(value);
    const group = groups.get(key);

    if (group === undefined) {
      groups.set(key, [value]);
    } else {
      group.push(value);
    }
  }

  return groups;
}

function sorted<Value>(
  values: readonly Value[],
  compare: (left: Value, right: Value) => number,
): Value[] {
  return [...values].sort(compare);
}

function mapExaminationCatalogContent(record: PublishedCatalogRecord) {
  const sourceCodeById = new Map(
    record.sources.map(({ id, code }) => [id, code]),
  );
  const promptsByOptionId = groupBy(
    record.followUpPrompts,
    ({ optionId }) => optionId,
  );
  const sourceLinksByOptionId = groupBy(
    record.optionSourceLinks,
    ({ optionId }) => optionId,
  );
  const optionsByQuestionId = groupBy(
    record.options,
    ({ questionId }) => questionId,
  );
  const answersByQuestionId = groupBy(
    record.assessmentAnswers,
    ({ assessmentQuestionId }) => assessmentQuestionId,
  );

  const assessmentByCode = new Map(
    record.assessmentQuestions.map((question) => [
      question.code,
      {
        code: question.code,
        prompt: question.prompt,
        answers: sorted(
          answersByQuestionId.get(question.id) ?? [],
          (left, right) => left.position - right.position,
        )
          .map(({ code, label }) => ({ code, label })),
      },
    ]),
  );

  const value = {
    schemaVersion: record.catalog.schemaVersion,
    catalogVersion: record.catalog.catalogVersion,
    locale: record.catalog.locale,
    title: record.catalog.title,
    purpose: record.catalog.purpose,
    globalNotice: record.catalog.globalNotice,
    mortalSinResultMessage: record.catalog.mortalSinResultMessage,
    assessment: {
      fullKnowledge: required(
        assessmentByCode.get("full-knowledge"),
        "assessment.fullKnowledge",
      ),
      deliberateConsent: required(
        assessmentByCode.get("deliberate-consent"),
        "assessment.deliberateConsent",
      ),
      limitations: {
        code: record.limitationQuestion.code,
        ruleStatus: record.limitationQuestion.ruleStatus,
        askBefore: required(
          record.limitationQuestion.askBefore,
          "assessment.limitations.askBefore",
        ),
        effect: required(
          record.limitationQuestion.effect,
          "assessment.limitations.effect",
        ),
        prompt: record.limitationQuestion.prompt,
        options: sorted(
          record.limitationOptions,
          (left, right) => left.position - right.position,
        )
          .map(({ code, label }) => ({ code, label })),
        note: record.limitationQuestion.note,
      },
    },
    doctrinalSources: sorted(record.sources, (left, right) =>
      left.code.localeCompare(right.code),
    )
      .map(({ id: _id, ...source }) => source),
    questions: sorted(
      record.questions,
      (left, right) => left.position - right.position,
    )
      .map((question) => ({
        code: question.code,
        position: question.position,
        title: question.title,
        prompt: question.prompt,
        helpText: question.helpText,
        control: question.control,
        selectionMode: question.selectionMode,
        options: sorted(
          optionsByQuestionId.get(question.id) ?? [],
          (left, right) => left.position - right.position,
        )
          .map((option) => {
            if (option.responseKind === "denial") {
              return {
                code: option.code,
                position: option.position,
                label: option.label,
                responseKind: option.responseKind,
                exclusive: option.exclusive,
                clearAffirmativeSelections: required(
                  option.clearAffirmativeSelections,
                  `${option.code}.clearAffirmativeSelections`,
                ),
                disableAffirmativeOptionsWhileSelected: required(
                  option.disableAffirmativeOptionsWhileSelected,
                  `${option.code}.disableAffirmativeOptionsWhileSelected`,
                ),
                summaryBehavior: required(
                  option.summaryBehavior,
                  `${option.code}.summaryBehavior`,
                ),
              };
            }

            const optionPrompts = promptsByOptionId.get(option.id) ?? [];
            const objectiveMatterClassification = required(
              option.objectiveMatterClassification,
              `${option.code}.objectiveMatterClassification`,
            );
            const objectiveMatter =
              objectiveMatterClassification === "always_grave"
                ? { classification: objectiveMatterClassification }
                : {
                    classification: objectiveMatterClassification,
                    operator: required(
                      option.objectiveMatterOperator,
                      `${option.code}.objectiveMatterOperator`,
                    ),
                    conditions: sorted(
                      optionPrompts.filter(
                        ({ kind }) => kind === "objective_condition",
                      ),
                      (left, right) => left.position - right.position,
                    ).map((prompt) => ({
                      code: prompt.code,
                      position: prompt.position,
                      prompt: prompt.prompt,
                      answerKind: required(
                        prompt.answerKind,
                        `${prompt.code}.answerKind`,
                      ),
                      requiredAnswer: required(
                        prompt.requiredAnswer,
                        `${prompt.code}.requiredAnswer`,
                      ),
                    })),
                  };

            return {
              code: option.code,
              position: option.position,
              label: option.label,
              responseKind: option.responseKind,
              exclusive: option.exclusive,
              startsMortalSinAssessment: required(
                option.startsMortalSinAssessment,
                `${option.code}.startsMortalSinAssessment`,
              ),
              objectiveMatter,
              conductConfirmationPrompts: sorted(
                optionPrompts.filter(
                  ({ kind }) => kind === "conduct_confirmation",
                ),
                (left, right) => left.position - right.position,
              ).map((prompt) => ({
                code: prompt.code,
                position: prompt.position,
                prompt: prompt.prompt,
                answerKind: required(
                  prompt.answerKind,
                  `${prompt.code}.answerKind`,
                ),
                requiredAnswer: required(
                  prompt.requiredAnswer,
                  `${prompt.code}.requiredAnswer`,
                ),
              })),
              consentConsiderations: sorted(
                optionPrompts.filter(
                  ({ kind }) => kind === "consent_consideration",
                ),
                (left, right) => left.position - right.position,
              ).map((prompt) => ({
                code: prompt.code,
                position: prompt.position,
                prompt: prompt.prompt,
                answerKind: required(
                  prompt.answerKind,
                  `${prompt.code}.answerKind`,
                ),
                effect: required(
                  prompt.effect,
                  `${prompt.code}.effect`,
                ),
              })),
              localDetailPrompts: sorted(
                optionPrompts.filter(({ kind }) => kind === "local_detail"),
                (left, right) => left.position - right.position,
              ).map((prompt) => ({
                code: prompt.code,
                position: prompt.position,
                prompt: prompt.prompt,
                inputKind: required(
                  prompt.inputKind,
                  `${prompt.code}.inputKind`,
                ),
              })),
              summary: {
                includeWhen: required(
                  option.summaryIncludeWhen,
                  `${option.code}.summaryIncludeWhen`,
                ),
                text: required(
                  option.summaryText,
                  `${option.code}.summaryText`,
                ),
                askQuantity: required(
                  option.summaryAskQuantity,
                  `${option.code}.summaryAskQuantity`,
                ),
                askFrequency: required(
                  option.summaryAskFrequency,
                  `${option.code}.summaryAskFrequency`,
                ),
              },
              doctrinalSourceCodes: sorted(
                (sourceLinksByOptionId.get(option.id) ?? []).map(
                  ({ doctrinalSourceId }) =>
                    required(
                      sourceCodeById.get(doctrinalSourceId),
                      `${option.code}.doctrinalSource`,
                    ),
                ),
                (left, right) => left.localeCompare(right),
              ),
            };
          }),
      })),
  };

  return value;
}

export function mapPublishedExaminationCatalog(
  record: PublishedCatalogRecord,
): PublishedExaminationCatalog {
  return publishedExaminationCatalogSchema.parse({
    ...mapExaminationCatalogContent(record),
    reviewedAt: required(record.catalog.reviewedAt, "reviewedAt").toISOString(),
    publishedAt: required(
      record.catalog.publishedAt,
      "publishedAt",
    ).toISOString(),
  });
}

export function mapDraftExaminationCatalogPreview(
  record: PublishedCatalogRecord,
): DraftExaminationCatalogPreview {
  return draftExaminationCatalogPreviewSchema.parse({
    ...mapExaminationCatalogContent(record),
    preview: {
      status: "draft",
      requiresClericalReview: true,
    },
  });
}
