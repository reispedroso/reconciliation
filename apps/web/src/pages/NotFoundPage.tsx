import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <main id="main-content" className="page-shell status-page">
      <p className="eyebrow">Erro 404</p>
      <h1>Página não encontrada</h1>
      <Link className="text-link" to="/">
        Voltar ao início
      </Link>
    </main>
  );
}

