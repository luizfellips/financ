import type { Goal, GoalContribution } from "@prisma/client";
import type { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/prisma";

export type GoalWithContributions = Goal & {
  contributions: GoalContribution[];
};

export type CreateGoalData = {
  name: string;
  targetAmount: Decimal | number;
  savedAmount: Decimal | number;
  deadline?: Date | null;
  color: string;
  icon: string;
};

export type UpdateGoalData = Partial<CreateGoalData> & {
  completedAt?: Date | null;
};

export type CreateContributionData = {
  amount: Decimal | number;
  note?: string | null;
  date?: Date;
};

export type UpdateContributionData = {
  amount?: Decimal | number;
  note?: string | null;
  date?: Date;
};

export const goalRepository = {
  async findManyByUser(userId: string): Promise<GoalWithContributions[]> {
    return prisma.goal.findMany({
      where: { userId },
      include: {
        contributions: { orderBy: { date: "desc" } },
      },
      orderBy: [{ completedAt: "asc" }, { deadline: "asc" }, { name: "asc" }],
    });
  },

  async findById(
    userId: string,
    id: string,
  ): Promise<GoalWithContributions | null> {
    return prisma.goal.findFirst({
      where: { id, userId },
      include: {
        contributions: { orderBy: { date: "desc" } },
      },
    });
  },

  async create(
    userId: string,
    data: CreateGoalData,
  ): Promise<GoalWithContributions> {
    return prisma.goal.create({
      data: {
        userId,
        name: data.name,
        targetAmount: data.targetAmount,
        savedAmount: data.savedAmount,
        deadline: data.deadline ?? null,
        color: data.color,
        icon: data.icon,
        completedAt:
          Number(data.savedAmount) >= Number(data.targetAmount)
            ? new Date()
            : null,
      },
      include: {
        contributions: { orderBy: { date: "desc" } },
      },
    });
  },

  async update(
    userId: string,
    id: string,
    data: UpdateGoalData,
  ): Promise<GoalWithContributions> {
    const existing = await prisma.goal.findFirst({ where: { id, userId } });
    if (!existing) {
      throw new Error("NOT_FOUND");
    }

    return prisma.goal.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.targetAmount !== undefined
          ? { targetAmount: data.targetAmount }
          : {}),
        ...(data.savedAmount !== undefined
          ? { savedAmount: data.savedAmount }
          : {}),
        ...(data.deadline !== undefined ? { deadline: data.deadline } : {}),
        ...(data.color !== undefined ? { color: data.color } : {}),
        ...(data.icon !== undefined ? { icon: data.icon } : {}),
        ...(data.completedAt !== undefined
          ? { completedAt: data.completedAt }
          : {}),
      },
      include: {
        contributions: { orderBy: { date: "desc" } },
      },
    });
  },

  async delete(userId: string, id: string): Promise<Goal> {
    const existing = await prisma.goal.findFirst({ where: { id, userId } });
    if (!existing) {
      throw new Error("NOT_FOUND");
    }
    return prisma.goal.delete({ where: { id } });
  },

  async addContribution(
    userId: string,
    goalId: string,
    data: CreateContributionData,
  ): Promise<{ goal: GoalWithContributions; contribution: GoalContribution }> {
    return prisma.$transaction(async (tx) => {
      const goal = await tx.goal.findFirst({ where: { id: goalId, userId } });
      if (!goal) {
        throw new Error("NOT_FOUND");
      }

      const contribution = await tx.goalContribution.create({
        data: {
          goalId,
          amount: data.amount,
          note: data.note ?? null,
          date: data.date ?? new Date(),
        },
      });

      const newSaved = Number(goal.savedAmount) + Number(data.amount);
      const target = Number(goal.targetAmount);
      const updated = await tx.goal.update({
        where: { id: goalId },
        data: {
          savedAmount: newSaved,
          completedAt:
            newSaved >= target ? (goal.completedAt ?? new Date()) : null,
        },
        include: {
          contributions: { orderBy: { date: "desc" } },
        },
      });

      return { goal: updated, contribution };
    });
  },

  async getContributionsInPeriod(
    goalId: string,
    dateFrom: Date,
  ): Promise<GoalContribution[]> {
    return prisma.goalContribution.findMany({
      where: {
        goalId,
        date: { gte: dateFrom },
      },
      orderBy: { date: "asc" },
    });
  },

  async updateContribution(
    userId: string,
    goalId: string,
    contributionId: string,
    data: UpdateContributionData,
  ): Promise<{ goal: GoalWithContributions; contribution: GoalContribution }> {
    return prisma.$transaction(async (tx) => {
      const goal = await tx.goal.findFirst({ where: { id: goalId, userId } });
      if (!goal) {
        throw new Error("NOT_FOUND");
      }

      const existing = await tx.goalContribution.findFirst({
        where: { id: contributionId, goalId },
      });
      if (!existing) {
        throw new Error("NOT_FOUND");
      }

      const nextAmount =
        data.amount !== undefined ? Number(data.amount) : Number(existing.amount);
      const delta = nextAmount - Number(existing.amount);
      const newSaved = Math.max(0, Number(goal.savedAmount) + delta);
      const target = Number(goal.targetAmount);

      const contribution = await tx.goalContribution.update({
        where: { id: contributionId },
        data: {
          ...(data.amount !== undefined ? { amount: data.amount } : {}),
          ...(data.note !== undefined ? { note: data.note } : {}),
          ...(data.date !== undefined ? { date: data.date } : {}),
        },
      });

      const updated = await tx.goal.update({
        where: { id: goalId },
        data: {
          savedAmount: newSaved,
          completedAt:
            newSaved >= target ? (goal.completedAt ?? new Date()) : null,
        },
        include: {
          contributions: { orderBy: { date: "desc" } },
        },
      });

      return { goal: updated, contribution };
    });
  },

  async deleteContribution(
    userId: string,
    goalId: string,
    contributionId: string,
  ): Promise<{ goal: GoalWithContributions; contribution: GoalContribution }> {
    return prisma.$transaction(async (tx) => {
      const goal = await tx.goal.findFirst({ where: { id: goalId, userId } });
      if (!goal) {
        throw new Error("NOT_FOUND");
      }

      const existing = await tx.goalContribution.findFirst({
        where: { id: contributionId, goalId },
      });
      if (!existing) {
        throw new Error("NOT_FOUND");
      }

      await tx.goalContribution.delete({ where: { id: contributionId } });

      const newSaved = Math.max(
        0,
        Number(goal.savedAmount) - Number(existing.amount),
      );
      const target = Number(goal.targetAmount);

      const updated = await tx.goal.update({
        where: { id: goalId },
        data: {
          savedAmount: newSaved,
          completedAt:
            newSaved >= target ? (goal.completedAt ?? new Date()) : null,
        },
        include: {
          contributions: { orderBy: { date: "desc" } },
        },
      });

      return { goal: updated, contribution: existing };
    });
  },
};
