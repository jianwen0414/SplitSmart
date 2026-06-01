import { describe, it, expect } from "vitest";
import { getErrorMessage } from "./api";

function axiosLike(detail: unknown, message = "request failed") {
  return Object.assign(new Error(message), {
    isAxiosError: true,
    response: { data: { detail } },
  });
}

describe("getErrorMessage", () => {
  it("reads message from a structured backend error", () => {
    const err = axiosLike({ code: "VALIDATION_ERROR", message: "invalid category" });
    expect(getErrorMessage(err)).toBe("invalid category");
  });

  it("reads a plain string detail", () => {
    const err = axiosLike("not found");
    expect(getErrorMessage(err)).toBe("not found");
  });

  it("falls back to the axios message when no detail", () => {
    const err = axiosLike(undefined, "Network Error");
    expect(getErrorMessage(err)).toBe("Network Error");
  });

  it("handles a non-axios Error", () => {
    expect(getErrorMessage(new Error("boom"))).toBe("boom");
  });

  it("uses the provided fallback for unknown values", () => {
    expect(getErrorMessage(null, "Failed to load")).toBe("Failed to load");
  });
});
