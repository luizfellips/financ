import { describe, expect, it } from "vitest";
import {
  clampPercent,
  formatCurrency,
  parseCurrencyInput,
  toNumber,
} from "@/utils/currency";

describe("currency utils", () => {
  it("formats BRL currency", () => {
    expect(formatCurrency(1234.5)).toMatch(/R\$\s*1\.234,50/);
  });

  it("parses pt-BR currency input", () => {
    expect(parseCurrencyInput("1.234,56")).toBeCloseTo(1234.56);
    expect(parseCurrencyInput("99,90")).toBeCloseTo(99.9);
  });

  it("converts decimal-like values to number", () => {
    expect(toNumber("150.25")).toBeCloseTo(150.25);
    expect(toNumber(10)).toBe(10);
    expect(toNumber({ toNumber: () => 42 })).toBe(42);
  });

  it("clamps percent values", () => {
    expect(clampPercent(150)).toBe(100);
    expect(clampPercent(-10)).toBe(0);
    expect(clampPercent(55)).toBe(55);
  });
});
