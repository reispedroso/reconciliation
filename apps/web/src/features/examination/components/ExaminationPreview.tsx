import type {
  DraftExaminationCatalogPreview,
  ExaminationCatalogQuestion,
} from "@confession/contracts";
import {
  isOptionDisabled,
  selectOption,
  type ExaminationQuestionDefinition,
} from "@confession/domain";
import { useEffect, useMemo, useRef, useState } from "react";

import { useExaminationSession } from "../state/useExaminationSession.js";
import { MortalSinCriteriaDisclosure } from "./MortalSinCriteriaDisclosure.js";

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

function splitQuestionTitle(title: string, questionIndex: number) {
  const separator = " — ";
  const separatorIndex = title.indexOf(separator);

  if (separatorIndex === -1) {
    return {
      kicker: `Seção ${String(questionIndex + 1).padStart(2, "0")}`,
      title,
    };
  }

  return {
    kicker: title.slice(0, separatorIndex),
    title: title.slice(separatorIndex + separator.length),
  };
}

export interface ExaminationPreviewProps {
  catalog: DraftExaminationCatalogPreview;
}

export function ExaminationPreview({ catalog }: ExaminationPreviewProps) {
  const { clearSession, setState, state } = useExaminationSession(catalog);
  const [openCriteriaHelpCode, setOpenCriteriaHelpCode] = useState<
    string | null
  >(null);
  const [clearConfirmationVisible, setClearConfirmationVisible] =
    useState(false);
  const [completionVisible, setCompletionVisible] = useState(false);
  const focusContentAfterNavigation = useRef(false);
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
  const mortalSinCatechismSource = catalog.doctrinalSources.find(
    ({ code }) => code === "catecismo-da-igreja-catolica-1857-1861",
  );
  const activeQuestionIndex = Math.max(
    0,
    catalog.questions.findIndex(
      ({ code }) => code === state.activeQuestionCode,
    ),
  );
  const activeQuestion = catalog.questions[activeQuestionIndex];

  if (activeQuestion === undefined) {
    throw new Error("The active examination question does not exist.");
  }

  const selectedCodes = state.selections[activeQuestion.code] ?? [];
  const definition = selectionDefinitions.get(activeQuestion.code);
  const answeredCount = catalog.questions.filter(
    ({ code }) => (state.selections[code]?.length ?? 0) > 0,
  ).length;
  const firstUnansweredIndex = catalog.questions.findIndex(
    ({ code }) => (state.selections[code]?.length ?? 0) === 0,
  );
  const titleParts = splitQuestionTitle(
    activeQuestion.title,
    activeQuestionIndex,
  );

  if (definition === undefined) {
    throw new Error(
      `Missing selection definition: ${activeQuestion.code}`,
    );
  }

  const activeQuestionCode = activeQuestion.code;
  const activeDefinition = definition;

  useEffect(() => {
    if (!focusContentAfterNavigation.current) {
      return;
    }

    focusContentAfterNavigation.current = false;
    const targetId = completionVisible
      ? "examination-completion-heading"
      : `${activeQuestion.code}-heading`;
    const target = document.getElementById(targetId);

    target?.focus({ preventScroll: true });

    if (target !== null && typeof target.scrollIntoView === "function") {
      target.scrollIntoView({ block: "start" });
    }
  }, [activeQuestion.code, completionVisible]);

  function navigateToQuestion(questionIndex: number) {
    const question = catalog.questions[questionIndex];

    if (question === undefined) {
      return;
    }

    focusContentAfterNavigation.current = true;
    setCompletionVisible(false);
    setOpenCriteriaHelpCode(null);
    setClearConfirmationVisible(false);
    setState((current) => ({
      ...current,
      activeQuestionCode: question.code,
    }));
  }

  function handleSelection(optionCode: string) {
    setState((current) => {
      const currentCodes = current.selections[activeQuestionCode] ?? [];
      const nextCodes = selectOption(
        activeDefinition,
        currentCodes,
        optionCode,
      );
      const nextSelections: Record<string, readonly string[]> = {
        ...current.selections,
      };

      if (nextCodes.length === 0) {
        delete nextSelections[activeQuestionCode];
      } else {
        nextSelections[activeQuestionCode] = nextCodes;
      }

      return { ...current, selections: nextSelections };
    });
  }

  function handleClearSession() {
    focusContentAfterNavigation.current = true;
    clearSession();
    setCompletionVisible(false);
    setOpenCriteriaHelpCode(null);
    setClearConfirmationVisible(false);
  }

  function showCompletion() {
    focusContentAfterNavigation.current = true;
    setOpenCriteriaHelpCode(null);
    setCompletionVisible(true);
  }

  const progressPercentage =
    ((activeQuestionIndex + 1) / catalog.questions.length) * 100;

  return (
    <div className="examination-layout">
      <aside className="progress-card" aria-label="Progresso do exame">
        <div className="progress-summary">
          <div>
            <p className="progress-label">Etapa atual</p>
            <p className="progress-value" aria-live="polite">
              {activeQuestionIndex + 1} de {catalog.questions.length}
            </p>
          </div>
          <span className="progress-private-label">Privado nesta aba</span>
          <button
            className="clear-examination-trigger"
            onClick={() => {
              setClearConfirmationVisible((current) => !current);
            }}
            type="button"
          >
            Limpar
          </button>
        </div>

        <div
          aria-label={`${activeQuestionIndex + 1} de ${catalog.questions.length} etapas`}
          aria-valuemax={catalog.questions.length}
          aria-valuemin={1}
          aria-valuenow={activeQuestionIndex + 1}
          className="progress-track"
          role="progressbar"
        >
          <span style={{ width: `${progressPercentage}%` }} />
        </div>

        <p className="answered-summary">
          {answeredCount} {answeredCount === 1 ? "grupo revisado" : "grupos revisados"}
        </p>

        {clearConfirmationVisible ? (
          <div className="clear-confirmation" role="alert">
            <p>Apagar todas as marcações e voltar à primeira seção?</p>
            <div>
              <button
                className="secondary-button secondary-button--compact"
                onClick={() => {
                  setClearConfirmationVisible(false);
                }}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="danger-button"
                onClick={handleClearSession}
                type="button"
              >
                Apagar exame
              </button>
            </div>
          </div>
        ) : null}

        <div className="progress-desktop-details">
          <nav aria-label="Seções do exame">
            <ol className="section-navigation">
              {catalog.questions.map((question, questionIndex) => {
                const parts = splitQuestionTitle(question.title, questionIndex);
                const answered =
                  (state.selections[question.code]?.length ?? 0) > 0;
                const active = question.code === activeQuestion.code;

                return (
                  <li key={question.code}>
                    <button
                      aria-current={active ? "step" : undefined}
                      className={active ? "section-link section-link--active" : "section-link"}
                      onClick={() => {
                        navigateToQuestion(questionIndex);
                      }}
                      type="button"
                    >
                      <span className="section-link-number">
                        {String(questionIndex + 1).padStart(2, "0")}
                      </span>
                      <span className="section-link-copy">
                        <span>{parts.title}</span>
                        <small>{answered ? "Revisado" : "Não revisado"}</small>
                      </span>
                      <span
                        aria-label={answered ? "Revisado" : "Não revisado"}
                        className={answered ? "section-status section-status--answered" : "section-status"}
                        role="img"
                      >
                        {answered ? "✓" : "○"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>

          <p className="privacy-note">
            As marcações permanecem somente nesta aba e podem ser
            apagadas a qualquer momento.
          </p>
        </div>
      </aside>

      <div className="examination-content">
        {completionVisible ? (
          <section className="completion-card">
            <p className="question-kicker">Fim da prévia atual</p>
            <h2 id="examination-completion-heading" tabIndex={-1}>
              Você chegou ao final das seções
            </h2>
            <p>
              {answeredCount === catalog.questions.length
                ? "Os nove grupos possuem uma resposta."
                : `${answeredCount} de ${catalog.questions.length} grupos possuem uma resposta.`}
            </p>
            <p>
              Nesta versão, as marcações ainda não constituem uma lista de
              pecados confirmados. A avaliação das três condições e o resumo
              privado serão acrescentados no próximo marco.
            </p>
            <button
              className="primary-button"
              onClick={() => {
                navigateToQuestion(
                  firstUnansweredIndex === -1 ? 0 : firstUnansweredIndex,
                );
              }}
              type="button"
            >
              {firstUnansweredIndex === -1
                ? "Rever desde o início"
                : "Revisar grupos pendentes"}
            </button>
          </section>
        ) : (
          <>
            <fieldset
              aria-labelledby={`${activeQuestion.code}-heading`}
              className="question-card"
              id="active-question"
            >
              <header className="question-card-heading">
                <p className="question-kicker">{titleParts.kicker}</p>
                <h2 id={`${activeQuestion.code}-heading`} tabIndex={-1}>
                  {titleParts.title}
                </h2>
              </header>

              <p className="question-prompt">{activeQuestion.prompt}</p>
              <p className="question-help">{activeQuestion.helpText}</p>

              {activeQuestion.options.some(
                (option) =>
                  option.responseKind === "affirmation" &&
                  option.startsMortalSinAssessment,
              ) ? (
                <MortalSinCriteriaDisclosure
                  compact={state.compactCriteriaHelp}
                  disclosureId={`${activeQuestion.code}-mortal-sin-criteria`}
                  globalNotice={catalog.globalNotice}
                  isOpen={openCriteriaHelpCode === activeQuestion.code}
                  onCompact={() => {
                    setState((current) => ({
                      ...current,
                      compactCriteriaHelp: true,
                    }));
                    setOpenCriteriaHelpCode(null);
                  }}
                  onToggle={() => {
                    setOpenCriteriaHelpCode((current) =>
                      current === activeQuestion.code
                        ? null
                        : activeQuestion.code,
                    );
                  }}
                  source={mortalSinCatechismSource}
                />
              ) : null}

              <div className="option-list">
                {activeQuestion.options.map((option) => {
                  const inputId = `${activeQuestion.code}-${option.code}`;
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
                          handleSelection(option.code);
                        }}
                        type="checkbox"
                      />
                      <span>{option.label}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <nav className="question-navigation" aria-label="Navegação entre seções">
              <button
                className="secondary-button"
                disabled={activeQuestionIndex === 0}
                onClick={() => {
                  navigateToQuestion(activeQuestionIndex - 1);
                }}
                type="button"
              >
                ← Voltar
              </button>
              <span>
                {selectedCodes.length > 0 ? "Grupo revisado" : "Pode ser revisado depois"}
              </span>
              <button
                className="primary-button"
                onClick={() => {
                  if (activeQuestionIndex === catalog.questions.length - 1) {
                    showCompletion();
                  } else {
                    navigateToQuestion(activeQuestionIndex + 1);
                  }
                }}
                type="button"
              >
                {activeQuestionIndex === catalog.questions.length - 1
                  ? "Concluir revisão"
                  : "Continuar →"}
              </button>
            </nav>
          </>
        )}
      </div>
    </div>
  );
}
