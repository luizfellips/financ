import type { Budget, Category } from "@prisma/client";
import type { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/prisma";

export type BudgetWithCategory = Budget & {
  category: Pick<Category, "id" | "name" | "color" | "icon" | "type">;
};

export type CreateBudgetData = {
  categoryId: string;
  month: number;
  year: number;
  limitAmount: Decimal | number;
  alertAt: number;
};

export type UpdateBudgetData = Partial<CreateBudgetData>;

export const budgetRepository = {
  async findManyByUser(
    userId: string,
    options: { month?: number; year?: number } = {},
  ): Promise<BudgetWithCategory[]> {
    return prisma.budget.findMany({
      where: {
        userId,
        ...(options.month !== undefined ? { month: options.month } : {}),
        ...(options.year !== undefined ? { year: options.year } : {}),
      },
      include: {
        category: {
          select: { id: true, name: true, color: true, icon: true, type: true },
        },
      },
      orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
    });
  },

  async findById(
    userId: string,
    id: string,
  ): Promise<BudgetWithCategory | null> {
    return prisma.budget.findFirst({
      where: { id, userId },
      include: {
        category: {
          select: { id: true, name: true, color: true, icon: true, type: true },
        },
      },
    });
  },

  async findByCategoryMonth(
    userId: string,
    categoryId: string,
    month: number,
    year: number,
  ): Promise<Budget | null> {
    return prisma.budget.findFirst({
      where: { userId, categoryId, month, year },
    });
  },

  async create(
    userId: string,
    data: CreateBudgetData,
  ): Promise<BudgetWithCategory> {
    return prisma.budget.create({
      data: {
        userId,
        categoryId: data.categoryId,
        month: data.month,
        year: data.year,
        limitAmount: data.limitAmount,
        alertAt: data.alertAt,
      },
      include: {
        category: {
          select: { id: true, name: true, color: true, icon: true, type: true },
        },
      },
    });
  },

  async update(
    userId: string,
    id: string,
    data: UpdateBudgetData,
  ): Promise<BudgetWithCategory> {
    const existing = await prisma.budget.findFirst({ where: { id, userId } });
    if (!existing) {
      throw new Error("NOT_FOUND");
    }

    return prisma.budget.update({
      where: { id },
      data: {
        ...(data.categoryId !== undefined
          ? { categoryId: data.categoryId }
          : {}),
        ...(data.month !== undefined ? { month: data.month } : {}),
        ...(data.year !== undefined ? { year: data.year } : {}),
        ...(data.limitAmount !== undefined
          ? { limitAmount: data.limitAmount }
          : {}),
        ...(data.alertAt !== undefined ? { alertAt: data.alertAt } : {}),
      },
      include: {
        category: {
          select: { id: true, name: true, color: true, icon: true, type: true },
        },
      },
    });
  },

  async delete(userId: string, id: string): Promise<Budget> {
    const existing = await prisma.budget.findFirst({ where: { id, userId } });
    if (!existing) {
      throw new Error("NOT_FOUND");
    }
    return prisma.budget.delete({ where: { id } });
  },
};
