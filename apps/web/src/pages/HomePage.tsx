import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <main id="main-content" className="page-shell home-page">
      <header className="hero">
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

      <section className="principles" aria-labelledby="principles-title">
        <div>
          <p className="section-number">01</p>
          <h2 id="principles-title">Reze antes de começar</h2>
          <p>
            Peça a Deus luz para reconhecer suas faltas sem medo nem desculpas.
            Faça o exame com atenção, oração e humildade.
          </p>
        </div>
        <div>
          <p className="section-number">02</p>
          <h2>Marque somente o que se aplica</h2>
          <p>
            Não se trata de marcar tudo. Leia cada item com calma e selecione
            apenas aquilo que realmente aconteceu e que você deseja confessar.
          </p>
        </div>
        <div>
          <p className="section-number">03</p>
          <h2>Cuidado com os escrúpulos</h2>
          <p>
            Não confunda tentação, dúvida ou pensamento involuntário com uma
            escolha deliberada. Se você sofre com escrúpulos, siga a orientação
            do seu confessor.
          </p>
        </div>
      </section>
    </main>
  );
}
