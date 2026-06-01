import { describe, it, expect } from "vitest";
import { buildSplitsPayload, validateSplitsClientSide } from "./SplitSelector";

const selected = { a: true, b: true, c: false };

describe("buildSplitsPayload", () => {
  it("equal split returns only selected user ids", () => {
    expect(buildSplitsPayload("equal", selected, {}, {})).toEqual([
      { user_id: "a" },
      { user_id: "b" },
    ]);
  });

  it("exact split parses amounts for selected members", () => {
    expect(buildSplitsPayload("exact", selected, { a: "10", b: "5.50" }, {})).toEqual([
      { user_id: "a", amount: 10 },
      { user_id: "b", amount: 5.5 },
    ]);
  });

  it("percentage split parses percentages for selected members", () => {
    expect(buildSplitsPayload("percentage", selected, {}, { a: "60", b: "40" })).toEqual([
      { user_id: "a", percentage: 60 },
      { user_id: "b", percentage: 40 },
    ]);
  });
});

describe("validateSplitsClientSide", () => {
  it("rejects an empty selection", () => {
    expect(validateSplitsClientSide("equal", 100, [])).toMatch(/at least one/i);
  });

  it("accepts a valid equal split", () => {
    expect(validateSplitsClientSide("equal", 100, [{ user_id: "a" }])).toBeNull();
  });

  it("rejects exact splits that do not sum to the total", () => {
    const payload = [
      { user_id: "a", amount: 10 },
      { user_id: "b", amount: 5 },
    ];
    expect(validateSplitsClientSide("exact", 100, payload)).toMatch(/must equal total/i);
  });

  it("accepts exact splits within the rounding tolerance", () => {
    const payload = [
      { user_id: "a", amount: 50 },
      { user_id: "b", amount: 50 },
    ];
    expect(validateSplitsClientSide("exact", 100, payload)).toBeNull();
  });

  it("rejects percentages that do not sum to 100", () => {
    const payload = [
      { user_id: "a", percentage: 60 },
      { user_id: "b", percentage: 30 },
    ];
    expect(validateSplitsClientSide("percentage", 100, payload)).toMatch(/sum to 100/i);
  });
});
