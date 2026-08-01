import { Link } from "react-router-dom";

import { ExaminationPreview } from "../features/examination/components/ExaminationPreview.js";
import { useDraftCatalog } from "../features/examination/hooks/useDraftCatalog.js";

export function ExaminationPreviewPage() {
  const state = useDraftCatalog();

  return (
    <main id="main-content" className="page-shell preview-page">
      <nav className="page-nav" aria-label="Navegação da prévia">
        <Link className="text-link" to="/">
          ← Voltar ao início
        </Link>
      </nav>

      <header className="preview-header">
        <p className="eyebrow">Prévia de desenvolvimento</p>
        <h1>Exame de consciência</h1>
        <p>
          Percorra os grupos e teste a estrutura editorial. Suas marcações
          existem apenas na memória desta página.
        </p>
      </header>

      <div className="draft-banner" role="note">
        <strong>Conteúdo rascunho.</strong> Esta versão ainda exige revisão
        clerical e não está publicada para uso pastoral.
      </div>

      {state.status === "loading" ? (
        <section className="status-card" aria-live="polite">
          <span className="loading-mark" aria-hidden="true" />
          <h2>Carregando o catálogo…</h2>
        </section>
      ) : null}

      {state.status === "error" ? (
        <section className="status-card status-card--error" role="alert">
          <h2>Não foi possível carregar a prévia</h2>
          <p>{state.message}</p>
          <p>
            Confirme que API e PostgreSQL estão ativos e que o preview de
            desenvolvimento foi habilitado.
          </p>
        </section>
      ) : null}

      {state.status === "loaded" && state.catalog.questions.length === 0 ? (
        <section className="status-card">
          <h2>O catálogo está vazio</h2>
        </section>
      ) : null}

      {state.status === "loaded" && state.catalog.questions.length > 0 ? (
        <ExaminationPreview catalog={state.catalog} />
      ) : null}
    </main>
  );
}

