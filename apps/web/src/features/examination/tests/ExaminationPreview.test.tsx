import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  draftExaminationCatalogPreviewSchema,
  examinationCatalogSchema,
} from "@confession/contracts";
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

describe("ExaminationPreview", () => {
  it("keeps multiple affirmative options selected in the same group", async () => {
    const user = userEvent.setup();
    render(<ExaminationPreview catalog={previewCatalog} />);
    const group = screen.getByRole("group", {
      name: /CONFISSÃO E EUCARISTIA/,
    });
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
    expect(screen.getByText("1 de 9")).toBeTruthy();
  });

  it("clears and disables affirmative options when the denial is selected", async () => {
    const user = userEvent.setup();
    render(<ExaminationPreview catalog={previewCatalog} />);
    const group = screen.getByRole("group", {
      name: /CONFISSÃO E EUCARISTIA/,
    });
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
});
