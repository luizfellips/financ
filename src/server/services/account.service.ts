import { mapAccount, toDecimal } from "@/server/dto/mappers";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@/server/errors/app-error";
import { accountRepository } from "@/server/repositories/account.repository";
import { transactionRepository } from "@/server/repositories/transaction.repository";
import { getCurrentMonthYear, getMonthRange } from "@/utils/date";
import type { z } from "zod";
import type { accountSchema } from "@/server/validation/schemas";

type AccountInput = z.infer<typeof accountSchema>;

export type AccountListOptions = {
  includeArchived?: boolean;
  month?: number;
  year?: number;
};

function resolvePeriod(month?: number, year?: number) {
  const current = getCurrentMonthYear();
  const resolvedYear = year ?? current.year;
  const resolvedMonth = month ?? current.month;
  const { start, end } = getMonthRange(resolvedYear, resolvedMonth);
  return { year: resolvedYear, month: resolvedMonth, start, end };
}

async function withBalance(
  userId: string,
  account: Awaited<ReturnType<typeof accountRepository.findById>> & object,
  asOf: Date,
) {
  const [income, expense, transferOut, transferIn] = await Promise.all([
    transactionRepository.sumByAccountAndType(
      userId,
      account!.id,
      "INCOME",
      undefined,
      asOf,
    ),
    transactionRepository.sumByAccountAndType(
      userId,
      account!.id,
      "EXPENSE",
      undefined,
      asOf,
    ),
    transactionRepository.sumTransfersOut(userId, account!.id, undefined, asOf),
    transactionRepository.sumTransfersIn(userId, account!.id, undefined, asOf),
  ]);
  const mapped = mapAccount(account!);
  return {
    ...mapped,
    balance:
      Math.round(
        (mapped.initialBalance + income - expense - transferOut + transferIn) *
          100,
      ) / 100,
  };
}

export const accountService = {
  async list(userId: string, options: AccountListOptions = {}) {
    const { includeArchived = false, month, year } = options;
    const { end } = resolvePeriod(month, year);
    const accounts = await accountRepository.findManyByUser(userId, {
      includeArchived,
    });
    return Promise.all(
      accounts.map((account) => withBalance(userId, account, end)),
    );
  },

  async getById(
    userId: string,
    id: string,
    options: { month?: number; year?: number } = {},
  ) {
    const account = await accountRepository.findById(userId, id);
    if (!account) {
      throw new NotFoundError("Conta não encontrada");
    }
    const { end } = resolvePeriod(options.month, options.year);
    return withBalance(userId, account, end);
  },

  async create(userId: string, input: AccountInput) {
    const account = await accountRepository.create(userId, {
      name: input.name,
      type: input.type,
      currency: input.currency,
      initialBalance: toDecimal(input.initialBalance),
      color: input.color,
      icon: input.icon,
      isDefault: input.isDefault ?? false,
    });

    return {
      ...mapAccount(account),
      balance: input.initialBalance,
    };
  },

  async update(
    userId: string,
    id: string,
    input: Partial<AccountInput> & { archived?: boolean },
  ) {
    const existing = await accountRepository.findById(userId, id);
    if (!existing) {
      throw new NotFoundError("Conta não encontrada");
    }

    const account = await accountRepository.update(userId, id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.currency !== undefined ? { currency: input.currency } : {}),
      ...(input.initialBalance !== undefined
        ? { initialBalance: toDecimal(input.initialBalance) }
        : {}),
      ...(input.color !== undefined ? { color: input.color } : {}),
      ...(input.icon !== undefined ? { icon: input.icon } : {}),
      ...(input.isDefault !== undefined ? { isDefault: input.isDefault } : {}),
      ...(input.archived !== undefined ? { archived: input.archived } : {}),
    });

    const { end } = resolvePeriod();
    return withBalance(userId, account, end);
  },

  async delete(userId: string, id: string) {
    const existing = await accountRepository.findById(userId, id);
    if (!existing) {
      throw new NotFoundError("Conta não encontrada");
    }

    const txCount = await accountRepository.countTransactions(userId, id);
    if (txCount > 0) {
      throw new ConflictError(
        "Não é possível excluir uma conta com transações. Arquive-a em vez disso.",
      );
    }

    if (existing.isDefault) {
      throw new ValidationError(
        "Não é possível excluir a conta padrão. Defina outra conta como padrão primeiro.",
      );
    }

    await accountRepository.delete(userId, id);
    return { id };
  },
};
