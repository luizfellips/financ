import { mapAccount, toDecimal } from "@/server/dto/mappers";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@/server/errors/app-error";
import { accountRepository } from "@/server/repositories/account.repository";
import { transactionRepository } from "@/server/repositories/transaction.repository";
import type { z } from "zod";
import type { accountSchema } from "@/server/validation/schemas";

type AccountInput = z.infer<typeof accountSchema>;

async function withBalance(
  userId: string,
  account: Awaited<ReturnType<typeof accountRepository.findById>> & object,
) {
  const [income, expense] = await Promise.all([
    transactionRepository.sumByAccountAndType(userId, account!.id, "INCOME"),
    transactionRepository.sumByAccountAndType(userId, account!.id, "EXPENSE"),
  ]);
  const mapped = mapAccount(account!);
  return {
    ...mapped,
    balance: mapped.initialBalance + income - expense,
  };
}

export const accountService = {
  async list(userId: string, includeArchived = false) {
    const accounts = await accountRepository.findManyByUser(userId, {
      includeArchived,
    });
    return Promise.all(accounts.map((account) => withBalance(userId, account)));
  },

  async getById(userId: string, id: string) {
    const account = await accountRepository.findById(userId, id);
    if (!account) {
      throw new NotFoundError("Conta não encontrada");
    }
    return withBalance(userId, account);
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

    return withBalance(userId, account);
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
