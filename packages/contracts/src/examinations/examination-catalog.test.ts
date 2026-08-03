import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { currentExaminationCatalogQuerySchema, currentExaminationCatalogSchema } from "./examination-catalog.js";
const catalog = JSON.parse(readFileSync(new URL("../../../../content/editorial/pt-BR/examination-catalog.json", import.meta.url), "utf8"));
describe("current examination catalog contract", () => {
  it("validates the single current catalog", () => { const parsed = currentExaminationCatalogSchema.parse(catalog); expect(parsed.questions).toHaveLength(9); expect(parsed.questions.flatMap(({ options }) => options)).toHaveLength(76); });
  it("rejects obsolete editorial metadata", () => { expect(currentExaminationCatalogSchema.safeParse({ ...catalog, editorial: {} }).success).toBe(false); });
  it("accepts only the supported locale", () => { expect(currentExaminationCatalogQuerySchema.safeParse({ locale: "pt-BR" }).success).toBe(true); expect(currentExaminationCatalogQuerySchema.safeParse({ locale: "en-US" }).success).toBe(false); });
});
