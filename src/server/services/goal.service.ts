import { subMonths } from "date-fns";
import { clampPercent } from "@/utils/currency";
import { estimateCompletionDate, toUtcDateOnly } from "@/utils/date";
import { decimalToNumber, mapGoal, toDecimal } from "@/server/dto/mappers";
import { NotFoundError, ValidationError } from "@/server/errors/app-error";
import { goalRepository } from "@/server/repositories/goal.repository";
import { notificationRepository } from "@/server/repositories/notification.repository";
import { settingsRepository } from "@/server/repositories/settings.repository";
import type { z } from "zod";
import type {
  goalContributionSchema,
  goalSchema,
} from "@/server/validation/schemas";

type GoalInput = z.infer<typeof goalSchema>;
type ContributionInput = z.infer<typeof goalContributionSchema>;

async function averageMonthlyContribution(goalId: string): Promise<number> {
  const since = subMonths(new Date(), 6);
  const contributions = await goalRepository.getContributionsInPeriod(
    goalId,
    since,
  );
  if (contributions.length === 0) return 0;

  const total = contributions.reduce(
    (sum, c) => sum + decimalToNumber(c.amount),
    0,
  );
  const first = contributions[0].date;
  const monthsSpan = Math.max(
    1,
    (Date.now() - first.getTime()) / (1000 * 60 * 60 * 24 * 30.44),
  );
  return total / monthsSpan;
}

async function enrichGoal(
  goal: NonNullable<Awaited<ReturnType<typeof goalRepository.findById>>>,
) {
  const mapped = mapGoal(goal);
  const percent = clampPercent(
    mapped.targetAmount > 0
      ? (mapped.savedAmount / mapped.targetAmount) * 100
      : 0,
  );
  const avgMonthly = await averageMonthlyContribution(goal.id);
  const estimatedCompletion = estimateCompletionDate(
    mapped.savedAmount,
    mapped.targetAmount,
    avgMonthly,
  );

  return {
    ...mapped,
    percent,
    remaining: Math.max(0, mapped.targetAmount - mapped.savedAmount),
    averageMonthlyContribution: Math.round(avgMonthly * 100) / 100,
    estimatedCompletion: estimatedCompletion
      ? toUtcDateOnly(estimatedCompletion)
      : null,
    contributions: goal.contributions.map((c) => ({
      ...c,
      amount: decimalToNumber(c.amount),
      date: toUtcDateOnly(c.date),
      createdAt: c.createdAt.toISOString(),
    })),
  };
}

export const goalService = {
  async list(userId: string) {
    const goals = await goalRepository.findManyByUser(userId);
    return Promise.all(goals.map((g) => enrichGoal(g)));
  },

  async getById(userId: string, id: string) {
    const goal = await goalRepository.findById(userId, id);
    if (!goal) {
      throw new NotFoundError("Meta não encontrada");
    }
    return enrichGoal(goal);
  },

  async create(userId: string, input: GoalInput) {
    if (
      input.savedAmount > input.targetAmount
    ) {
      throw new ValidationError(
        "O valor já poupado não pode ser maior que a meta",
      );
    }

    const goal = await goalRepository.create(userId, {
      name: input.name,
      targetAmount: toDecimal(input.targetAmount),
      savedAmount: toDecimal(input.savedAmount),
      deadline: input.deadline ?? null,
      color: input.color,
      icon: input.icon,
    });

    return enrichGoal(goal);
  },

  async update(userId: string, id: string, input: Partial<GoalInput>) {
    const existing = await goalRepository.findById(userId, id);
    if (!existing) {
      throw new NotFoundError("Meta não encontrada");
    }

    const nextTarget =
      input.targetAmount ?? decimalToNumber(existing.targetAmount);
    const nextSaved =
      input.savedAmount ?? decimalToNumber(existing.savedAmount);

    if (nextSaved > nextTarget) {
      throw new ValidationError(
        "O valor já poupado não pode ser maior que a meta",
      );
    }

    const completedAt =
      nextSaved >= nextTarget
        ? (existing.completedAt ?? new Date())
        : null;

    const goal = await goalRepository.update(userId, id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.targetAmount !== undefined
        ? { targetAmount: toDecimal(input.targetAmount) }
        : {}),
      ...(input.savedAmount !== undefined
        ? { savedAmount: toDecimal(input.savedAmount) }
        : {}),
      ...(input.deadline !== undefined ? { deadline: input.deadline } : {}),
      ...(input.color !== undefined ? { color: input.color } : {}),
      ...(input.icon !== undefined ? { icon: input.icon } : {}),
      completedAt,
    });

    return enrichGoal(goal);
  },

  async delete(userId: string, id: string) {
    const existing = await goalRepository.findById(userId, id);
    if (!existing) {
      throw new NotFoundError("Meta não encontrada");
    }
    await goalRepository.delete(userId, id);
    return { id };
  },

  async addContribution(
    userId: string,
    goalId: string,
    input: ContributionInput,
  ) {
    const existing = await goalRepository.findById(userId, goalId);
    if (!existing) {
      throw new NotFoundError("Meta não encontrada");
    }

    const wasComplete = existing.completedAt !== null;

    const { goal, contribution } = await goalRepository.addContribution(
      userId,
      goalId,
      {
        amount: toDecimal(input.amount),
        note: input.note ?? null,
        date: input.date,
      },
    );

    const enriched = await enrichGoal(goal);
    await maybeNotifyGoalReached(userId, wasComplete, goal, enriched);

    return {
      goal: enriched,
      contribution: mapContribution(contribution),
    };
  },

  async updateContribution(
    userId: string,
    goalId: string,
    contributionId: string,
    input: Partial<ContributionInput>,
  ) {
    const existing = await goalRepository.findById(userId, goalId);
    if (!existing) {
      throw new NotFoundError("Meta não encontrada");
    }

    const contributionExists = existing.contributions.some(
      (c) => c.id === contributionId,
    );
    if (!contributionExists) {
      throw new NotFoundError("Contribuição não encontrada");
    }

    const wasComplete = existing.completedAt !== null;

    const { goal, contribution } = await goalRepository.updateContribution(
      userId,
      goalId,
      contributionId,
      {
        ...(input.amount !== undefined
          ? { amount: toDecimal(input.amount) }
          : {}),
        ...(input.note !== undefined ? { note: input.note } : {}),
        ...(input.date !== undefined ? { date: input.date } : {}),
      },
    );

    const enriched = await enrichGoal(goal);
    await maybeNotifyGoalReached(userId, wasComplete, goal, enriched);

    return {
      goal: enriched,
      contribution: mapContribution(contribution),
    };
  },

  async deleteContribution(
    userId: string,
    goalId: string,
    contributionId: string,
  ) {
    const existing = await goalRepository.findById(userId, goalId);
    if (!existing) {
      throw new NotFoundError("Meta não encontrada");
    }

    const contributionExists = existing.contributions.some(
      (c) => c.id === contributionId,
    );
    if (!contributionExists) {
      throw new NotFoundError("Contribuição não encontrada");
    }

    const { goal, contribution } = await goalRepository.deleteContribution(
      userId,
      goalId,
      contributionId,
    );

    return {
      goal: await enrichGoal(goal),
      contribution: mapContribution(contribution),
    };
  },
};

function mapContribution(
  contribution: Awaited<
    ReturnType<typeof goalRepository.addContribution>
  >["contribution"],
) {
  return {
    ...contribution,
    amount: decimalToNumber(contribution.amount),
    date: toUtcDateOnly(contribution.date),
    createdAt: contribution.createdAt.toISOString(),
  };
}

async function maybeNotifyGoalReached(
  userId: string,
  wasComplete: boolean,
  goal: { id: string; name: string; completedAt: Date | null },
  enriched: { targetAmount: number; savedAmount: number },
) {
  if (wasComplete || !goal.completedAt) return;

  const settings = await settingsRepository.findByUser(userId);
  if (!settings || settings.notifyGoals) {
    await notificationRepository.create(userId, {
      type: "GOAL_REACHED",
      title: "Meta alcançada!",
      message: `Parabéns! Você atingiu a meta "${goal.name}".`,
      metadata: {
        goalId: goal.id,
        targetAmount: enriched.targetAmount,
        savedAmount: enriched.savedAmount,
      },
    });
  }
}
