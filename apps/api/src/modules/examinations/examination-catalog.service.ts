import type {
  CurrentExaminationCatalogQuery,
  DraftExaminationCatalogPreview,
  DraftExaminationCatalogPreviewQuery,
  PublishedExaminationCatalog,
} from "@confession/contracts";

export interface PublishedExaminationCatalogRepository {
  findCurrentPublishedByLocale(
    locale: CurrentExaminationCatalogQuery["locale"],
  ): Promise<PublishedExaminationCatalog | null>;
}

export interface DraftExaminationCatalogPreviewRepository {
  findDraftByVersion(
    query: DraftExaminationCatalogPreviewQuery,
  ): Promise<DraftExaminationCatalogPreview | null>;
}

export class CatalogNotFoundError extends Error {
  public constructor(locale: string) {
    super(`No published examination catalog exists for locale ${locale}.`);
    this.name = "CatalogNotFoundError";
  }
}

export class DraftCatalogNotFoundError extends Error {
  public constructor(catalogVersion: string, locale: string) {
    super(`Draft catalog ${catalogVersion} does not exist for locale ${locale}.`);
    this.name = "DraftCatalogNotFoundError";
  }
}

export class GetCurrentExaminationCatalogService {
  public constructor(
    private readonly repository: PublishedExaminationCatalogRepository,
  ) {}

  public async execute(
    query: CurrentExaminationCatalogQuery,
  ): Promise<PublishedExaminationCatalog> {
    const catalog = await this.repository.findCurrentPublishedByLocale(
      query.locale,
    );

    if (catalog === null) {
      throw new CatalogNotFoundError(query.locale);
    }

    return catalog;
  }
}

export class GetDraftExaminationCatalogPreviewService {
  public constructor(
    private readonly repository: DraftExaminationCatalogPreviewRepository,
  ) {}

  public async execute(
    query: DraftExaminationCatalogPreviewQuery,
  ): Promise<DraftExaminationCatalogPreview> {
    const catalog = await this.repository.findDraftByVersion(query);

    if (catalog === null) {
      throw new DraftCatalogNotFoundError(
        query.catalogVersion,
        query.locale,
      );
    }

    return catalog;
  }
}
