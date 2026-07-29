import type {
  CurrentExaminationCatalogQuery,
  PublishedExaminationCatalog,
} from "@confession/contracts";

export interface PublishedExaminationCatalogRepository {
  findCurrentPublishedByLocale(
    locale: CurrentExaminationCatalogQuery["locale"],
  ): Promise<PublishedExaminationCatalog | null>;
}

export class CatalogNotFoundError extends Error {
  public constructor(locale: string) {
    super(`No published examination catalog exists for locale ${locale}.`);
    this.name = "CatalogNotFoundError";
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

