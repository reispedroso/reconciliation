import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname } from "node:path";

const [inputPath, outputPath] = process.argv.slice(2);

if (inputPath === undefined || outputPath === undefined) {
  throw new Error(
    "Usage: node scripts/normalize-editorial-catalog.mjs <input-v1.json> <output-v2.json>",
  );
}

const inputBuffer = readFileSync(inputPath);
const input = JSON.parse(inputBuffer.toString("utf8"));

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function sourceKey(source) {
  return JSON.stringify([
    source.document,
    source.locator,
    source.authorityLevel,
    source.officialUrl,
  ]);
}

const sourceByKey = new Map();
const sourceCodeOwner = new Map();

function registerSource(source) {
  const key = sourceKey(source);
  const existing = sourceByKey.get(key);

  if (existing !== undefined) {
    return existing.code;
  }

  const code = slugify(`${source.document}-${source.locator}`);
  const previousOwner = sourceCodeOwner.get(code);

  if (previousOwner !== undefined && previousOwner !== key) {
    throw new Error(`Doctrinal source code collision: ${code}`);
  }

  const normalized = {
    code,
    document: source.document,
    locator: source.locator,
    authorityLevel: source.authorityLevel,
    officialUrl: source.officialUrl,
  };

  sourceByKey.set(key, normalized);
  sourceCodeOwner.set(code, key);
  return code;
}

for (const source of input.doctrinalSources) {
  registerSource(source);
}

for (const question of input.questions) {
  for (const option of question.options) {
    for (const source of option.doctrinalReferences ?? []) {
      registerSource(source);
    }
  }
}

const answerLabels = {
  yes: "Sim",
  no: "Não",
  unsure: "Não tenho certeza",
};

const limitationLabels = {
  grave_fear_or_coercion: "Medo grave ou coação",
  loss_of_consciousness_not_voluntarily_sought:
    "Perda de consciência não procurada voluntariamente",
  serious_psychological_disturbance: "Perturbação psicológica grave",
  habit_or_compulsion: "Hábito arraigado ou compulsão",
  other_concrete_limitation: "Outra limitação concreta",
  none_reported: "Nenhuma limitação relatada",
};

function normalizeAssessmentQuestion(code, question) {
  return {
    code,
    prompt: question.prompt,
    answers: question.answers.map((answer) => ({
      code: answer,
      label: answerLabels[answer],
    })),
  };
}

function normalizeOption(option, position) {
  if (option.responseKind === "denial") {
    return {
      code: option.code,
      position,
      label: option.label,
      responseKind: "denial",
      exclusive: true,
      clearAffirmativeSelections: true,
      disableAffirmativeOptionsWhileSelected: true,
      summaryBehavior: "omit",
    };
  }

  return {
    code: option.code,
    position,
    label: option.label,
    responseKind: "affirmation",
    exclusive: false,
    startsMortalSinAssessment: true,
    objectiveMatter: {
      classification: option.graveMatterAssessment.classification,
    },
    followUpPrompts: option.graveMatterAssessment.conditionQuestions.map(
      (prompt, promptPosition) => ({
        code: `${option.code}-condition-${promptPosition + 1}`,
        position: promptPosition,
        prompt,
        ruleStatus: "requires_rule_mapping",
      }),
    ),
    summary: {
      includeWhen: "selected",
      text: option.summary.text,
      askQuantity: option.summary.askQuantity,
      askFrequency: option.summary.askFrequency,
    },
    doctrinalSourceCodes: option.doctrinalReferences.map(registerSource),
  };
}

const normalized = {
  schemaVersion: "2.0.0",
  catalogVersion: "0.2.0-draft",
  locale: "pt-BR",
  title: input.title,
  purpose: input.purpose,
  globalNotice: input.globalNotice,
  mortalSinResultMessage: input.resultRules.mortal_sin.userMessage,
  editorial: {
    status: "draft",
    requiresClericalReview: true,
    reviewedAt: null,
    publishedAt: null,
  },
  sourceArtifact: {
    fileName: basename(inputPath),
    sha256: createHash("sha256").update(inputBuffer).digest("hex"),
  },
  assessment: {
    fullKnowledge: normalizeAssessmentQuestion(
      "full-knowledge",
      input.globalAssessment.fullKnowledgeQuestion,
    ),
    deliberateConsent: normalizeAssessmentQuestion(
      "deliberate-consent",
      input.globalAssessment.deliberateConsentQuestion,
    ),
    limitations: {
      code: "concrete-limitations",
      ruleStatus: "requires_rule_mapping",
      askWhen: input.globalAssessment.limitationsQuestion.askWhen.map((rule) => {
        const [field, answer] = rule.split("=");

        if (field !== "deliberateConsent") {
          throw new Error(`Unsupported limitation trigger: ${rule}`);
        }

        return {
          field: "deliberate_consent",
          answer,
        };
      }),
      prompt: input.globalAssessment.limitationsQuestion.prompt,
      options: input.globalAssessment.limitationsQuestion.options.map((code) => {
        const label = limitationLabels[code];

        if (label === undefined) {
          throw new Error(`Missing limitation label: ${code}`);
        }

        return { code: slugify(code), label };
      }),
      note: input.globalAssessment.limitationsQuestion.note,
    },
  },
  doctrinalSources: [...sourceByKey.values()],
  questions: input.questions.map((question, questionPosition) => ({
    code: question.stableCode,
    position: questionPosition,
    title: question.title,
    prompt: question.prompt,
    helpText: question.helpText,
    control: "checkbox_group",
    selectionMode: "multiple",
    options: question.options.map(normalizeOption),
  })),
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(normalized, null, 2)}\n`);
