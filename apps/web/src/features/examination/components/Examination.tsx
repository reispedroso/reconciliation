import type {
  DraftExaminationCatalogPreview,
  ExaminationCatalogQuestion,
} from "@addiopeccati/contracts";
import {
  buildConfessionList,
  isOptionDisabled,
  selectOption,
  type ExaminationQuestionDefinition,
} from "@addiopeccati/domain";
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
        ? { summary: { text: option.summary.text } }
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

export interface ExaminationProps {
  catalog: DraftExaminationCatalogPreview;
}

export function Examination({ catalog }: ExaminationProps) {
  const { clearSession, setState, state } = useExaminationSession(catalog);
  const [openCriteriaHelpCode, setOpenCriteriaHelpCode] = useState<
    string | null
  >(null);
  const [clearConfirmationVisible, setClearConfirmationVisible] =
    useState(false);
  const [
    completionClearConfirmationVisible,
    setCompletionClearConfirmationVisible,
  ] = useState(false);
  const [clearSuccessVisible, setClearSuccessVisible] = useState(false);
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
  const titleParts = splitQuestionTitle(
    activeQuestion.title,
    activeQuestionIndex,
  );
  const confessionSections = catalog.questions.flatMap(
    (question, questionIndex) => {
      const selectedOptionCodes = new Set(
        state.selections[question.code] ?? [],
      );
      const entries = buildConfessionList(
        question.options.flatMap((option) =>
          option.responseKind === "affirmation"
            ? [
                {
                  optionCode: option.code,
                  selected: selectedOptionCodes.has(option.code),
                  text: option.summary.text,
                },
              ]
            : [],
        ),
      );

      if (entries.length === 0) {
        return [];
      }

      return [
        {
          code: question.code,
          entries,
          title: splitQuestionTitle(question.title, questionIndex).title,
        },
      ];
    },
  );
  const confessionItemCount = confessionSections.reduce(
    (total, section) => total + section.entries.length,
    0,
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
    setCompletionClearConfirmationVisible(false);
    setClearSuccessVisible(false);
    setState((current) => ({
      ...current,
      activeQuestionCode: question.code,
    }));
  }

  function handleSelection(optionCode: string) {
    setClearSuccessVisible(false);
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
    setCompletionClearConfirmationVisible(false);
    setClearSuccessVisible(true);
  }

  function showCompletion() {
    focusContentAfterNavigation.current = true;
    setOpenCriteriaHelpCode(null);
    setClearConfirmationVisible(false);
    setCompletionClearConfirmationVisible(false);
    setClearSuccessVisible(false);
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
              setClearSuccessVisible(false);
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
            <p className="question-kicker">Sua lista para a confissão</p>
            <h2 id="examination-completion-heading" tabIndex={-1}>
              Pecados que você marcou para confessar
            </h2>
            {confessionItemCount === 0 ? (
              <div className="confession-list-empty">
                <h3>Nenhum item foi marcado</h3>
                <p>
                  Volte ao exame se precisar rever alguma seção. Não marque
                  algo apenas para preencher a lista.
                </p>
              </div>
            ) : (
              <>
                <p className="confession-list-introduction">
                  Leia esta lista com calma antes da confissão. Ela reúne
                  somente o que você marcou e permanece privada nesta aba.
                </p>
                <div className="confession-list">
                  {confessionSections.map((section) => (
                    <section key={section.code}>
                      <h3>{section.title}</h3>
                      <ul>
                        {section.entries.map((entry) => (
                          <li key={entry.optionCode}>{entry.text}</li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              </>
            )}
            <div className="scrupulosity-note" role="note">
              <strong>Faça este exame com sinceridade e serenidade.</strong>
              <p>
                Uma dúvida, tentação ou pensamento involuntário não deve ser
                marcado como se fosse uma escolha deliberada. Se você sofre
                com escrúpulos, siga a orientação do seu confessor e não tente
                alcançar uma certeza impossível.
              </p>
            </div>
            <div className="completion-actions">
              <button
                className="secondary-button"
                onClick={() => {
                  navigateToQuestion(0);
                }}
                type="button"
              >
                Rever o exame
              </button>
              <button
                className="danger-button"
                onClick={() => {
                  setCompletionClearConfirmationVisible(true);
                }}
                type="button"
              >
                Encerrar e apagar
              </button>
            </div>
            {completionClearConfirmationVisible ? (
              <div className="completion-clear-confirmation" role="alert">
                <strong>Apagar todas as marcações deste exame?</strong>
                <p>
                  A lista, as opções marcadas, o progresso e o cache local
                  deste exame serão removidos do navegador e não poderão ser
                  recuperados.
                </p>
                <div>
                  <button
                    className="secondary-button secondary-button--compact"
                    onClick={() => {
                      setCompletionClearConfirmationVisible(false);
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
                    Sim, apagar tudo
                  </button>
                </div>
              </div>
            ) : null}
          </section>
        ) : (
          <>
            {clearSuccessVisible ? (
              <p className="clear-success" role="status">
                Tudo foi apagado. Não restam marcações, progresso nem cache
                local deste exame no navegador.
              </p>
            ) : null}
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
                {selectedCodes.length > 0
                  ? "Grupo revisado"
                  : "Marque apenas o que realmente aconteceu"}
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
                  ? "Ver lista para a confissão"
                  : "Continuar →"}
              </button>
            </nav>
          </>
        )}
      </div>
    </div>
  );
}
