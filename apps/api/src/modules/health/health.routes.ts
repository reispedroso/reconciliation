import { healthResponseSchema } from "@addiopeccati/contracts";
import type { FastifyPluginAsync } from "fastify";

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get("/health", async (_request, reply) => {
    return reply.send(healthResponseSchema.parse({ status: "ok" }));
  });
};

