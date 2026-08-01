import {
  apiErrorSchema,
  draftExaminationCatalogPreviewSchema,
  type DraftExaminationCatalogPreview,
} from "@confession/contracts";

const apiUrl =
  import.meta.env["VITE_API_URL"] ?? "http://127.0.0.1:3000";

export async function fetchDraftCatalog(
  signal?: AbortSignal,
): Promise<DraftExaminationCatalogPreview> {
  const query = new URLSearchParams({
    locale: "pt-BR",
    catalogVersion: "0.3.0-draft",
  });
  const response = await fetch(
    `${apiUrl}/v1/examination-catalogs/preview?${query.toString()}`,
    {
      method: "GET",
      ...(signal === undefined ? {} : { signal }),
    },
  );
  const payload: unknown = await response.json();

  if (!response.ok) {
    const parsedError = apiErrorSchema.safeParse(payload);
    const message = parsedError.success
      ? parsedError.data.error.message
      : "A API retornou um erro inesperado.";

    throw new Error(message);
  }

  return draftExaminationCatalogPreviewSchema.parse(payload);
}
