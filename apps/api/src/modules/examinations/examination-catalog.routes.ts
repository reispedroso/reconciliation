import {
  apiErrorSchema,
  currentExaminationCatalogQuerySchema,
  publishedExaminationCatalogSchema,
  type ApiError,
} from "@confession/contracts";
import type { FastifyPluginAsync } from "fastify";

import {
  CatalogNotFoundError,
  type GetCurrentExaminationCatalogService,
} from "./examination-catalog.service.js";

interface ExaminationCatalogRoutesOptions {
  service: GetCurrentExaminationCatalogService;
}

function errorResponse(
  code: ApiError["error"]["code"],
  message: string,
): ApiError {
  return apiErrorSchema.parse({ error: { code, message } });
}

export const examinationCatalogRoutes: FastifyPluginAsync<
  ExaminationCatalogRoutesOptions
> = async (app, { service }) => {
  app.get("/current", async (request, reply) => {
    const parsedQuery = currentExaminationCatalogQuerySchema.safeParse(
      request.query,
    );

    if (!parsedQuery.success) {
      return reply
        .status(400)
        .send(errorResponse("invalid_request", "Query parameter locale must be pt-BR."));
    }

    try {
      const catalog = await service.execute(parsedQuery.data);

      return reply.send(publishedExaminationCatalogSchema.parse(catalog));
    } catch (error) {
      if (error instanceof CatalogNotFoundError) {
        return reply
          .status(404)
          .send(
            errorResponse(
              "catalog_not_found",
              "No published examination catalog was found for this locale.",
            ),
          );
      }

      throw error;
    }
  });
};

