export interface DraftPreviewEnvironment {
  readonly NODE_ENV?: string;
  readonly ENABLE_DRAFT_PREVIEW?: string;
}

export function isDraftPreviewEnabled(
  environment: DraftPreviewEnvironment,
): boolean {
  return (
    environment.NODE_ENV !== "production" &&
    environment.ENABLE_DRAFT_PREVIEW === "true"
  );
}
