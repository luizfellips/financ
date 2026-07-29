import { describe, expect, it } from "vitest";
import { backupSchema } from "@/server/validation/schemas";

const validBackup = {
  version: 1 as const,
  exportedAt: "2026-07-29T00:00:00.000Z",
  accounts: [
    {
      id: "acc1",
      name: "Conta",
      type: "CHECKING" as const,
      currency: "BRL",
      initialBalance: 0,
      color: "#6366f1",
      icon: "Wallet",
      isDefault: true,
      archived: false,
    },
  ],
  categories: [
    {
      id: "cat1",
      name: "Moradia",
      type: "EXPENSE" as const,
      color: "#ef4444",
      icon: "Home",
      isSystem: true,
    },
  ],
  transactions: [],
  budgets: [],
  goals: [],
  settings: null,
};

describe("backupSchema", () => {
  it("accepts a valid backup", () => {
    const parsed = backupSchema.safeParse(validBackup);
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid account type", () => {
    const parsed = backupSchema.safeParse({
      ...validBackup,
      accounts: [{ ...validBackup.accounts[0], type: "NOT_A_TYPE" }],
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects oversized accounts array", () => {
    const accounts = Array.from({ length: 51 }, (_, i) => ({
      ...validBackup.accounts[0],
      id: `acc${i}`,
      name: `Conta ${i}`,
      isDefault: i === 0,
    }));
    const parsed = backupSchema.safeParse({ ...validBackup, accounts });
    expect(parsed.success).toBe(false);
  });

  it("rejects wrong version", () => {
    const parsed = backupSchema.safeParse({ ...validBackup, version: 2 });
    expect(parsed.success).toBe(false);
  });
});
