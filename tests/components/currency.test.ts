import { describe, expect, it } from "vitest";
import {
  clampPercent,
  extractMoneyDigits,
  formatCurrency,
  parseCurrencyInput,
  parseMoneyDigits,
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

  it("parses digit-as-cents money mask", () => {
    expect(parseMoneyDigits("1")).toBeCloseTo(0.01);
    expect(parseMoneyDigits("12")).toBeCloseTo(0.12);
    expect(parseMoneyDigits("123")).toBeCloseTo(1.23);
    expect(parseMoneyDigits("15050")).toBeCloseTo(150.5);
    expect(parseMoneyDigits("00100")).toBeCloseTo(1);
    expect(parseMoneyDigits("15050", { negative: true })).toBeCloseTo(-150.5);
    expect(parseMoneyDigits("")).toBe(0);
  });

  it("extracts only digits from formatted money", () => {
    expect(extractMoneyDigits("R$ 1.234,56")).toBe("123456");
    expect(extractMoneyDigits("-R$ 10,00")).toBe("1000");
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
