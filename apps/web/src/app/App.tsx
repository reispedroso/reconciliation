import { BrowserRouter, Route, Routes } from "react-router-dom";

import { ExaminationPreviewPage } from "../pages/ExaminationPreviewPage.js";
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
        <Route path="/preview" element={<ExaminationPreviewPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

