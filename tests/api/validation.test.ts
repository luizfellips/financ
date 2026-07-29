import { describe, expect, it } from "vitest";
import {
  registerSchema,
  budgetSchema,
  transactionSchema,
  parseCalendarDate,
} from "@/server/validation/schemas";

describe("validation schemas", () => {
  it("accepts valid registration payload", () => {
    const result = registerSchema.safeParse({
      name: "Maria Silva",
      email: "maria@email.com",
      password: "Senha@123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects weak passwords", () => {
    const result = registerSchema.safeParse({
      name: "Maria",
      email: "maria@email.com",
      password: "fraca",
    });
    expect(result.success).toBe(false);
  });

  it("validates budget amounts", () => {
    const result = budgetSchema.safeParse({
      categoryId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
      month: 7,
      year: 2026,
      limitAmount: 500,
      alertAt: 80,
    });
    expect(result.success).toBe(true);
  });

  it("accepts budget title, description and unit controls", () => {
    const result = budgetSchema.safeParse({
      categoryId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
      month: 7,
      year: 2026,
      title: "Limite de energéticos",
      description: "No máximo 10 latas por mês",
      limitAmount: 80,
      unitCost: 8,
      quantityLimit: 10,
      alertAt: 80,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Limite de energéticos");
      expect(result.data.unitCost).toBe(8);
      expect(result.data.quantityLimit).toBe(10);
    }
  });

  it("normalizes empty budget title to null", () => {
    const result = budgetSchema.safeParse({
      categoryId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
      month: 7,
      year: 2026,
      title: "   ",
      limitAmount: 100,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title?.trim() || null).toBeNull();
    }
  });

  it("requires positive transaction amount", () => {
    const result = transactionSchema.safeParse({
      accountId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
      categoryId: "clyyyyyyyyyyyyyyyyyyyyyyyyy",
      type: "EXPENSE",
      title: "Teste",
      amount: -10,
      date: new Date(),
      paymentMethod: "PIX",
      recurrence: "NONE",
    });
    expect(result.success).toBe(false);
  });

  it("parses calendar dates as UTC noon", () => {
    const parsed = parseCalendarDate("2026-07-29");
    expect(parsed).toBeInstanceOf(Date);
    expect((parsed as Date).toISOString()).toBe("2026-07-29T12:00:00.000Z");

    const result = transactionSchema.safeParse({
      accountId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
      categoryId: "clyyyyyyyyyyyyyyyyyyyyyyyyy",
      type: "EXPENSE",
      title: "Aluguel",
      amount: 100,
      date: "2026-07-29",
      paymentMethod: "PIX",
      recurrence: "NONE",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.date.toISOString()).toBe("2026-07-29T12:00:00.000Z");
    }
  });

  it("accepts transfer without categoryId", () => {
    const result = transactionSchema.safeParse({
      accountId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
      transferToAccountId: "clzzzzzzzzzzzzzzzzzzzzzzzzz",
      type: "TRANSFER",
      title: "Entre contas",
      amount: 250,
      date: "2026-07-29",
      paymentMethod: "PIX",
      recurrence: "NONE",
    });
    expect(result.success).toBe(true);
  });

  it("rejects transfer to the same account", () => {
    const result = transactionSchema.safeParse({
      accountId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
      transferToAccountId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
      type: "TRANSFER",
      title: "Entre contas",
      amount: 250,
      date: "2026-07-29",
      paymentMethod: "PIX",
      recurrence: "NONE",
    });
    expect(result.success).toBe(false);
  });

  it("rejects income with transferToAccountId", () => {
    const result = transactionSchema.safeParse({
      accountId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
      transferToAccountId: "clzzzzzzzzzzzzzzzzzzzzzzzzz",
      categoryId: "clyyyyyyyyyyyyyyyyyyyyyyyyy",
      type: "INCOME",
      title: "Salário",
      amount: 1000,
      date: "2026-07-29",
      paymentMethod: "PIX",
      recurrence: "NONE",
    });
    expect(result.success).toBe(false);
  });
});
