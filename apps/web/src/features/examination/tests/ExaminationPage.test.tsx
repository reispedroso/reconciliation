import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { ExaminationPage } from "../../../pages/ExaminationPage.js";
import { CatalogFetchError, fetchCurrentCatalog } from "../api/fetchCurrentCatalog.js";
vi.mock("../api/fetchCurrentCatalog.js", () => ({ CatalogFetchError: class extends Error { kind: string; constructor(kind: string) { super(kind); this.kind = kind; } }, fetchCurrentCatalog: vi.fn() }));
describe("ExaminationPage", () => { it("shows a friendly unavailable state", async () => { vi.mocked(fetchCurrentCatalog).mockRejectedValue(new CatalogFetchError("unavailable")); render(<MemoryRouter><ExaminationPage /></MemoryRouter>); expect(await screen.findByRole("heading", { name: "Exame temporariamente indisponível" })).toBeTruthy(); }); });
