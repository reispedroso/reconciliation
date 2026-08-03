import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@fontsource/cinzel/latin-600.css";
import "@fontsource/poppins/latin-400.css";
import "@fontsource/poppins/latin-400-italic.css";
import "@fontsource/poppins/latin-600.css";

import { App } from "./app/App.js";
import "./styles/global.css";

const rootElement = document.querySelector<HTMLDivElement>("#root");

if (rootElement === null) {
  throw new Error("Application root element was not found.");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
