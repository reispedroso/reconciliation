import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  draftExaminationCatalogPreviewSchema,
  examinationCatalogSchema,
} from "@confession/contracts";
import { describe, expect, it, vi } from "vitest";

import { fetchDraftCatalog } from "../api/fetchDraftCatalog.js";

const catalogCacheKey = "confession-app:editorial-catalog:0.3.0-draft";
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

describe("fetchDraftCatalog", () => {
  it("caches a successfully loaded editorial catalog for the current tab", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(previewCatalog), {
          headers: { "Content-Type": "application/json" },
          status: 200,
        }),
      ),
    );

    const result = await fetchDraftCatalog();

    expect(result.catalogVersion).toBe(previewCatalog.catalogVersion);
    expect(window.sessionStorage.getItem(catalogCacheKey)).not.toBeNull();
  });

  it("uses the tab cache when the network becomes unavailable", async () => {
    window.sessionStorage.setItem(
      catalogCacheKey,
      JSON.stringify(previewCatalog),
    );
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Network unavailable")),
    );

    await expect(fetchDraftCatalog()).resolves.toEqual(previewCatalog);
  });
});
