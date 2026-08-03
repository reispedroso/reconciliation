import type { CurrentExaminationCatalog } from "@addiopeccati/contracts";
import { useRef } from "react";

type DoctrinalSource =
  CurrentExaminationCatalog["doctrinalSources"][number];

export interface MortalSinCriteriaDisclosureProps {
  compact: boolean;
  disclosureId: string;
  globalNotice: string;
  isOpen: boolean;
  onCompact: () => void;
  onToggle: () => void;
  source: DoctrinalSource | undefined;
}

export function MortalSinCriteriaDisclosure({
  compact,
  disclosureId,
  globalNotice,
  isOpen,
  onCompact,
  onToggle,
  source,
}: MortalSinCriteriaDisclosureProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);

  function closeDisclosure() {
    onToggle();
    triggerRef.current?.focus();
  }

  return (
    <div
      className={`mortal-sin-help${compact ? " mortal-sin-help--compact" : ""}`}
    >
      <div className="mortal-sin-help-controls">
        <button
          aria-controls={disclosureId}
          aria-expanded={isOpen}
          aria-label={
            compact
              ? "Entenda as três condições do pecado mortal"
              : undefined
          }
          className="mortal-sin-help-trigger"
          onClick={onToggle}
          ref={triggerRef}
          type="button"
        >
          <span className="mortal-sin-help-icon" aria-hidden="true">
            ?
          </span>
          {compact ? null : (
            <>
              <span>
                Entenda as <strong>três condições do pecado mortal</strong>
              </span>
              <span className="mortal-sin-help-chevron" aria-hidden="true">
                ⌄
              </span>
            </>
          )}
        </button>

        {compact || isOpen ? null : (
          <button
            aria-label="Mostrar apenas o ícone de ajuda em todos os mandamentos"
            className="mortal-sin-help-compact-button"
            onClick={onCompact}
            title="Mostrar apenas o ícone em todos os cards"
            type="button"
          >
            <span aria-hidden="true">×</span>
          </button>
        )}
      </div>

      <div
        aria-labelledby={`${disclosureId}-title`}
        className="mortal-sin-help-panel"
        hidden={!isOpen}
        id={disclosureId}
        role="region"
      >
        <div className="mortal-sin-help-panel-header">
          <p className="mortal-sin-help-eyebrow">
            Catecismo da Igreja Católica
          </p>
          <button
            aria-controls={disclosureId}
            aria-label="Fechar explicação sobre pecado mortal"
            className="mortal-sin-help-close"
            onClick={closeDisclosure}
            type="button"
          >
            <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
              <path
                d="m7 7 10 10M17 7 7 17"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="2"
              />
            </svg>
          </button>
        </div>
        <h3 id={`${disclosureId}-title`}>Quando um pecado é mortal?</h3>
        <blockquote>
          Para que um pecado seja mortal, requerem-se, em simultâneo, três
          condições.
        </blockquote>

        <ol className="mortal-sin-criteria-list">
          <li>
            <span className="mortal-sin-criteria-number" aria-hidden="true">
              1
            </span>
            <div>
              <strong>Matéria grave</strong>
              <p>
                O ato e suas circunstâncias constituem uma violação grave da
                lei de Deus.
              </p>
            </div>
          </li>
          <li>
            <span className="mortal-sin-criteria-number" aria-hidden="true">
              2
            </span>
            <div>
              <strong>Plena consciência</strong>
              <p>
                A pessoa sabia que o ato era gravemente contrário à lei de
                Deus.
              </p>
            </div>
          </li>
          <li>
            <span className="mortal-sin-criteria-number" aria-hidden="true">
              3
            </span>
            <div>
              <strong>Consentimento deliberado</strong>
              <p>
                A pessoa escolheu o ato de modo suficientemente livre e
                deliberado.
              </p>
            </div>
          </li>
        </ol>

        <p className="mortal-sin-help-notice">{globalNotice}</p>

        {source === undefined ? null : (
          <a
            className="mortal-sin-source"
            href={source.officialUrl}
            rel="noreferrer"
            target="_blank"
          >
            Fonte oficial: {source.document}, §§ {source.locator}
            <span className="visually-hidden"> (abre em nova aba)</span>
          </a>
        )}
      </div>
    </div>
  );
}
