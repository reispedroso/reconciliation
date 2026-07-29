import { readFileSync } from "node:fs";

import {
  examinationCatalogSchema,
  publishedExaminationCatalogSchema,
  type PublishedExaminationCatalog,
} from "@confession/contracts";
import { afterEach, describe, expect, it, vi } from "vitest";

import { buildApp } from "./app.js";
import { GetCurrentExaminationCatalogService } from "./modules/examinations/examination-catalog.service.js";

const catalogUrl = new URL(
  "../../../content/editorial/pt-BR/examination-catalog.v2.json",
  import.meta.url,
);
const draftCatalog = examinationCatalogSchema.parse(
  JSON.parse(readFileSync(catalogUrl, "utf8")),
);
const {
  editorial: _editorial,
  sourceArtifact: _sourceArtifact,
  ...catalogContent
} = draftCatalog;
const publishedCatalog = publishedExaminationCatalogSchema.parse({
  ...catalogContent,
  catalogVersion: "0.2.0",
  reviewedAt: "2026-07-29T12:00:00.000Z",
  publishedAt: "2026-07-29T13:00:00.000Z",
});

const apps: ReturnType<typeof buildApp>[] = [];

function createApp(catalog: PublishedExaminationCatalog | null) {
  const repository = {
    findCurrentPublishedByLocale: vi.fn(async () => catalog),
  };
  const app = buildApp({
    catalogService: new GetCurrentExaminationCatalogService(repository),
  });
  apps.push(app);

  return { app, repository };
}

afterEach(async () => {
  await Promise.all(apps.splice(0).map(async (app) => app.close()));
});

describe("API", () => {
  it("reports health without consulting the catalog repository", async () => {
    const { app, repository } = createApp(null);
    const response = await app.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });
    expect(repository.findCurrentPublishedByLocale).not.toHaveBeenCalled();
  });

  it("returns the current published catalog through the public contract", async () => {
    const { app, repository } = createApp(publishedCatalog);
    const response = await app.inject({
      method: "GET",
      url: "/v1/examination-catalogs/current?locale=pt-BR",
    });

    expect(response.statusCode).toBe(200);
    expect(
      publishedExaminationCatalogSchema.safeParse(response.json()).success,
    ).toBe(true);
    expect(response.json().questions).toHaveLength(9);
    expect(repository.findCurrentPublishedByLocale).toHaveBeenCalledWith(
      "pt-BR",
    );
    expect(response.body).not.toContain("sourceArtifact");
  });

  it("returns a standardized 404 when no published catalog exists", async () => {
    const { app } = createApp(null);
    const response = await app.inject({
      method: "GET",
      url: "/v1/examination-catalogs/current?locale=pt-BR",
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: {
        code: "catalog_not_found",
        message:
          "No published examination catalog was found for this locale.",
      },
    });
  });

  it("rejects unsupported or missing locales before consulting persistence", async () => {
    const { app, repository } = createApp(publishedCatalog);
    const unsupported = await app.inject({
      method: "GET",
      url: "/v1/examination-catalogs/current?locale=en-US",
    });
    const missing = await app.inject({
      method: "GET",
      url: "/v1/examination-catalogs/current",
    });

    expect(unsupported.statusCode).toBe(400);
    expect(missing.statusCode).toBe(400);
    expect(unsupported.json().error.code).toBe("invalid_request");
    expect(repository.findCurrentPublishedByLocale).not.toHaveBeenCalled();
  });

  it("does not expose unexpected errors", async () => {
    const repository = {
      findCurrentPublishedByLocale: vi.fn(async () => {
        throw new Error("database secret");
      }),
    };
    const app = buildApp({
      catalogService: new GetCurrentExaminationCatalogService(repository),
    });
    apps.push(app);
    const response = await app.inject({
      method: "GET",
      url: "/v1/examination-catalogs/current?locale=pt-BR",
    });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({
      error: {
        code: "internal_error",
        message: "An unexpected error occurred.",
      },
    });
    expect(response.body).not.toContain("database secret");
  });
});

