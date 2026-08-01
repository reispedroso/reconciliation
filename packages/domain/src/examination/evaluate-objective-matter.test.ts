import { describe, expect, it } from "vitest";

import {
  evaluateConductConfirmation,
  evaluateObjectiveMatter,
  type ObjectiveMatterRule,
} from "./evaluate-objective-matter.js";

const allRule = {
  classification: "grave_when_conditions_met",
  operator: "all",
  conditions: [
    { code: "first", requiredAnswer: "yes" },
    { code: "exception", requiredAnswer: "no" },
  ],
} satisfies ObjectiveMatterRule;

const anyRule = {
  classification: "grave_when_conditions_met",
  operator: "any",
  conditions: [
    { code: "grave-value", requiredAnswer: "yes" },
    { code: "vulnerable-victim", requiredAnswer: "yes" },
  ],
} satisfies ObjectiveMatterRule;

describe("objective matter rule", () => {
  it("establishes always-grave matter without extra answers", () => {
    expect(
      evaluateObjectiveMatter({ classification: "always_grave" }, {}),
    ).toBe("grave_matter");
  });

  it("requires every expected answer for an all rule", () => {
    expect(
      evaluateObjectiveMatter(allRule, { first: "yes", exception: "no" }),
    ).toBe("grave_matter");
    expect(
      evaluateObjectiveMatter(allRule, { first: "yes", exception: "yes" }),
    ).toBe("not_established");
  });

  it("establishes an any rule as soon as one condition matches", () => {
    expect(
      evaluateObjectiveMatter(anyRule, {
        "grave-value": "no",
        "vulnerable-victim": "yes",
      }),
    ).toBe("grave_matter");
  });

  it("keeps missing answers pending but never accepts unsure", () => {
    expect(evaluateObjectiveMatter(allRule, { first: "yes" })).toBe(
      "pending",
    );
    expect(
      evaluateObjectiveMatter(allRule, {
        first: "yes",
        exception: "unsure",
      }),
    ).toBe("not_established");
    expect(
      evaluateObjectiveMatter(anyRule, {
        "grave-value": "unsure",
        "vulnerable-victim": "unanswered",
      }),
    ).toBe("pending");
  });

  it("rejects an invalid empty conditional rule", () => {
    expect(() =>
      evaluateObjectiveMatter(
        {
          classification: "grave_when_conditions_met",
          operator: "all",
          conditions: [],
        },
        {},
      ),
    ).toThrow(/requires conditions/);
  });
});

describe("conduct confirmation", () => {
  const prompts = [{ code: "voluntary", requiredAnswer: "yes" }] as const;

  it("requires explicit confirmation and treats unsure as not confirmed", () => {
    expect(evaluateConductConfirmation(prompts, {})).toBe("pending");
    expect(evaluateConductConfirmation(prompts, { voluntary: "yes" })).toBe(
      "confirmed",
    );
    expect(evaluateConductConfirmation(prompts, { voluntary: "no" })).toBe(
      "not_confirmed",
    );
    expect(
      evaluateConductConfirmation(prompts, { voluntary: "unsure" }),
    ).toBe("not_confirmed");
  });
});

