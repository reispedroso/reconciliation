import { readFileSync } from "node:fs";
import { currentExaminationCatalogSchema } from "@addiopeccati/contracts";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildApp } from "./app.js";
import { GetCurrentExaminationCatalogService } from "./modules/examinations/examination-catalog.service.js";
const catalog = currentExaminationCatalogSchema.parse(JSON.parse(readFileSync(new URL("../../../content/editorial/pt-BR/examination-catalog.json", import.meta.url), "utf8")));
const apps: ReturnType<typeof buildApp>[] = [];
function createApp(value: typeof catalog | null = catalog) { const repository = { findCurrentByLocale: vi.fn(async () => value) }; const app = buildApp({ catalogService: new GetCurrentExaminationCatalogService(repository) }); apps.push(app); return { app, repository }; }
afterEach(async () => { await Promise.all(apps.splice(0).map((app) => app.close())); });
describe("API", () => {
  it("serves the current catalog", async () => { const { app, repository } = createApp(); const response = await app.inject({ method: "GET", url: "/v1/examination-catalogs/current?locale=pt-BR" }); expect(response.statusCode).toBe(200); expect(currentExaminationCatalogSchema.safeParse(response.json()).success).toBe(true); expect(repository.findCurrentByLocale).toHaveBeenCalledWith("pt-BR"); });
  it("returns a standardized unavailable error", async () => { const { app } = createApp(null); const response = await app.inject({ method: "GET", url: "/v1/examination-catalogs/current?locale=pt-BR" }); expect(response.statusCode).toBe(404); expect(response.json().error.code).toBe("catalog_not_found"); });
  it("does not register preview", async () => { const { app } = createApp(); const response = await app.inject({ method: "GET", url: "/v1/examination-catalogs/preview" }); expect(response.statusCode).toBe(404); });
});
