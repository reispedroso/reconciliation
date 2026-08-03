import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <main id="main-content" className="page-shell home-page">
      <header className="hero home-hero">
        <p className="eyebrow">Exame de consciência</p>
        <h1>Faça seu exame com oração e humildade</h1>
        <p className="hero-copy">
          Leia os mandamentos de Deus e os ensinamentos de Cristo. Reflita com
          sinceridade sobre suas escolhas e prepare, em privado, o que precisa
          confessar ao sacerdote.
        </p>
        <div className="hero-actions">
          <Link className="primary-link" to="/exame">
            Iniciar exame de consciência
          </Link>
        </div>
      </header>

      <section className="home-principles" aria-labelledby="principles-title">
        <header className="home-section-heading">
          <h2 id="principles-title">Antes de começar</h2>
        </header>

        <div className="principles">
          <article className="principle-card">
            <p className="section-number" aria-hidden="true">
              01
            </p>
            <h3>Reze antes de começar</h3>
            <p>
              Peça a Deus luz para reconhecer suas faltas sem medo nem
              desculpas. Faça o exame com atenção, oração e humildade.
            </p>
          </article>

          <article className="principle-card">
            <p className="section-number" aria-hidden="true">
              02
            </p>
            <h3>Marque somente o que se aplica</h3>
            <p>
              Não se trata de marcar tudo. Leia cada item com calma e selecione
              apenas aquilo que realmente aconteceu e que você deseja
              confessar.
            </p>
          </article>

          <article className="principle-card">
            <p className="section-number" aria-hidden="true">
              03
            </p>
            <h3>Cuidado com os escrúpulos</h3>
            <p>
              Não confunda tentação, dúvida ou pensamento involuntário com uma
              escolha deliberada. Se você sofre com escrúpulos, siga a
              orientação do seu confessor.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
