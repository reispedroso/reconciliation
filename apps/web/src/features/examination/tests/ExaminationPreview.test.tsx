import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  draftExaminationCatalogPreviewSchema,
  examinationCatalogSchema,
} from "@addiopeccati/contracts";
import { render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { ExaminationPreview } from "../components/ExaminationPreview.js";

const catalogPath = resolve(
  process.cwd(),
  "../../content/editorial/pt-BR/examination-catalog.v3.json",
);
const draftCatalog = examinationCatalogSchema.parse(
  JSON.parse(readFileSync(catalogPath, "utf8")),
);
const {
  editorial: _editorial,
  sourceArtifact: _sourceArtifact,
  ...catalogContent
} = draftCatalog;
const previewCatalog = draftExaminationCatalogPreviewSchema.parse({
  ...catalogContent,
  preview: {
    status: "draft",
    requiresClericalReview: true,
  },
});

function asCheckbox(element: HTMLElement): HTMLInputElement {
  if (!(element instanceof HTMLInputElement)) {
    throw new Error("Expected a checkbox input.");
  }

  return element;
}

function firstQuestionGroup(): HTMLElement {
  return screen.getByRole("group", {
    name: /CONFISSÃO E EUCARISTIA/,
  });
}

describe("ExaminationPreview", () => {
  it("shows one section at a time and advances without requiring an answer", async () => {
    const user = userEvent.setup();
    render(<ExaminationPreview catalog={previewCatalog} />);

    expect(firstQuestionGroup()).toBeTruthy();
    expect(
      screen.queryByRole("group", { name: /AMAR A DEUS SOBRE TODAS AS COISAS/ }),
    ).toBeNull();

    await user.click(screen.getByRole("button", { name: /Continuar/ }));

    expect(
      screen.getByRole("group", { name: /AMAR A DEUS SOBRE TODAS AS COISAS/ }),
    ).toBeTruthy();
    expect(
      screen.getByText("Pode ser revisado depois"),
    ).toBeTruthy();
  });

  it("expands the three mortal sin criteria and links to the official source", async () => {
    const user = userEvent.setup();
    render(<ExaminationPreview catalog={previewCatalog} />);
    const group = firstQuestionGroup();
    const trigger = within(group).getByRole("button", {
      name: /Entenda as três condições do pecado mortal/,
    });
    const disclosure = within(group).getByText("Quando um pecado é mortal?")
      .parentElement;

    if (disclosure === null) {
      throw new Error("Expected the criteria disclosure.");
    }

    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(disclosure.hidden).toBe(true);

    await user.click(trigger);

    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(disclosure.hidden).toBe(false);
    expect(within(disclosure).getByText("Matéria grave")).toBeTruthy();
    expect(within(disclosure).getByText("Plena consciência")).toBeTruthy();
    expect(
      within(disclosure).getByText("Consentimento deliberado"),
    ).toBeTruthy();

    const sourceLink = within(disclosure).getByRole("link", {
      name: /Catecismo da Igreja Católica.*abre em nova aba/,
    });

    expect(sourceLink.getAttribute("href")).toBe(
      "https://www.vatican.va/archive/cathechism_po/index_new/p3s1cap1_1699-1876_po.html",
    );
    expect(sourceLink.getAttribute("target")).toBe("_blank");
  });

  it("keeps the compact criteria help preference between sections", async () => {
    const user = userEvent.setup();
    render(<ExaminationPreview catalog={previewCatalog} />);
    const compactButton = screen.getByRole("button", {
      name: /Mostrar apenas o ícone de ajuda/,
    });

    await user.click(compactButton);

    const firstHelpButton = screen.getByRole("button", {
      name: "Entenda as três condições do pecado mortal",
    });

    expect(firstHelpButton.textContent).toBe("?");

    await user.click(screen.getByRole("button", { name: /Continuar/ }));

    const nextHelpButton = screen.getByRole("button", {
      name: "Entenda as três condições do pecado mortal",
    });

    expect(nextHelpButton.textContent).toBe("?");

    await user.click(nextHelpButton);

    expect(nextHelpButton.getAttribute("aria-expanded")).toBe("true");
  });

  it("keeps multiple affirmative options selected in the same group", async () => {
    const user = userEvent.setup();
    render(<ExaminationPreview catalog={previewCatalog} />);
    const group = firstQuestionGroup();
    const concealedSin = asCheckbox(
      within(group).getByLabelText(/Escondi conscientemente/),
    );
    const communion = asCheckbox(
      within(group).getByLabelText(/Recebi a Sagrada Comunhão/),
    );

    await user.click(concealedSin);
    await user.click(communion);

    expect(concealedSin.checked).toBe(true);
    expect(communion.checked).toBe(true);
    expect(screen.getByText("1 grupo revisado")).toBeTruthy();
  });

  it("clears and disables affirmative options when the denial is selected", async () => {
    const user = userEvent.setup();
    render(<ExaminationPreview catalog={previewCatalog} />);
    const group = firstQuestionGroup();
    const concealedSin = asCheckbox(
      within(group).getByLabelText(/Escondi conscientemente/),
    );
    const denial = asCheckbox(
      within(group).getByLabelText(/Não pratiquei nenhuma das condutas acima/),
    );

    await user.click(concealedSin);
    await user.click(denial);

    expect(concealedSin.checked).toBe(false);
    expect(concealedSin.disabled).toBe(true);
    expect(denial.checked).toBe(true);

    await user.click(denial);

    expect(denial.checked).toBe(false);
    expect(concealedSin.disabled).toBe(false);
  });

  it("retains a selection while navigating away and back", async () => {
    const user = userEvent.setup();
    render(<ExaminationPreview catalog={previewCatalog} />);
    const concealedSin = asCheckbox(
      within(firstQuestionGroup()).getByLabelText(/Escondi conscientemente/),
    );

    await user.click(concealedSin);
    await user.click(screen.getByRole("button", { name: /Continuar/ }));
    await user.click(screen.getByRole("button", { name: /Voltar/ }));

    expect(
      asCheckbox(
        within(firstQuestionGroup()).getByLabelText(/Escondi conscientemente/),
      ).checked,
    ).toBe(true);
  });

  it("restores the private state when the flow is remounted in the same tab", async () => {
    const user = userEvent.setup();
    const firstRender = render(<ExaminationPreview catalog={previewCatalog} />);
    const concealedSin = asCheckbox(
      within(firstQuestionGroup()).getByLabelText(/Escondi conscientemente/),
    );

    await user.click(concealedSin);
    await user.click(screen.getByRole("button", { name: /Continuar/ }));
    firstRender.unmount();
    render(<ExaminationPreview catalog={previewCatalog} />);

    expect(
      screen.getByRole("group", { name: /AMAR A DEUS SOBRE TODAS AS COISAS/ }),
    ).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /Voltar/ }));

    expect(
      asCheckbox(
        within(firstQuestionGroup()).getByLabelText(/Escondi conscientemente/),
      ).checked,
    ).toBe(true);
  });

  it("requires confirmation before clearing all private selections", async () => {
    const user = userEvent.setup();
    render(<ExaminationPreview catalog={previewCatalog} />);
    const concealedSin = asCheckbox(
      within(firstQuestionGroup()).getByLabelText(/Escondi conscientemente/),
    );

    await user.click(concealedSin);
    await user.click(screen.getByRole("button", { name: "Limpar" }));

    expect(concealedSin.checked).toBe(true);

    await user.click(screen.getByRole("button", { name: "Apagar exame" }));

    expect(
      asCheckbox(
        within(firstQuestionGroup()).getByLabelText(/Escondi conscientemente/),
      ).checked,
    ).toBe(false);
    expect(screen.getByText("0 grupos revisados")).toBeTruthy();
  });

  it("ends with an honest preview notice instead of a moral classification", async () => {
    const user = userEvent.setup();
    render(<ExaminationPreview catalog={previewCatalog} />);

    for (let index = 1; index < previewCatalog.questions.length; index += 1) {
      await user.click(screen.getByRole("button", { name: /Continuar/ }));
    }

    await user.click(screen.getByRole("button", { name: "Concluir revisão" }));

    expect(
      screen.getByRole("heading", {
        name: "Você chegou ao final das seções",
      }),
    ).toBeTruthy();
    expect(
      screen.getByText(/não constituem uma lista de pecados confirmados/),
    ).toBeTruthy();
  });
});
