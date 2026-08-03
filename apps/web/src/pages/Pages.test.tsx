import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { HomePage } from "./HomePage.js";
import { NotFoundPage } from "./NotFoundPage.js";

describe("static pages", () => {
  it("presents the introduction and three preparation principles", () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Faça seu exame com oração e humildade",
      }),
    ).toBeTruthy();
    expect(screen.getAllByRole("article")).toHaveLength(3);
    expect(
      screen.getByRole("link", { name: "Iniciar exame de consciência" })
        .getAttribute("href"),
    ).toBe("/exame");
  });

  it("offers a clear way back from an unknown route", () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    );

    const statusCard = screen.getByRole("heading", {
      level: 1,
      name: "Página não encontrada",
    }).parentElement;

    if (statusCard === null) {
      throw new Error("Expected the not found status card.");
    }

    expect(
      within(statusCard).getByRole("link", { name: "Voltar ao início" })
        .getAttribute("href"),
    ).toBe("/");
  });
});
