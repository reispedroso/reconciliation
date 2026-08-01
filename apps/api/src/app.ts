import { apiErrorSchema } from "@addiopeccati/contracts";
import cors from "@fastify/cors";
import Fastify, { type FastifyInstance } from "fastify";

import { draftExaminationCatalogRoutes } from "./modules/examinations/draft-examination-catalog.routes.js";
import { examinationCatalogRoutes } from "./modules/examinations/examination-catalog.routes.js";
import type {
  GetCurrentExaminationCatalogService,
  GetDraftExaminationCatalogPreviewService,
} from "./modules/examinations/examination-catalog.service.js";
import { healthRoutes } from "./modules/health/health.routes.js";

export interface BuildAppOptions {
  catalogService: GetCurrentExaminationCatalogService;
  draftPreviewService?: GetDraftExaminationCatalogPreviewService;
  logger?: boolean;
  webOrigin?: string;
}

export function buildApp({
  catalogService,
  draftPreviewService,
  logger = false,
  webOrigin,
}: BuildAppOptions): FastifyInstance {
  const app = Fastify({ logger });

  app.setErrorHandler((error, request, reply) => {
    request.log.error({ error }, "Unhandled API error");

    return reply.status(500).send(
      apiErrorSchema.parse({
        error: {
          code: "internal_error",
          message: "An unexpected error occurred.",
        },
      }),
    );
  });

  if (webOrigin !== undefined) {
    void app.register(cors, {
      origin: webOrigin,
      methods: ["GET"],
    });
  }

  void app.register(healthRoutes);
  void app.register(examinationCatalogRoutes, {
    prefix: "/v1/examination-catalogs",
    service: catalogService,
  });

  if (draftPreviewService !== undefined) {
    void app.register(draftExaminationCatalogRoutes, {
      prefix: "/v1/examination-catalogs",
      service: draftPreviewService,
    });
  }

  return app;
}
