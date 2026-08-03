import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";

import { Examination } from "../features/examination/components/Examination.js";
import { useCurrentCatalog } from "../features/examination/hooks/useCurrentCatalog.js";

export function ExaminationPage() {
  const state = useCurrentCatalog();
  const loadingHeadingRef = useRef<HTMLHeadingElement>(null);
  const retryRequestedRef = useRef(false);

  useEffect(() => {
    if (state.status !== "loading" || !retryRequestedRef.current) {
      return;
    }

    retryRequestedRef.current = false;
    loadingHeadingRef.current?.focus();
  }, [state.status]);

  return (
    <main id="main-content" className="page-shell examination-page">
      <nav className="page-nav" aria-label="Navegação do exame">
        <Link aria-label="Voltar ao início" className="text-link" to="/">
          Voltar
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
        <section
          className="status-card status-card--loading"
          aria-live="polite"
        >
          <span className="loading-mark" aria-hidden="true" />
          <h2 ref={loadingHeadingRef} tabIndex={-1}>
            Carregando o exame…
          </h2>
        </section>
      ) : null}

      {state.status === "error" ? (
        <section className="status-card status-card--error" role="alert">
          <h2>{state.kind === "unavailable" ? "Exame temporariamente indisponível" : "Não foi possível carregar o exame"}</h2>
          <p>
            {state.kind === "unavailable" ? "O conteúdo do exame ainda não está disponível. Tente novamente mais tarde." : state.kind === "network" ? "Não foi possível conectar ao conteúdo do exame. Verifique sua conexão e tente novamente." : state.kind === "invalid-response" ? "Recebemos uma resposta inválida ao carregar o exame. Tente novamente em instantes." : "Ocorreu um problema ao carregar o exame. Tente novamente em instantes."}
          </p>
          <div className="status-actions">
            <button
              className="primary-button"
              onClick={() => {
                retryRequestedRef.current = true;
                state.retry();
              }}
              type="button"
            >
              Tentar novamente
            </button>
          </div>
        </section>
      ) : null}

      {state.status === "loaded" && state.catalog.questions.length === 0 ? (
        <section className="status-card status-card--empty">
          <h2>O catálogo está vazio</h2>
        </section>
      ) : null}

      {state.status === "loaded" && state.catalog.questions.length > 0 ? (
        <Examination catalog={state.catalog} />
      ) : null}
    </main>
  );
}
