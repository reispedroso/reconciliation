import { BrowserRouter, Route, Routes } from "react-router-dom";

import { ExaminationPage } from "../pages/ExaminationPage.js";
import { HomePage } from "../pages/HomePage.js";
import { NotFoundPage } from "../pages/NotFoundPage.js";

export function App() {
  return (
    <BrowserRouter>
      <a className="skip-link" href="#main-content">
        Ir para o conteúdo principal
      </a>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/exame" element={<ExaminationPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
