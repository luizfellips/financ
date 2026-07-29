import { addMonths } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { mapTransaction, toDecimal } from "@/server/dto/mappers";
import {
  NotFoundError,
  ValidationError,
} from "@/server/errors/app-error";
import { accountRepository } from "@/server/repositories/account.repository";
import { categoryRepository } from "@/server/repositories/category.repository";
import {
  transactionRepository,
  type CreateTransactionData,
} from "@/server/repositories/transaction.repository";
import type { TransactionType } from "@prisma/client";
import type { z } from "zod";
import type {
  transactionFilterSchema,
  transactionSchema,
  transactionUpdateSchema,
} from "@/server/validation/schemas";

type TransactionInput = z.infer<typeof transactionSchema>;
type TransactionUpdateInput = z.infer<typeof transactionUpdateSchema>;
type TransactionFilterInput = z.infer<typeof transactionFilterSchema>;

function splitInstallmentAmounts(total: number, count: number): number[] {
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / count);
  const remainder = cents - base * count;
  return Array.from({ length: count }, (_, i) => {
    const amountCents = base + (i < remainder ? 1 : 0);
    return amountCents / 100;
  });
}

async function assertAccountAndCategory(
  userId: string,
  accountId: string,
  categoryId: string,
  type: TransactionType,
) {
  const [account, category] = await Promise.all([
    accountRepository.findById(userId, accountId),
    categoryRepository.findById(userId, categoryId),
  ]);

  if (!account || account.archived) {
    throw new NotFoundError("Conta não encontrada");
  }
  if (!category) {
    throw new NotFoundError("Categoria não encontrada");
  }
  if (category.type !== type) {
    throw new ValidationError(
      "O tipo da categoria não corresponde ao tipo da transação",
    );
  }
}

export const transactionService = {
  async list(userId: string, filters: TransactionFilterInput) {
    const { items, total } = await transactionRepository.findMany(userId, {
      page: filters.page,
      pageSize: filters.pageSize,
      search: filters.search,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      type: filters.type,
      categoryId: filters.categoryId,
      accountId: filters.accountId,
      month: filters.month,
      year: filters.year,
      minAmount: filters.minAmount,
      maxAmount: filters.maxAmount,
      recurring: filters.recurring,
    });

    return {
      items: items.map(mapTransaction),
      meta: {
        page: filters.page,
        pageSize: filters.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
      },
    };
  },

  async listByType(
    userId: string,
    type: TransactionType,
    filters: Omit<TransactionFilterInput, "type">,
  ) {
    return this.list(userId, { ...filters, type });
  },

  async getById(userId: string, id: string) {
    const transaction = await transactionRepository.findById(userId, id);
    if (!transaction) {
      throw new NotFoundError("Transação não encontrada");
    }
    return mapTransaction(transaction);
  },

  async create(userId: string, input: TransactionInput) {
    await assertAccountAndCategory(
      userId,
      input.accountId,
      input.categoryId,
      input.type,
    );

    const installmentTotal = input.installmentTotal ?? 1;
    const isRecurring =
      input.isRecurring ||
      (input.recurrence !== undefined && input.recurrence !== "NONE");

    if (installmentTotal > 1) {
      const groupId = uuidv4();
      const amounts = splitInstallmentAmounts(input.amount, installmentTotal);
      const baseDate = new Date(input.date);

      const items: CreateTransactionData[] = amounts.map((amount, index) => ({
        accountId: input.accountId,
        categoryId: input.categoryId,
        type: input.type,
        title:
          installmentTotal > 1
            ? `${input.title} (${index + 1}/${installmentTotal})`
            : input.title,
        amount: toDecimal(amount),
        date: addMonths(baseDate, index),
        notes: input.notes ?? null,
        paymentMethod: input.paymentMethod,
        recurrence: "NONE",
        isRecurring: false,
        installmentNumber: index + 1,
        installmentTotal,
        installmentGroupId: groupId,
      }));

      const created = await transactionRepository.createManyAndReturn(
        userId,
        items,
      );
      return created.map(mapTransaction);
    }

    const created = await transactionRepository.create(userId, {
      accountId: input.accountId,
      categoryId: input.categoryId,
      type: input.type,
      title: input.title,
      amount: toDecimal(input.amount),
      date: input.date,
      notes: input.notes ?? null,
      paymentMethod: input.paymentMethod,
      recurrence: input.recurrence,
      isRecurring,
      installmentNumber: null,
      installmentTotal: null,
      installmentGroupId: null,
    });

    return mapTransaction(created);
  },

  async update(userId: string, id: string, input: TransactionUpdateInput) {
    const existing = await transactionRepository.findById(userId, id);
    if (!existing) {
      throw new NotFoundError("Transação não encontrada");
    }

    const nextAccountId = input.accountId ?? existing.accountId;
    const nextCategoryId = input.categoryId ?? existing.categoryId;
    const nextType = input.type ?? existing.type;

    if (
      input.accountId ||
      input.categoryId ||
      input.type
    ) {
      await assertAccountAndCategory(
        userId,
        nextAccountId,
        nextCategoryId,
        nextType,
      );
    }

    const isRecurring =
      input.isRecurring !== undefined
        ? input.isRecurring
        : input.recurrence !== undefined
          ? input.recurrence !== "NONE"
          : undefined;

    const updated = await transactionRepository.update(userId, id, {
      ...(input.accountId !== undefined ? { accountId: input.accountId } : {}),
      ...(input.categoryId !== undefined
        ? { categoryId: input.categoryId }
        : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.amount !== undefined
        ? { amount: toDecimal(input.amount) }
        : {}),
      ...(input.date !== undefined ? { date: input.date } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.paymentMethod !== undefined
        ? { paymentMethod: input.paymentMethod }
        : {}),
      ...(input.recurrence !== undefined
        ? { recurrence: input.recurrence }
        : {}),
      ...(isRecurring !== undefined ? { isRecurring } : {}),
    });

    return mapTransaction(updated);
  },

  async delete(userId: string, id: string, deleteGroup = false) {
    const existing = await transactionRepository.findById(userId, id);
    if (!existing) {
      throw new NotFoundError("Transação não encontrada");
    }

    if (deleteGroup && existing.installmentGroupId) {
      await transactionRepository.deleteByInstallmentGroup(
        userId,
        existing.installmentGroupId,
      );
      return { id, deletedGroup: true, groupId: existing.installmentGroupId };
    }

    await transactionRepository.delete(userId, id);
    return { id, deletedGroup: false };
  },
};
