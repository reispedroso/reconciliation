import type {
  DraftExaminationCatalogPreview,
  ExaminationCatalogQuestion,
} from "@confession/contracts";
import {
  isOptionDisabled,
  selectOption,
  type ExaminationQuestionDefinition,
} from "@confession/domain";
import { useMemo, useState } from "react";

type SelectionsByQuestion = Readonly<Record<string, readonly string[]>>;

function toSelectionDefinition(
  question: ExaminationCatalogQuestion,
): ExaminationQuestionDefinition {
  return {
    stableCode: question.code,
    prompt: question.prompt,
    selectionMode: question.selectionMode,
    options: question.options.map((option) => ({
      code: option.code,
      label: option.label,
      responseKind: option.responseKind,
      exclusive: option.exclusive,
      ...(option.responseKind === "affirmation"
        ? { summary: { pdfText: option.summary.pdfText } }
        : {}),
    })),
  };
}

export interface ExaminationPreviewProps {
  catalog: DraftExaminationCatalogPreview;
}

export function ExaminationPreview({ catalog }: ExaminationPreviewProps) {
  const [selections, setSelections] = useState<SelectionsByQuestion>({});
  const selectionDefinitions = useMemo(
    () =>
      new Map(
        catalog.questions.map((question) => [
          question.code,
          toSelectionDefinition(question),
        ]),
      ),
    [catalog.questions],
  );
  const answeredCount = catalog.questions.filter(
    ({ code }) => (selections[code]?.length ?? 0) > 0,
  ).length;

  function handleSelection(questionCode: string, optionCode: string) {
    const definition = selectionDefinitions.get(questionCode);

    if (definition === undefined) {
      throw new Error(`Missing selection definition: ${questionCode}`);
    }

    setSelections((current) => ({
      ...current,
      [questionCode]: selectOption(
        definition,
        current[questionCode] ?? [],
        optionCode,
      ),
    }));
  }

  return (
    <div className="examination-layout">
      <aside className="progress-card" aria-label="Progresso da prévia">
        <p className="eyebrow">Progresso local</p>
        <p className="progress-value" aria-live="polite">
          {answeredCount} de {catalog.questions.length}
        </p>
        <p>grupos respondidos nesta página</p>
        <div className="progress-track" aria-hidden="true">
          <span
            style={{
              width: `${(answeredCount / catalog.questions.length) * 100}%`,
            }}
          />
        </div>
        <p className="privacy-note">
          Nenhuma marcação é enviada à API ou gravada no banco.
        </p>
      </aside>

      <div className="question-list">
        {catalog.questions.map((question, questionIndex) => {
          const selectedCodes = selections[question.code] ?? [];
          const definition = selectionDefinitions.get(question.code);

          if (definition === undefined) {
            return null;
          }

          return (
            <fieldset className="question-card" key={question.code}>
              <legend>
                <span className="question-index">
                  {String(questionIndex + 1).padStart(2, "0")}
                </span>
                {question.title}
              </legend>
              <p className="question-prompt">{question.prompt}</p>
              <p className="question-help">{question.helpText}</p>

              <div className="option-list">
                {question.options.map((option) => {
                  const inputId = `${question.code}-${option.code}`;
                  const disabled = isOptionDisabled(
                    definition,
                    selectedCodes,
                    option.code,
                  );

                  return (
                    <label
                      className={`option-row option-row--${option.responseKind}`}
                      htmlFor={inputId}
                      key={option.code}
                    >
                      <input
                        checked={selectedCodes.includes(option.code)}
                        disabled={disabled}
                        id={inputId}
                        onChange={() => {
                          handleSelection(question.code, option.code);
                        }}
                        type="checkbox"
                      />
                      <span>{option.label}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          );
        })}
      </div>
    </div>
  );
}

