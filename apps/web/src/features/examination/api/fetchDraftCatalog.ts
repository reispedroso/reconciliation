import {
  apiErrorSchema,
  draftExaminationCatalogPreviewSchema,
  type DraftExaminationCatalogPreview,
} from "@confession/contracts";

const apiUrl =
  import.meta.env["VITE_API_URL"] ?? "http://127.0.0.1:3000";
const catalogCacheKey = "confession-app:editorial-catalog:0.3.0-draft";

function readCachedCatalog(): DraftExaminationCatalogPreview | null {
  try {
    const cachedValue = window.sessionStorage.getItem(catalogCacheKey);

    if (cachedValue === null) {
      return null;
    }

    const parsed: unknown = JSON.parse(cachedValue);
    const result = draftExaminationCatalogPreviewSchema.safeParse(parsed);

    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

function cacheCatalog(catalog: DraftExaminationCatalogPreview): void {
  try {
    window.sessionStorage.setItem(catalogCacheKey, JSON.stringify(catalog));
  } catch {
    // Editorial caching is optional; network loading remains the primary path.
  }
}

export async function fetchDraftCatalog(
  signal?: AbortSignal,
): Promise<DraftExaminationCatalogPreview> {
  const query = new URLSearchParams({
    locale: "pt-BR",
    catalogVersion: "0.3.0-draft",
  });
  let response: Response;

  try {
    response = await fetch(
      `${apiUrl}/v1/examination-catalogs/preview?${query.toString()}`,
      {
        method: "GET",
        ...(signal === undefined ? {} : { signal }),
      },
    );
  } catch (error) {
    if (signal?.aborted === true) {
      throw error;
    }

    const cachedCatalog = readCachedCatalog();

    if (cachedCatalog !== null) {
      return cachedCatalog;
    }

    throw error;
  }

  const payload: unknown = await response.json();

  if (!response.ok) {
    const parsedError = apiErrorSchema.safeParse(payload);
    const message = parsedError.success
      ? parsedError.data.error.message
      : "A API retornou um erro inesperado.";

    throw new Error(message);
  }

  const catalog = draftExaminationCatalogPreviewSchema.parse(payload);
  cacheCatalog(catalog);

  return catalog;
}
