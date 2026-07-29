import { Decimal } from "@prisma/client/runtime/library";
import { toNumber } from "@/utils/currency";
import { toUtcDateOnly } from "@/utils/date";

export function decimalToNumber(value: Decimal | number | string | null | undefined): number {
  if (value == null) return 0;
  return toNumber(value);
}

export function toDecimal(value: number): Decimal {
  return new Decimal(value.toFixed(2));
}

export function mapTransaction<T extends {
  amount: Decimal;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
  installmentNumber: number | null;
  installmentTotal: number | null;
  installmentGroupId: string | null;
  notes: string | null;
}>(transaction: T) {
  return {
    ...transaction,
    amount: decimalToNumber(transaction.amount),
    date: toUtcDateOnly(transaction.date),
    createdAt: transaction.createdAt.toISOString(),
    updatedAt: transaction.updatedAt.toISOString(),
  };
}

export function mapAccount<T extends {
  initialBalance: Decimal;
  createdAt: Date;
  updatedAt: Date;
}>(account: T) {
  return {
    ...account,
    initialBalance: decimalToNumber(account.initialBalance),
    createdAt: account.createdAt.toISOString(),
    updatedAt: account.updatedAt.toISOString(),
  };
}

export function mapBudget<T extends {
  limitAmount: Decimal;
  unitCost?: Decimal | null;
  createdAt: Date;
  updatedAt: Date;
}>(budget: T) {
  return {
    ...budget,
    limitAmount: decimalToNumber(budget.limitAmount),
    unitCost:
      budget.unitCost == null ? null : decimalToNumber(budget.unitCost),
    createdAt: budget.createdAt.toISOString(),
    updatedAt: budget.updatedAt.toISOString(),
  };
}

export function mapGoal<T extends {
  targetAmount: Decimal;
  savedAmount: Decimal;
  deadline: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}>(goal: T) {
  return {
    ...goal,
    targetAmount: decimalToNumber(goal.targetAmount),
    savedAmount: decimalToNumber(goal.savedAmount),
    deadline: goal.deadline ? toUtcDateOnly(goal.deadline) : null,
    completedAt: goal.completedAt?.toISOString() ?? null,
    createdAt: goal.createdAt.toISOString(),
    updatedAt: goal.updatedAt.toISOString(),
  };
}
