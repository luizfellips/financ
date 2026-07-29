import type { Prisma, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type CreateUserData = {
  name: string;
  email: string;
  passwordHash: string;
};

export const userRepository = {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  },

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  },

  async create(data: CreateUserData): Promise<User> {
    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
      },
    });
  },

  async createWithDefaults(
    data: CreateUserData,
    defaults: {
      account: {
        name: string;
        type: "CHECKING";
        currency: string;
        initialBalance: number;
        color: string;
        icon: string;
        isDefault: boolean;
      };
      categories: Array<{
        name: string;
        type: "INCOME" | "EXPENSE" | "TRANSFER";
        color: string;
        icon: string;
        isSystem: boolean;
      }>;
    },
  ): Promise<User> {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email.toLowerCase(),
          passwordHash: data.passwordHash,
        },
      });

      await tx.settings.create({
        data: { userId: user.id },
      });

      await tx.account.create({
        data: {
          userId: user.id,
          ...defaults.account,
        },
      });

      await tx.category.createMany({
        data: defaults.categories.map((c) => ({
          userId: user.id,
          ...c,
        })),
      });

      return user;
    });
  },

  async update(
    id: string,
    data: Prisma.UserUpdateInput,
  ): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  },
};
