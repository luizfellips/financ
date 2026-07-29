import { describe, expect, it } from "vitest";
import { safeCallbackUrl } from "@/lib/safe-callback-url";

describe("safeCallbackUrl", () => {
  it("defaults to /dashboard", () => {
    expect(safeCallbackUrl(null)).toBe("/dashboard");
    expect(safeCallbackUrl(undefined)).toBe("/dashboard");
    expect(safeCallbackUrl("")).toBe("/dashboard");
  });

  it("allows relative same-app paths", () => {
    expect(safeCallbackUrl("/dashboard")).toBe("/dashboard");
    expect(safeCallbackUrl("/transacoes?page=2")).toBe("/transacoes?page=2");
    expect(safeCallbackUrl("/relatorios#top")).toBe("/relatorios#top");
  });

  it("rejects absolute and protocol-relative URLs", () => {
    expect(safeCallbackUrl("https://evil.com")).toBe("/dashboard");
    expect(safeCallbackUrl("http://evil.com/phish")).toBe("/dashboard");
    expect(safeCallbackUrl("//evil.com")).toBe("/dashboard");
    expect(safeCallbackUrl("/\\evil.com")).toBe("/dashboard");
  });

  it("rejects @ and backslash tricks", () => {
    expect(safeCallbackUrl("/@evil.com")).toBe("/dashboard");
    expect(safeCallbackUrl("/foo\\bar")).toBe("/dashboard");
  });
});
