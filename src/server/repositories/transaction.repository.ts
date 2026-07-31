import type {
  PaymentMethod,
  Prisma,
  RecurrenceInterval,
  Transaction,
  TransactionType,
} from "@prisma/client";
import type { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/prisma";
import { getCurrentMonthYear, getMonthRange, getYearRange } from "@/utils/date";

export type TransactionWithRelations = Transaction & {
  account: { id: string; name: string; color: string; icon: string };
  transferToAccount: {
    id: string;
    name: string;
    color: string;
    icon: string;
  } | null;
  category: { id: string; name: string; color: string; icon: string; type: TransactionType };
};

export type CreateTransactionData = {
  accountId: string;
  transferToAccountId?: string | null;
  categoryId: string;
  type: TransactionType;
  title: string;
  amount: Decimal | number;
  date: Date;
  notes?: string | null;
  paymentMethod: PaymentMethod;
  recurrence: RecurrenceInterval;
  isRecurring: boolean;
  installmentNumber?: number | null;
  installmentTotal?: number | null;
  installmentGroupId?: string | null;
};

export type UpdateTransactionData = Partial<CreateTransactionData>;

export type TransactionListFilters = {
  type?: TransactionType | "ALL";
  categoryId?: string;
  accountId?: string;
  month?: number;
  year?: number;
  minAmount?: number;
  maxAmount?: number;
  recurring?: "true" | "false" | "all";
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
};

export type TransactionListOptions = TransactionListFilters & {
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
};

const SORTABLE_FIELDS = new Set([
  "date",
  "amount",
  "title",
  "createdAt",
  "type",
]);

function buildWhere(
  userId: string,
  filters: TransactionListFilters,
): Prisma.TransactionWhereInput {
  const where: Prisma.TransactionWhereInput = { userId };

  if (filters.type && filters.type !== "ALL") {
    where.type = filters.type;
  }
  if (filters.categoryId) {
    where.categoryId = filters.categoryId;
  }
  if (filters.accountId) {
    where.AND = [
      ...(Array.isArray(where.AND)
        ? where.AND
        : where.AND
          ? [where.AND]
          : []),
      {
        OR: [
          { accountId: filters.accountId },
          { transferToAccountId: filters.accountId },
        ],
      },
    ];
  }
  if (filters.recurring === "true") {
    where.isRecurring = true;
  } else if (filters.recurring === "false") {
    where.isRecurring = false;
  }
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { notes: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  if (filters.month) {
    // A month with no year selected applies to the current year.
    const year = filters.year ?? getCurrentMonthYear().year;
    const { start, end } = getMonthRange(year, filters.month);
    where.date = { gte: start, lte: end };
  } else if (filters.year) {
    const { start, end } = getYearRange(filters.year);
    where.date = { gte: start, lte: end };
  } else if (filters.dateFrom || filters.dateTo) {
    where.date = {
      ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
      ...(filters.dateTo ? { lte: filters.dateTo } : {}),
    };
  }

  if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
    where.amount = {
      ...(filters.minAmount !== undefined ? { gte: filters.minAmount } : {}),
      ...(filters.maxAmount !== undefined ? { lte: filters.maxAmount } : {}),
    };
  }

  return where;
}

const includeRelations = {
  account: { select: { id: true, name: true, color: true, icon: true } },
  transferToAccount: {
    select: { id: true, name: true, color: true, icon: true },
  },
  category: {
    select: { id: true, name: true, color: true, icon: true, type: true },
  },
} as const;

export const transactionRepository = {
  async findMany(
    userId: string,
    options: TransactionListOptions,
  ): Promise<{ items: TransactionWithRelations[]; total: number }> {
    const where = buildWhere(userId, options);
    const sortBy = SORTABLE_FIELDS.has(options.sortBy) ? options.sortBy : "date";
    const orderBy: Prisma.TransactionOrderByWithRelationInput = {
      [sortBy]: options.sortOrder,
    };

    const [items, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: includeRelations,
        orderBy,
        skip: (options.page - 1) * options.pageSize,
        take: options.pageSize,
      }),
      prisma.transaction.count({ where }),
    ]);

    return { items, total };
  },

  async findById(
    userId: string,
    id: string,
  ): Promise<TransactionWithRelations | null> {
    return prisma.transaction.findFirst({
      where: { id, userId },
      include: includeRelations,
    });
  },

  async create(
    userId: string,
    data: CreateTransactionData,
  ): Promise<TransactionWithRelations> {
    return prisma.transaction.create({
      data: {
        userId,
        accountId: data.accountId,
        transferToAccountId: data.transferToAccountId ?? null,
        categoryId: data.categoryId,
        type: data.type,
        title: data.title,
        amount: data.amount,
        date: data.date,
        notes: data.notes ?? null,
        paymentMethod: data.paymentMethod,
        recurrence: data.recurrence,
        isRecurring: data.isRecurring,
        installmentNumber: data.installmentNumber ?? null,
        installmentTotal: data.installmentTotal ?? null,
        installmentGroupId: data.installmentGroupId ?? null,
      },
      include: includeRelations,
    });
  },

  async createMany(
    userId: string,
    items: CreateTransactionData[],
  ): Promise<Prisma.BatchPayload> {
    return prisma.transaction.createMany({
      data: items.map((data) => ({
        userId,
        accountId: data.accountId,
        transferToAccountId: data.transferToAccountId ?? null,
        categoryId: data.categoryId,
        type: data.type,
        title: data.title,
        amount: data.amount,
        date: data.date,
        notes: data.notes ?? null,
        paymentMethod: data.paymentMethod,
        recurrence: data.recurrence,
        isRecurring: data.isRecurring,
        installmentNumber: data.installmentNumber ?? null,
        installmentTotal: data.installmentTotal ?? null,
        installmentGroupId: data.installmentGroupId ?? null,
      })),
    });
  },

  async createManyAndReturn(
    userId: string,
    items: CreateTransactionData[],
  ): Promise<TransactionWithRelations[]> {
    return prisma.$transaction(async (tx) => {
      const created: TransactionWithRelations[] = [];
      for (const data of items) {
        const row = await tx.transaction.create({
          data: {
            userId,
            accountId: data.accountId,
            transferToAccountId: data.transferToAccountId ?? null,
            categoryId: data.categoryId,
            type: data.type,
            title: data.title,
            amount: data.amount,
            date: data.date,
            notes: data.notes ?? null,
            paymentMethod: data.paymentMethod,
            recurrence: data.recurrence,
            isRecurring: data.isRecurring,
            installmentNumber: data.installmentNumber ?? null,
            installmentTotal: data.installmentTotal ?? null,
            installmentGroupId: data.installmentGroupId ?? null,
          },
          include: includeRelations,
        });
        created.push(row);
      }
      return created;
    });
  },

  async update(
    userId: string,
    id: string,
    data: UpdateTransactionData,
  ): Promise<TransactionWithRelations> {
    const existing = await prisma.transaction.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new Error("NOT_FOUND");
    }

    return prisma.transaction.update({
      where: { id },
      data: {
        ...(data.accountId !== undefined ? { accountId: data.accountId } : {}),
        ...(data.transferToAccountId !== undefined
          ? { transferToAccountId: data.transferToAccountId }
          : {}),
        ...(data.categoryId !== undefined
          ? { categoryId: data.categoryId }
          : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.amount !== undefined ? { amount: data.amount } : {}),
        ...(data.date !== undefined ? { date: data.date } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(data.paymentMethod !== undefined
          ? { paymentMethod: data.paymentMethod }
          : {}),
        ...(data.recurrence !== undefined
          ? { recurrence: data.recurrence }
          : {}),
        ...(data.isRecurring !== undefined
          ? { isRecurring: data.isRecurring }
          : {}),
        ...(data.installmentNumber !== undefined
          ? { installmentNumber: data.installmentNumber }
          : {}),
        ...(data.installmentTotal !== undefined
          ? { installmentTotal: data.installmentTotal }
          : {}),
        ...(data.installmentGroupId !== undefined
          ? { installmentGroupId: data.installmentGroupId }
          : {}),
      },
      include: includeRelations,
    });
  },

  async delete(userId: string, id: string): Promise<Transaction> {
    const existing = await prisma.transaction.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new Error("NOT_FOUND");
    }
    return prisma.transaction.delete({ where: { id } });
  },

  async deleteByInstallmentGroup(
    userId: string,
    installmentGroupId: string,
  ): Promise<Prisma.BatchPayload> {
    return prisma.transaction.deleteMany({
      where: { userId, installmentGroupId },
    });
  },

  async sumByType(
    userId: string,
    type: TransactionType,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<number> {
    const result = await prisma.transaction.aggregate({
      where: {
        userId,
        type,
        ...(dateFrom || dateTo
          ? {
              date: {
                ...(dateFrom ? { gte: dateFrom } : {}),
                ...(dateTo ? { lte: dateTo } : {}),
              },
            }
          : {}),
      },
      _sum: { amount: true },
    });
    return result._sum.amount ? Number(result._sum.amount) : 0;
  },

  async sumByAccountAndType(
    userId: string,
    accountId: string,
    type: TransactionType,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<number> {
    const result = await prisma.transaction.aggregate({
      where: {
        userId,
        accountId,
        type,
        ...(dateFrom || dateTo
          ? {
              date: {
                ...(dateFrom ? { gte: dateFrom } : {}),
                ...(dateTo ? { lte: dateTo } : {}),
              },
            }
          : {}),
      },
      _sum: { amount: true },
    });
    return result._sum.amount ? Number(result._sum.amount) : 0;
  },

  async sumTransfersOut(
    userId: string,
    accountId: string,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<number> {
    return this.sumByAccountAndType(
      userId,
      accountId,
      "TRANSFER",
      dateFrom,
      dateTo,
    );
  },

  async sumTransfersIn(
    userId: string,
    accountId: string,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<number> {
    const result = await prisma.transaction.aggregate({
      where: {
        userId,
        transferToAccountId: accountId,
        type: "TRANSFER",
        ...(dateFrom || dateTo
          ? {
              date: {
                ...(dateFrom ? { gte: dateFrom } : {}),
                ...(dateTo ? { lte: dateTo } : {}),
              },
            }
          : {}),
      },
      _sum: { amount: true },
    });
    return result._sum.amount ? Number(result._sum.amount) : 0;
  },

  async sumByCategory(
    userId: string,
    categoryId: string,
    type: TransactionType,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<number> {
    const result = await prisma.transaction.aggregate({
      where: {
        userId,
        categoryId,
        type,
        date: { gte: dateFrom, lte: dateTo },
      },
      _sum: { amount: true },
    });
    return result._sum.amount ? Number(result._sum.amount) : 0;
  },

  async findRecent(
    userId: string,
    take = 10,
  ): Promise<TransactionWithRelations[]> {
    return prisma.transaction.findMany({
      where: { userId },
      include: includeRelations,
      orderBy: { date: "desc" },
      take,
    });
  },

  async findRecurringExpenses(
    userId: string,
  ): Promise<TransactionWithRelations[]> {
    return prisma.transaction.findMany({
      where: {
        userId,
        type: "EXPENSE",
        isRecurring: true,
      },
      include: includeRelations,
      orderBy: { date: "desc" },
    });
  },

  async findRecurring(
    userId: string,
  ): Promise<TransactionWithRelations[]> {
    return prisma.transaction.findMany({
      where: {
        userId,
        isRecurring: true,
        recurrence: { not: "NONE" },
      },
      include: includeRelations,
      orderBy: { date: "desc" },
    });
  },

  async existsMatchingOnDate(
    userId: string,
    match: {
      type: TransactionType;
      title: string;
      amount: number;
      accountId: string;
      categoryId: string;
      recurrence: RecurrenceInterval;
      paymentMethod: PaymentMethod;
      date: Date;
    },
  ): Promise<boolean> {
    const day = match.date.toISOString().slice(0, 10);
    const dayStart = new Date(`${day}T00:00:00.000Z`);
    const dayEnd = new Date(`${day}T23:59:59.999Z`);
    const found = await prisma.transaction.findFirst({
      where: {
        userId,
        type: match.type,
        title: match.title,
        amount: match.amount,
        accountId: match.accountId,
        categoryId: match.categoryId,
        recurrence: match.recurrence,
        paymentMethod: match.paymentMethod,
        date: { gte: dayStart, lte: dayEnd },
      },
      select: { id: true },
    });
    return Boolean(found);
  },

  async groupByCategory(
    userId: string,
    type: TransactionType,
    dateFrom: Date,
    dateTo: Date,
  ) {
    return prisma.transaction.groupBy({
      by: ["categoryId"],
      where: {
        userId,
        type,
        date: { gte: dateFrom, lte: dateTo },
      },
      _sum: { amount: true },
    });
  },

  async findAllForExport(userId: string): Promise<TransactionWithRelations[]> {
    return prisma.transaction.findMany({
      where: { userId },
      include: includeRelations,
      orderBy: { date: "desc" },
    });
  },
};
