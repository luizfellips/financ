import type { Category, Prisma, TransactionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type CreateCategoryData = {
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
  isSystem?: boolean;
};

export type UpdateCategoryData = Partial<
  Pick<CreateCategoryData, "name" | "color" | "icon">
>;

export const categoryRepository = {
  async findManyByUser(
    userId: string,
    options: { type?: TransactionType } = {},
  ): Promise<Category[]> {
    return prisma.category.findMany({
      where: {
        userId,
        ...(options.type ? { type: options.type } : {}),
      },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });
  },

  async findById(userId: string, id: string): Promise<Category | null> {
    return prisma.category.findFirst({
      where: { id, userId },
    });
  },

  async findByNameAndType(
    userId: string,
    name: string,
    type: TransactionType,
  ): Promise<Category | null> {
    return prisma.category.findFirst({
      where: { userId, name, type },
    });
  },

  async create(userId: string, data: CreateCategoryData): Promise<Category> {
    return prisma.category.create({
      data: {
        userId,
        name: data.name,
        type: data.type,
        color: data.color,
        icon: data.icon,
        isSystem: data.isSystem ?? false,
      },
    });
  },

  async createMany(
    userId: string,
    items: CreateCategoryData[],
  ): Promise<Prisma.BatchPayload> {
    return prisma.category.createMany({
      data: items.map((item) => ({
        userId,
        name: item.name,
        type: item.type,
        color: item.color,
        icon: item.icon,
        isSystem: item.isSystem ?? false,
      })),
      skipDuplicates: true,
    });
  },

  async update(
    userId: string,
    id: string,
    data: UpdateCategoryData,
  ): Promise<Category> {
    const existing = await prisma.category.findFirst({ where: { id, userId } });
    if (!existing) {
      throw new Error("NOT_FOUND");
    }
    return prisma.category.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.color !== undefined ? { color: data.color } : {}),
        ...(data.icon !== undefined ? { icon: data.icon } : {}),
      },
    });
  },

  async delete(userId: string, id: string): Promise<Category> {
    const existing = await prisma.category.findFirst({ where: { id, userId } });
    if (!existing) {
      throw new Error("NOT_FOUND");
    }
    return prisma.category.delete({ where: { id } });
  },

  async countTransactions(userId: string, id: string): Promise<number> {
    return prisma.transaction.count({
      where: { userId, categoryId: id },
    });
  },

  async countBudgets(userId: string, id: string): Promise<number> {
    return prisma.budget.count({
      where: { userId, categoryId: id },
    });
  },
};
