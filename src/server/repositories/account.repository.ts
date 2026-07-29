import type { Account, AccountType } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/prisma";

export type CreateAccountData = {
  name: string;
  type: AccountType;
  currency: string;
  initialBalance: Decimal | number;
  color: string;
  icon: string;
  isDefault: boolean;
};

export type UpdateAccountData = Partial<CreateAccountData> & {
  archived?: boolean;
};

export const accountRepository = {
  async findManyByUser(
    userId: string,
    options: { includeArchived?: boolean } = {},
  ): Promise<Account[]> {
    return prisma.account.findMany({
      where: {
        userId,
        ...(options.includeArchived ? {} : { archived: false }),
      },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });
  },

  async findById(userId: string, id: string): Promise<Account | null> {
    return prisma.account.findFirst({
      where: { id, userId },
    });
  },

  async findDefault(userId: string): Promise<Account | null> {
    return prisma.account.findFirst({
      where: { userId, isDefault: true, archived: false },
    });
  },

  async create(userId: string, data: CreateAccountData): Promise<Account> {
    return prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.account.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.account.create({
        data: {
          userId,
          name: data.name,
          type: data.type,
          currency: data.currency,
          initialBalance: data.initialBalance,
          color: data.color,
          icon: data.icon,
          isDefault: data.isDefault,
        },
      });
    });
  },

  async update(
    userId: string,
    id: string,
    data: UpdateAccountData,
  ): Promise<Account> {
    return prisma.$transaction(async (tx) => {
      if (data.isDefault === true) {
        await tx.account.updateMany({
          where: { userId, isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }

      return tx.account.update({
        where: { id },
        data: {
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.type !== undefined ? { type: data.type } : {}),
          ...(data.currency !== undefined ? { currency: data.currency } : {}),
          ...(data.initialBalance !== undefined
            ? { initialBalance: data.initialBalance }
            : {}),
          ...(data.color !== undefined ? { color: data.color } : {}),
          ...(data.icon !== undefined ? { icon: data.icon } : {}),
          ...(data.isDefault !== undefined ? { isDefault: data.isDefault } : {}),
          ...(data.archived !== undefined ? { archived: data.archived } : {}),
        },
      });
    });
  },

  async delete(userId: string, id: string): Promise<Account> {
    const account = await prisma.account.findFirst({ where: { id, userId } });
    if (!account) {
      throw new Error("NOT_FOUND");
    }
    return prisma.account.delete({ where: { id } });
  },

  async countTransactions(userId: string, id: string): Promise<number> {
    return prisma.transaction.count({
      where: { userId, accountId: id },
    });
  },

  async sumInitialBalances(userId: string): Promise<Decimal> {
    const result = await prisma.account.aggregate({
      where: { userId, archived: false },
      _sum: { initialBalance: true },
    });
    return result._sum.initialBalance ?? new Decimal(0);
  },
};
