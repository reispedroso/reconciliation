import {
  apiErrorSchema,
  draftExaminationCatalogPreviewQuerySchema,
  draftExaminationCatalogPreviewSchema,
  type ApiError,
} from "@addiopeccati/contracts";
import type { FastifyPluginAsync } from "fastify";

import {
  DraftCatalogNotFoundError,
  type GetDraftExaminationCatalogPreviewService,
} from "./examination-catalog.service.js";

interface DraftExaminationCatalogRoutesOptions {
  service: GetDraftExaminationCatalogPreviewService;
}

function errorResponse(
  code: ApiError["error"]["code"],
  message: string,
): ApiError {
  return apiErrorSchema.parse({ error: { code, message } });
}

export const draftExaminationCatalogRoutes: FastifyPluginAsync<
  DraftExaminationCatalogRoutesOptions
> = async (app, { service }) => {
  app.get("/preview", async (request, reply) => {
    const parsedQuery = draftExaminationCatalogPreviewQuerySchema.safeParse(
      request.query,
    );

    if (!parsedQuery.success) {
      return reply.status(400).send(
        errorResponse(
          "invalid_request",
          "Query parameters locale and catalogVersion must identify a draft catalog.",
        ),
      );
    }

    try {
      const catalog = await service.execute(parsedQuery.data);

      return reply.send(draftExaminationCatalogPreviewSchema.parse(catalog));
    } catch (error) {
      if (error instanceof DraftCatalogNotFoundError) {
        return reply.status(404).send(
          errorResponse(
            "catalog_not_found",
            "The requested draft examination catalog was not found.",
          ),
        );
      }

      throw error;
    }
  });
};

