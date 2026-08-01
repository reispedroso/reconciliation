import { createDatabase } from "@confession/database";

import { buildApp } from "./app.js";
import { isDraftPreviewEnabled } from "./config/draft-preview.js";
import { DrizzlePublishedExaminationCatalogRepository } from "./modules/examinations/examination-catalog.repository.js";
import {
  GetCurrentExaminationCatalogService,
  GetDraftExaminationCatalogPreviewService,
} from "./modules/examinations/examination-catalog.service.js";

const databaseUrl = process.env["DATABASE_URL"];

if (databaseUrl === undefined) {
  throw new Error(
    "DATABASE_URL is required. Copy .env.example to .env before starting the API.",
  );
}

const portValue = Number(process.env["API_PORT"] ?? "3000");

if (!Number.isInteger(portValue) || portValue < 1 || portValue > 65_535) {
  throw new Error("API_PORT must be an integer between 1 and 65535.");
}

const { client, database } = createDatabase(databaseUrl);
const repository = new DrizzlePublishedExaminationCatalogRepository(database);
const service = new GetCurrentExaminationCatalogService(repository);
const draftPreviewEnabled = isDraftPreviewEnabled(process.env);
const draftPreviewService = draftPreviewEnabled
  ? new GetDraftExaminationCatalogPreviewService(repository)
  : undefined;
const app = buildApp({
  catalogService: service,
  ...(draftPreviewService === undefined ? {} : { draftPreviewService }),
  logger: true,
  webOrigin: process.env["WEB_ORIGIN"] ?? "http://127.0.0.1:5173",
});

app.addHook("onClose", async () => {
  await client.end();
});

await app.listen({
  host: process.env["API_HOST"] ?? "127.0.0.1",
  port: portValue,
});
