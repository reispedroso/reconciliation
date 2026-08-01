import { Link } from "react-router-dom";

import { Examination } from "../features/examination/components/Examination.js";
import { useDraftCatalog } from "../features/examination/hooks/useDraftCatalog.js";

export function ExaminationPage() {
  const state = useDraftCatalog();

  return (
    <main id="main-content" className="page-shell examination-page">
      <nav className="page-nav" aria-label="Navegação do exame">
        <Link className="text-link" to="/">
          ← Voltar ao início
        </Link>
      </nav>

      <header className="examination-header">
        <p className="eyebrow">Oração, atenção e humildade</p>
        <h1>Exame de consciência</h1>
        <p>
          Leia cada mandamento com calma. Marque somente as condutas que
          realmente aconteceram e que você precisa recordar na confissão.
          Suas marcações ficam apenas nesta aba.
        </p>
      </header>

      {state.status === "loading" ? (
        <section className="status-card" aria-live="polite">
          <span className="loading-mark" aria-hidden="true" />
          <h2>Carregando o exame…</h2>
        </section>
      ) : null}

      {state.status === "error" ? (
        <section className="status-card status-card--error" role="alert">
          <h2>Não foi possível carregar o exame</h2>
          <p>{state.message}</p>
          <p>
            Confirme que a API e o PostgreSQL estão ativos e tente novamente.
          </p>
        </section>
      ) : null}

      {state.status === "loaded" && state.catalog.questions.length === 0 ? (
        <section className="status-card">
          <h2>O catálogo está vazio</h2>
        </section>
      ) : null}

      {state.status === "loaded" && state.catalog.questions.length > 0 ? (
        <Examination catalog={state.catalog} />
      ) : null}
    </main>
  );
}
