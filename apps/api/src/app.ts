import { apiErrorSchema } from "@addiopeccati/contracts";
import cors from "@fastify/cors";
import Fastify, { type FastifyInstance } from "fastify";

import { examinationCatalogRoutes } from "./modules/examinations/examination-catalog.routes.js";
import type {
  GetCurrentExaminationCatalogService,
} from "./modules/examinations/examination-catalog.service.js";
import { healthRoutes } from "./modules/health/health.routes.js";

export interface BuildAppOptions {
  catalogService: GetCurrentExaminationCatalogService;
  logger?: boolean;
  webOrigin?: string;
}

export function buildApp({
  catalogService,
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

  return app;
}
