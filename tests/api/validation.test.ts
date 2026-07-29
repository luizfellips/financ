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
});
