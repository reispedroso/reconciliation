import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <main id="main-content" className="page-shell home-page">
      <header className="hero">
        <p className="eyebrow">Exame de consciência</p>
        <h1>Prepare-se com serenidade e clareza</h1>
        <p className="hero-copy">
          Um auxiliar privado para recordar pontos relevantes antes da
          confissão. Ele não substitui o sacerdote, o sacramento ou a formação
          da consciência.
        </p>
        <div className="hero-actions">
          <Link className="primary-link" to="/preview">
            Iniciar exame de consciência
          </Link>
        </div>
      </header>

      <section className="principles" aria-labelledby="principles-title">
        <div>
          <p className="section-number">01</p>
          <h2 id="principles-title">Privado por arquitetura</h2>
          <p>
            Suas marcações ficam somente nesta aba. Esta versão não envia
            respostas, observações ou progresso para o servidor.
          </p>
        </div>
        <div>
          <p className="section-number">02</p>
          <h2>Conteúdo em revisão</h2>
          <p>
            A tela seguinte usa um catálogo rascunho para desenvolvimento. Ele
            ainda não representa conteúdo publicado.
          </p>
        </div>
        <div>
          <p className="section-number">03</p>
          <h2>Primeiro fluxo</h2>
          <p>
            Neste marco você poderá percorrer as seções e testar os checkboxes.
            A avaliação completa e o PDF virão depois.
          </p>
        </div>
      </section>
    </main>
  );
}
