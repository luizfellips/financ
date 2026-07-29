import type { Prisma, Settings, ThemePreference } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type UpdateSettingsData = {
  theme?: ThemePreference;
  currency?: string;
  locale?: string;
  monthStartDay?: number;
  notifyBudget?: boolean;
  notifyGoals?: boolean;
  notifyBills?: boolean;
};

export const settingsRepository = {
  async findByUser(userId: string): Promise<Settings | null> {
    return prisma.settings.findUnique({
      where: { userId },
    });
  },

  async createDefault(userId: string): Promise<Settings> {
    return prisma.settings.create({
      data: { userId },
    });
  },

  async upsert(
    userId: string,
    data: UpdateSettingsData,
  ): Promise<Settings> {
    return prisma.settings.upsert({
      where: { userId },
      create: {
        userId,
        ...data,
      },
      update: data,
    });
  },

  async update(
    userId: string,
    data: UpdateSettingsData,
  ): Promise<Settings> {
    const existing = await prisma.settings.findUnique({ where: { userId } });
    if (!existing) {
      return prisma.settings.create({
        data: { userId, ...data },
      });
    }

    return prisma.settings.update({
      where: { userId },
      data: data as Prisma.SettingsUpdateInput,
    });
  },
};
