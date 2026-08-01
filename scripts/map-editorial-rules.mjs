import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const inputUrl = new URL(
  "../content/editorial/pt-BR/examination-catalog.v2.json",
  import.meta.url,
);
const outputUrl = new URL(
  "../content/editorial/pt-BR/examination-catalog.v3.json",
  import.meta.url,
);
const inputBuffer = readFileSync(inputUrl);
const input = JSON.parse(inputBuffer.toString("utf8"));

function objective(code, prompt, requiredAnswer = "yes") {
  return {
    code,
    prompt,
    answerKind: "yes_no_unsure",
    requiredAnswer,
  };
}

function conduct(code, prompt, requiredAnswer = "yes") {
  return {
    code,
    prompt,
    answerKind: "yes_no_unsure",
    requiredAnswer,
  };
}

function consent(code, prompt) {
  return {
    code,
    prompt,
    answerKind: "yes_no_unsure",
    effect: "inform_deliberate_consent",
  };
}

function detail(code, prompt, inputKind = "short_text") {
  return { code, prompt, inputKind };
}

const mappings = {
  "grave-sacrilege": {
    operator: "all",
    objective: [
      objective(
        "grave-sacrilege-sacred-object",
        "O objeto era a Eucaristia, outro sacramento, uma ação litúrgica, pessoa, lugar ou coisa consagrada?",
      ),
      objective(
        "grave-sacrilege-serious-profanation",
        "A ação constituiu verdadeira profanação ou tratamento gravemente indigno?",
      ),
    ],
  },
  "formal-heresy": {
    operator: "all",
    objective: [
      objective(
        "formal-heresy-truth-of-faith",
        "Tratava-se de uma verdade proposta pela Igreja para ser crida com fé divina e católica?",
      ),
      objective(
        "formal-heresy-obstinate-persistence",
        "Depois de receber instrução, houve persistência deliberada e obstinada na negação ou dúvida?",
      ),
    ],
  },
  "formal-schism": {
    operator: "all",
    objective: [
      objective(
        "formal-schism-real-refusal",
        "Houve verdadeira recusa da comunhão eclesial, e não apenas crítica, dúvida, desentendimento ou desobediência isolada?",
      ),
    ],
  },
  "serious-divination-spiritism": {
    operator: "all",
    objective: [
      objective(
        "divination-serious-occult-search",
        "Houve busca real de conhecimento ou poder oculto, invocação de espíritos ou entrega supersticiosa séria?",
      ),
      objective(
        "divination-mere-play",
        "Foi apenas brincadeira ou curiosidade passageira sem adesão séria?",
        "no",
      ),
    ],
  },
  despair: {
    operator: "all",
    objective: [
      objective(
        "despair-voluntary-rejection",
        "Houve decisão voluntária de rejeitar a esperança de salvação ou perdão, e não apenas sentimento involuntário ligado a sofrimento, angústia ou doença?",
      ),
    ],
  },
  simony: {
    operator: "all",
    objective: [
      objective(
        "simony-spiritual-reality-sale",
        "Tratava-se realmente de compra ou venda de realidade espiritual, e não de oferta legítima ou taxa autorizada?",
      ),
    ],
  },
  "oath-for-grave-evil": {
    operator: "all",
    objective: [
      objective(
        "oath-objectively-grave-action",
        "A ação prometida, justificada ou apoiada era objetivamente grave?",
      ),
    ],
  },
  "missed-obligatory-mass": {
    operator: "all",
    objective: [
      objective(
        "mass-day-of-obligation",
        "Era domingo ou dia santo de preceito no lugar em que você estava?",
      ),
      objective(
        "mass-serious-reason-or-dispensation",
        "Havia doença, impossibilidade real, cuidado indispensável, falta de celebração acessível, dispensa ou outro motivo sério?",
        "no",
      ),
    ],
  },
  "caused-dependent-to-miss-mass": {
    operator: "all",
    objective: [
      objective(
        "dependent-relied-on-decision",
        "A pessoa dependia realmente da sua decisão ou autorização?",
      ),
      objective(
        "dependent-no-serious-reason",
        "Não havia motivo sério que justificasse a ausência?",
      ),
    ],
  },
  "abandoned-parents-grave-need": {
    operator: "all",
    objective: [
      objective(
        "parents-grave-need",
        "A necessidade envolvia alimentação, moradia, saúde, segurança ou assistência espiritual urgente?",
      ),
      objective(
        "parents-real-ability-to-help",
        "Você tinha possibilidade real e proporcional de ajudar?",
      ),
    ],
  },
  "grave-neglect-children": {
    operator: "all",
    objective: [
      objective(
        "dependent-essential-harm",
        "A omissão expôs o dependente a dano grave ou o privou de necessidade essencial?",
      ),
      objective(
        "dependent-responsibility-and-ability",
        "Você tinha responsabilidade e possibilidade real de agir?",
      ),
    ],
  },
  "grave-neglect-faith-formation": {
    operator: "all",
    objective: [
      objective(
        "faith-formation-persistent-omission",
        "Houve omissão grave e persistente, e não apenas dificuldade ocasional?",
      ),
      objective(
        "faith-formation-real-ability",
        "Você tinha autoridade, meios e possibilidade real de cumprir esse dever?",
      ),
    ],
  },
  "grave-family-abuse": {
    operator: "all",
    objective: [
      objective(
        "family-abuse-serious-harm",
        "Houve violência, ameaça séria, humilhação grave, abuso continuado ou dano importante?",
      ),
    ],
  },
  "unjust-family-abandonment": {
    operator: "all",
    objective: [
      objective(
        "family-abandonment-legitimate-reason",
        "Havia motivo legítimo de segurança, proteção ou necessidade para a separação ou ausência?",
        "no",
      ),
      objective(
        "family-abandonment-essential-obligations",
        "Obrigações essenciais ficaram sem cumprimento?",
      ),
    ],
  },
  "grave-disobedience-legitimate-authority": {
    operator: "all",
    objective: [
      objective(
        "authority-licit-grave-order",
        "A ordem era moralmente lícita, razoável e referente a matéria grave?",
      ),
      objective(
        "authority-real-subjection",
        "Você estava realmente sujeito àquela autoridade naquele assunto?",
      ),
    ],
  },
  "grave-violence": {
    operator: "all",
    objective: [
      objective(
        "violence-serious-injury-or-risk",
        "Houve lesão grave, uso de arma, tortura, risco de morte ou violência especialmente séria?",
      ),
      objective(
        "violence-proportional-self-defense",
        "Tratou-se de legítima defesa necessária e proporcional?",
        "no",
      ),
    ],
  },
  "grave-recklessness": {
    operator: "all",
    objective: [
      objective(
        "recklessness-concrete-foreseeable-risk",
        "O risco de morte ou lesão grave era concreto e previsível?",
      ),
      objective(
        "recklessness-no-proportionate-reason",
        "A conduta foi livremente escolhida sem razão proporcional?",
      ),
    ],
  },
  "grave-drunkenness": {
    operator: "any",
    objective: [
      objective(
        "drunkenness-serious-consequence",
        "Houve perda grave do uso da razão, risco sério à vida, violência, direção de veículo ou abandono de dever grave?",
      ),
    ],
  },
  "grave-scandal": {
    operator: "all",
    objective: [
      objective(
        "scandal-grave-conduct",
        "A conduta à qual a pessoa foi levada era realmente matéria grave?",
      ),
      objective(
        "scandal-relevant-influence",
        "Sua ação ou omissão teve intenção ou influência relevante para que ela a praticasse?",
      ),
    ],
  },
  "refused-emergency-aid": {
    operator: "all",
    objective: [
      objective(
        "aid-grave-immediate-danger",
        "O perigo era grave e imediato?",
      ),
      objective(
        "aid-reasonable-safe-ability",
        "Você podia prestar ajuda ou acionar socorro sem risco desproporcional?",
      ),
    ],
  },
  "sexual-touching-outside-marriage": {
    operator: "all",
    objective: [
      objective(
        "touching-deliberate-sexual-purpose",
        "O ato foi deliberadamente ordenado à excitação ou ao prazer sexual?",
      ),
      objective(
        "touching-simple-affection",
        "Foi simples manifestação de afeto sem intenção sexual deliberada?",
        "no",
      ),
    ],
  },
  "deliberate-lustful-thoughts": {
    operator: "all",
    objective: [
      objective(
        "lust-deliberate-consent",
        "Houve consentimento e permanência voluntária, e não mera tentação, pensamento intrusivo ou percepção involuntária?",
      ),
      objective(
        "lust-gravely-illicit-object",
        "O objeto desejado correspondia a ato sexual gravemente ilícito?",
      ),
    ],
  },
  "direct-sterilization": {
    operator: "all",
    objective: [
      objective(
        "sterilization-directly-chosen",
        "A intervenção foi diretamente escolhida para impedir a procriação?",
      ),
      objective(
        "sterilization-necessary-treatment",
        "Foi tratamento necessário de doença, com esterilidade apenas prevista e não desejada?",
        "no",
      ),
    ],
  },
  "artificial-procreation": {
    operator: "any",
    objective: [
      objective(
        "artificial-procreation-replaced-marital-act",
        "A técnica substituiu o ato conjugal, em vez de apenas auxiliá-lo?",
      ),
      objective(
        "artificial-procreation-embryo-harm",
        "Houve produção, seleção, descarte ou destruição de embriões?",
      ),
    ],
  },
  "grave-theft": {
    operator: "any",
    objective: [
      objective(
        "theft-grave-value-or-harm",
        "Considerando o valor, a situação concreta e o dano causado, houve prejuízo grave?",
      ),
      objective(
        "theft-vulnerable-victim",
        "A vítima era especialmente vulnerável ou dependia daquele bem de modo essencial?",
      ),
    ],
    details: [
      detail("theft-approximate-value", "Valor aproximado", "money"),
      detail("theft-harm-description", "Descrição breve do dano causado"),
    ],
  },
  "grave-fraud-corruption": {
    operator: "any",
    objective: [
      objective(
        "fraud-grave-value-or-benefit",
        "O valor ou benefício obtido era gravemente relevante?",
      ),
      objective(
        "fraud-grave-harm",
        "Houve dano grave a pessoa, empresa, Estado ou bem comum?",
      ),
    ],
    details: [detail("fraud-approximate-value", "Valor ou benefício aproximado", "money")],
  },
  "unjust-wages-exploitation": {
    operator: "any",
    objective: [
      objective(
        "wages-substantial-withholding",
        "A retenção ou exploração foi relevante por seu valor, duração ou intensidade?",
      ),
      objective(
        "wages-essential-deprivation",
        "A conduta privou alguém de necessidades, direitos ou descanso essenciais?",
      ),
    ],
    details: [
      detail("wages-value-or-duration", "Valor retido ou duração aproximada da exploração"),
    ],
  },
  "grave-property-damage": {
    operator: "any",
    objective: [
      objective(
        "property-grave-damage",
        "Considerando o valor e as consequências, o prejuízo foi grave?",
      ),
      objective(
        "property-essential-good",
        "O bem era essencial para a vítima ou para a comunidade?",
      ),
    ],
    details: [detail("property-damage-description", "Valor ou descrição breve do dano")],
  },
  "grave-debt-retention": {
    operator: "all",
    objective: [
      objective(
        "debt-certain-due-enforceable",
        "A dívida era certa, vencida e exigível?",
      ),
      objective(
        "debt-real-ability-to-pay",
        "Você possuía possibilidade real de pagar ou restituir?",
      ),
      objective(
        "debt-grave-harm",
        "A retenção causou dano grave?",
      ),
    ],
  },
  "gambling-family-necessities": {
    operator: "all",
    objective: [
      objective(
        "gambling-essential-needs-compromised",
        "Foram comprometidos alimentação, moradia, saúde, dívidas essenciais ou sustento de dependentes?",
      ),
    ],
  },
  "received-stolen-goods": {
    operator: "all",
    objective: [
      objective(
        "stolen-goods-known-origin",
        "Você sabia que os bens eram roubados?",
      ),
      objective(
        "stolen-goods-grave-value-or-harm",
        "Considerando o valor e o dano causado, a situação era grave?",
      ),
    ],
    details: [detail("stolen-goods-value-or-harm", "Valor aproximado ou descrição breve do dano")],
  },
  "grave-lie": {
    operator: "all",
    objective: [
      objective(
        "lie-grave-intended-or-actual-harm",
        "Houve intenção ou ocorrência de dano grave à justiça, caridade, vida, liberdade, reputação ou aos bens?",
      ),
    ],
    details: [detail("lie-deformed-truth", "Descrição breve da verdade deformada")],
  },
  "grave-calumny": {
    operator: "all",
    objective: [
      objective(
        "calumny-knowingly-false",
        "A acusação era sabidamente falsa?",
      ),
      objective(
        "calumny-serious-harm",
        "A acusação causou dano sério à reputação ou aos direitos da pessoa?",
      ),
    ],
    details: [detail("calumny-reach-and-harm", "Alcance e dano causado")],
  },
  "grave-detraction": {
    operator: "all",
    objective: [
      objective(
        "detraction-proportionate-reason",
        "Havia dever de denunciar, proteção de vítima, defesa do bem comum ou outra razão grave para revelar?",
        "no",
      ),
      objective(
        "detraction-serious-harm",
        "A revelação causou dano sério à reputação ou aos direitos da pessoa?",
      ),
    ],
  },
  "grave-secret-disclosure": {
    operator: "all",
    objective: [
      objective(
        "secret-grave-justification",
        "Havia justa causa ou risco grave que justificasse a revelação?",
        "no",
      ),
      objective(
        "secret-right-to-confidentiality",
        "A pessoa tinha direito ao sigilo?",
      ),
      objective(
        "secret-grave-harm",
        "A revelação causou dano grave?",
      ),
    ],
  },
  "grave-document-falsification": {
    operator: "all",
    objective: [
      objective(
        "document-grave-advantage-or-injustice",
        "A falsificação produziu vantagem grave ou séria injustiça sobre direitos, patrimônio, liberdade ou justiça?",
      ),
    ],
    details: [detail("document-advantage-or-harm", "Descrição breve da vantagem ou do dano")],
  },
  "grave-omission-of-truth": {
    operator: "all",
    objective: [
      objective(
        "omission-grave-duty-to-speak",
        "Você tinha obrigação moral ou jurídica grave de falar?",
      ),
      objective(
        "omission-legitimate-confidentiality",
        "O silêncio protegia sigilo legítimo?",
        "no",
      ),
      objective(
        "omission-preventable-grave-harm",
        "O silêncio permitiu dano grave que poderia ter sido evitado?",
      ),
    ],
  },
};

const supplemental = {
  "suicide-attempt": {
    consent: [
      consent(
        "suicide-freedom-limitation",
        "Havia perturbação psíquica grave, angústia extrema, medo grave ou outra condição concreta que possa ter reduzido a liberdade no episódio?",
      ),
    ],
  },
  "illicit-drug-use": {
    conduct: [
      conduct(
        "drug-use-non-therapeutic",
        "A utilização ocorreu sem finalidade estritamente terapêutica legítima?",
      ),
    ],
    consent: [
      consent(
        "drug-use-dependence",
        "Existia dependência ou compulsão concreta que possa ter reduzido a liberdade no episódio?",
      ),
    ],
  },
  "grave-hatred": {
    conduct: [
      conduct(
        "hatred-voluntary-desire",
        "Foi desejo voluntário de mal grave, e não pensamento intrusivo, emoção passageira ou desejo de justiça proporcional?",
      ),
    ],
  },
  masturbation: {
    consent: [
      consent(
        "masturbation-freedom-limitation",
        "Havia hábito arraigado, compulsão, angústia grave ou outro fator concreto que possa ter reduzido a liberdade no episódio?",
      ),
    ],
  },
};

const conditionalCodes = new Set(Object.keys(mappings));
const sourceConditionalCodes = new Set(
  input.questions.flatMap((question) =>
    question.options
      .filter(
        (option) =>
          option.responseKind === "affirmation" &&
          option.objectiveMatter.classification ===
            "grave_when_conditions_met",
      )
      .map((option) => option.code),
  ),
);

if (
  conditionalCodes.size !== sourceConditionalCodes.size ||
  [...sourceConditionalCodes].some((code) => !conditionalCodes.has(code))
) {
  throw new Error("The approved mapping does not cover every conditional option.");
}

function mappedOption(option) {
  if (option.responseKind === "denial") {
    return option;
  }

  const mapping = mappings[option.code];
  const extra = supplemental[option.code] ?? {};

  return {
    code: option.code,
    position: option.position,
    label: option.label,
    responseKind: option.responseKind,
    exclusive: option.exclusive,
    startsMortalSinAssessment: option.startsMortalSinAssessment,
    objectiveMatter:
      mapping === undefined
        ? { classification: "always_grave" }
        : {
            classification: "grave_when_conditions_met",
            operator: mapping.operator,
            conditions: mapping.objective.map((condition, position) => ({
              ...condition,
              position,
            })),
          },
    conductConfirmationPrompts: (extra.conduct ?? []).map((prompt, position) => ({
      ...prompt,
      position,
    })),
    consentConsiderations: (extra.consent ?? []).map((prompt, position) => ({
      ...prompt,
      position,
    })),
    localDetailPrompts: (mapping?.details ?? []).map((prompt, position) => ({
      ...prompt,
      position,
    })),
    summary: option.summary,
    doctrinalSourceCodes: option.doctrinalSourceCodes,
  };
}

function splitProstitution(option) {
  const shared = {
    responseKind: "affirmation",
    exclusive: false,
    startsMortalSinAssessment: true,
    objectiveMatter: { classification: "always_grave" },
    conductConfirmationPrompts: [],
    localDetailPrompts: [],
    doctrinalSourceCodes: option.doctrinalSourceCodes,
  };

  return [
    {
      ...shared,
      code: "paid-for-sex",
      label: "Paguei por ato sexual.",
      consentConsiderations: [],
      summary: {
        ...option.summary,
        text: "Paguei por ato sexual.",
      },
    },
    {
      ...shared,
      code: "exploited-prostitution",
      label: "Explorei a prostituição de outra pessoa.",
      consentConsiderations: [],
      summary: {
        ...option.summary,
        text: "Explorei a prostituição de outra pessoa.",
      },
    },
    {
      ...shared,
      code: "engaged-in-prostitution",
      label: "Entreguei-me à prostituição.",
      consentConsiderations: [
        {
          ...consent(
            "prostitution-freedom-limitation",
            "Houve miséria extrema, chantagem, coerção ou pressão grave que possa ter reduzido a liberdade no episódio?",
          ),
          position: 0,
        },
      ],
      summary: {
        ...option.summary,
        text: "Entreguei-me à prostituição.",
      },
    },
  ];
}

const output = {
  ...input,
  schemaVersion: "4.0.0",
  catalogVersion: "0.4.0-draft",
  sourceArtifact: {
    fileName: "examination-catalog.v2.json",
    sha256: createHash("sha256").update(inputBuffer).digest("hex"),
  },
  assessment: {
    ...input.assessment,
    limitations: {
      code: input.assessment.limitations.code,
      ruleStatus: "mapped",
      askBefore: "deliberate_consent",
      effect: "inform_deliberate_consent",
      prompt: input.assessment.limitations.prompt,
      options: input.assessment.limitations.options,
      note: input.assessment.limitations.note,
    },
  },
  questions: input.questions.map((question) => {
    const options = question.options.flatMap((option) =>
      option.code === "prostitution"
        ? splitProstitution(option)
        : [mappedOption(option)],
    );

    return {
      ...question,
      options: options.map((option, position) => ({ ...option, position })),
    };
  }),
};

writeFileSync(outputUrl, `${JSON.stringify(output, null, 2)}\n`);
