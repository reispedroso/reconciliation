import type { DraftExaminationCatalogPreview } from "@confession/contracts";

type DoctrinalSource =
  DraftExaminationCatalogPreview["doctrinalSources"][number];

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

        {compact ? null : (
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
        className="mortal-sin-help-panel"
        hidden={!isOpen}
        id={disclosureId}
      >
        <p className="mortal-sin-help-eyebrow">Catecismo da Igreja Católica</p>
        <h3>Quando um pecado é mortal?</h3>
        <blockquote>
          “Para que um pecado seja mortal, requerem-se, em simultâneo, três
          condições.”
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
            <span aria-hidden="true"> ↗</span>
            <span className="visually-hidden"> (abre em nova aba)</span>
          </a>
        )}
      </div>
    </div>
  );
}
