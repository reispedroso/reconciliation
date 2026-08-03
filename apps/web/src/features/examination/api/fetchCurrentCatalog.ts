import { apiErrorSchema, currentExaminationCatalogSchema, type CurrentExaminationCatalog } from "@addiopeccati/contracts";
const apiUrl = import.meta.env["VITE_API_URL"] ?? "http://127.0.0.1:3000";
export class CatalogFetchError extends Error { public constructor(public readonly kind: "unavailable" | "network" | "invalid-response" | "internal") { super(kind); } }
export async function fetchCurrentCatalog(signal?: AbortSignal): Promise<CurrentExaminationCatalog> {
  let response: Response;
  try { response = await fetch(`${apiUrl}/v1/examination-catalogs/current?locale=pt-BR`, { method: "GET", ...(signal === undefined ? {} : { signal }) }); }
  catch (error) { if (signal?.aborted) throw error; throw new CatalogFetchError("network"); }
  let payload: unknown;
  try { payload = await response.json(); } catch { throw new CatalogFetchError("invalid-response"); }
  if (!response.ok) { const parsed = apiErrorSchema.safeParse(payload); throw new CatalogFetchError(parsed.success && parsed.data.error.code === "catalog_not_found" ? "unavailable" : "internal"); }
  const catalog = currentExaminationCatalogSchema.safeParse(payload);
  if (!catalog.success) throw new CatalogFetchError("invalid-response");
  return catalog.data;
}
