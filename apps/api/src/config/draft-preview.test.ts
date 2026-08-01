import { describe, expect, it } from "vitest";

import { isDraftPreviewEnabled } from "./draft-preview.js";

describe("draft preview configuration", () => {
  it("requires the explicit preview flag", () => {
    expect(isDraftPreviewEnabled({ NODE_ENV: "development" })).toBe(false);
    expect(
      isDraftPreviewEnabled({
        NODE_ENV: "development",
        ENABLE_DRAFT_PREVIEW: "true",
      }),
    ).toBe(true);
  });

  it("cannot be enabled in production", () => {
    expect(
      isDraftPreviewEnabled({
        NODE_ENV: "production",
        ENABLE_DRAFT_PREVIEW: "true",
      }),
    ).toBe(false);
  });
});
