import type {
  ExaminationQuestionDefinition,
  SelectedOptionCodes,
} from "./model.js";

function findOption(
  question: ExaminationQuestionDefinition,
  optionCode: string,
) {
  const option = question.options.find(({ code }) => code === optionCode);

  if (option === undefined) {
    throw new Error(
      `Unknown option "${optionCode}" for question "${question.stableCode}".`,
    );
  }

  return option;
}

export function isOptionDisabled(
  question: ExaminationQuestionDefinition,
  selectedOptionCodes: SelectedOptionCodes,
  optionCode: string,
): boolean {
  findOption(question, optionCode);

  const selectedExclusiveDenial = question.options.find(
    (option) =>
      option.responseKind === "denial" &&
      option.exclusive &&
      selectedOptionCodes.includes(option.code),
  );

  return (
    selectedExclusiveDenial !== undefined &&
    selectedExclusiveDenial.code !== optionCode
  );
}

export function selectOption(
  question: ExaminationQuestionDefinition,
  selectedOptionCodes: SelectedOptionCodes,
  optionCode: string,
): SelectedOptionCodes {
  const option = findOption(question, optionCode);

  if (selectedOptionCodes.includes(optionCode)) {
    return selectedOptionCodes.filter((code) => code !== optionCode);
  }

  if (isOptionDisabled(question, selectedOptionCodes, optionCode)) {
    return [...selectedOptionCodes];
  }

  if (question.selectionMode === "single" || option.exclusive) {
    return [optionCode];
  }

  const exclusiveCodes = new Set(
    question.options
      .filter(({ exclusive }) => exclusive)
      .map(({ code }) => code),
  );

  return [
    ...selectedOptionCodes.filter((code) => !exclusiveCodes.has(code)),
    optionCode,
  ];
}
