import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { currentExaminationCatalogSchema } from "@addiopeccati/contracts";
import { render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Examination } from "../components/Examination.js";
const catalog = currentExaminationCatalogSchema.parse(JSON.parse(readFileSync(resolve(process.cwd(), "../../content/editorial/pt-BR/examination-catalog.json"), "utf8")));
describe("Examination", () => {
  beforeEach(() => window.sessionStorage.clear());
  it("lists every selected affirmative option and omits denial", async () => { const user = userEvent.setup(); render(<Examination catalog={catalog} />); const group = screen.getByRole("group", { name: /CONFISSÃO E EUCARISTIA/ }); await user.click(within(group).getByLabelText(/Escondi conscientemente/)); for (let index = 1; index < catalog.questions.length; index += 1) await user.click(screen.getByRole("button", { name: /Continuar/ })); await user.click(screen.getByRole("button", { name: "Ver lista para a confissão" })); expect(screen.getByText("Ocultei deliberadamente um pecado mortal em confissão.")).toBeTruthy(); });
  it("shows success only after verified clear", async () => { const user = userEvent.setup(); render(<Examination catalog={catalog} />); await user.click(screen.getByRole("button", { name: "Limpar" })); await user.click(screen.getByRole("button", { name: "Apagar exame" })); expect(screen.getByRole("status").textContent).toContain("Tudo foi apagado"); });
  it("resets visible state and warns when storage removal cannot be confirmed", async () => { const user = userEvent.setup(); vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => undefined); window.sessionStorage.setItem("addiopeccati:other", "value"); render(<Examination catalog={catalog} />); await user.click(screen.getByRole("button", { name: "Limpar" })); await user.click(screen.getByRole("button", { name: "Apagar exame" })); expect(screen.getByRole("alertdialog")).toBeTruthy(); expect(screen.queryByRole("status")).toBeNull(); vi.restoreAllMocks(); });
  it("offers a reload action when clear fails", async () => { const user = userEvent.setup(); window.sessionStorage.setItem("addiopeccati:test", "value"); vi.spyOn(Storage.prototype, "key").mockImplementation(() => { throw new Error("blocked"); }); render(<Examination catalog={catalog} />); await user.click(screen.getByRole("button", { name: "Limpar" })); await user.click(screen.getByRole("button", { name: "Apagar exame" })); expect(screen.getByRole("button", { name: "Recarregar aplicação" })).toBeTruthy(); vi.restoreAllMocks(); });
});
