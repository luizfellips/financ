import { describe, expect, it } from "vitest";
import { clampPercent } from "@/utils/currency";

function computeBudgetProgress(limitAmount: number, spent: number) {
  const remaining = limitAmount - spent;
  const percent = limitAmount <= 0 ? 0 : clampPercent((spent / limitAmount) * 100);
  const exceeded = spent > limitAmount;
  const warning = !exceeded && percent >= 80;
  return { remaining, percent, exceeded, warning };
}

describe("budget calculation", () => {
  it("calculates remaining and percent", () => {
    const result = computeBudgetProgress(1000, 250);
    expect(result.remaining).toBe(750);
    expect(result.percent).toBe(25);
    expect(result.exceeded).toBe(false);
    expect(result.warning).toBe(false);
  });

  it("flags warning near limit", () => {
    const result = computeBudgetProgress(1000, 850);
    expect(result.warning).toBe(true);
    expect(result.exceeded).toBe(false);
  });

  it("flags exceeded budgets", () => {
    const result = computeBudgetProgress(500, 600);
    expect(result.exceeded).toBe(true);
    expect(result.remaining).toBe(-100);
    expect(result.percent).toBe(100);
  });
});

describe("budget unit metrics", () => {
  function computeUnitMetrics(
    spent: number,
    limit: number,
    unitCost: number | null,
    quantityLimit: number | null,
  ) {
    if (unitCost == null || unitCost <= 0) {
      return {
        estimatedQuantity: null as number | null,
        quantityRemaining: null as number | null,
        potentialSavings: null as number | null,
      };
    }

    const estimatedQuantity = Math.round((spent / unitCost) * 10) / 10;
    const quantityRemaining =
      quantityLimit != null
        ? Math.round((quantityLimit - estimatedQuantity) * 10) / 10
        : null;
    const overUnits =
      quantityLimit != null
        ? Math.max(0, estimatedQuantity - quantityLimit)
        : Math.max(0, spent - limit) / unitCost;
    const potentialSavings = Math.round(overUnits * unitCost * 100) / 100;

    return { estimatedQuantity, quantityRemaining, potentialSavings };
  }

  it("estimates quantity and savings for unit-based budgets", () => {
    const result = computeUnitMetrics(120, 80, 8, 10);
    expect(result.estimatedQuantity).toBe(15);
    expect(result.quantityRemaining).toBe(-5);
    expect(result.potentialSavings).toBe(40);
  });

  it("shows remaining units under the limit", () => {
    const result = computeUnitMetrics(40, 80, 8, 10);
    expect(result.estimatedQuantity).toBe(5);
    expect(result.quantityRemaining).toBe(5);
    expect(result.potentialSavings).toBe(0);
  });
});

describe("installment split", () => {
  function splitInstallments(totalAmount: number, installments: number) {
    const base = Math.floor((totalAmount / installments) * 100) / 100;
    const amounts = Array.from({ length: installments }, () => base);
    const allocated = base * installments;
    const remainder = Number((totalAmount - allocated).toFixed(2));
    amounts[installments - 1] = Number((amounts[installments - 1]! + remainder).toFixed(2));
    return amounts;
  }

  it("splits amount across installments preserving total", () => {
    const parts = splitInstallments(1000, 3);
    expect(parts).toHaveLength(3);
    const sum = Number(parts.reduce((acc, value) => acc + value, 0).toFixed(2));
    expect(sum).toBe(1000);
  });
});
