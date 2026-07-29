import { clampPercent } from "@/utils/currency";
import { getMonthRange } from "@/utils/date";
import { mapBudget, toDecimal } from "@/server/dto/mappers";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@/server/errors/app-error";
import { budgetRepository } from "@/server/repositories/budget.repository";
import { categoryRepository } from "@/server/repositories/category.repository";
import { notificationRepository } from "@/server/repositories/notification.repository";
import { settingsRepository } from "@/server/repositories/settings.repository";
import { transactionRepository } from "@/server/repositories/transaction.repository";
import type { z } from "zod";
import type { budgetSchema } from "@/server/validation/schemas";

type BudgetInput = z.infer<typeof budgetSchema>;

function normalizeOptionalText(value: string | null | undefined) {
  if (value === undefined) return undefined;
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function budgetDisplayName(
  title: string | null | undefined,
  categoryName: string,
) {
  return title?.trim() || categoryName;
}

function computeUnitMetrics(
  spent: number,
  limit: number,
  unitCost: number | null,
  quantityLimit: number | null,
) {
  if (unitCost == null || unitCost <= 0) {
    return {
      estimatedQuantity: null as number | null,
      quantityRemaining: null as number | null,
      potentialSavings: null as number | null,
    };
  }

  const estimatedQuantity = Math.round((spent / unitCost) * 10) / 10;
  const quantityRemaining =
    quantityLimit != null
      ? Math.round((quantityLimit - estimatedQuantity) * 10) / 10
      : null;
  const overUnits =
    quantityLimit != null
      ? Math.max(0, estimatedQuantity - quantityLimit)
      : Math.max(0, spent - limit) / unitCost;
  const potentialSavings = Math.round(overUnits * unitCost * 100) / 100;

  return {
    estimatedQuantity,
    quantityRemaining,
    potentialSavings,
  };
}

async function enrichBudget(
  userId: string,
  budget: NonNullable<Awaited<ReturnType<typeof budgetRepository.findById>>>,
) {
  const { start, end } = getMonthRange(budget.year, budget.month);
  const spent = await transactionRepository.sumByCategory(
    userId,
    budget.categoryId,
    "EXPENSE",
    start,
    end,
  );
  const limit = Number(budget.limitAmount);
  const remaining = limit - spent;
  const percent = clampPercent(limit > 0 ? (spent / limit) * 100 : 0);
  const mapped = mapBudget(budget);
  const unitMetrics = computeUnitMetrics(
    spent,
    limit,
    mapped.unitCost,
    budget.quantityLimit,
  );

  return {
    ...mapped,
    category: budget.category,
    spent,
    remaining,
    percent,
    ...unitMetrics,
  };
}

async function maybeNotifyBudgetThreshold(
  userId: string,
  enriched: Awaited<ReturnType<typeof enrichBudget>>,
) {
  const settings = await settingsRepository.findByUser(userId);
  if (settings && !settings.notifyBudget) return;

  const since = new Date();
  since.setHours(0, 0, 0, 0);
  const label = budgetDisplayName(enriched.title, enriched.category.name);

  if (enriched.percent >= 100) {
    const existing = await notificationRepository.findRecentByTypeAndMeta(
      userId,
      "BUDGET_EXCEEDED",
      enriched.id,
      since,
    );
    if (!existing) {
      await notificationRepository.create(userId, {
        type: "BUDGET_EXCEEDED",
        title: "Orçamento excedido",
        message: `O orçamento de ${label} foi excedido (${enriched.percent.toFixed(0)}%).`,
        metadata: {
          budgetId: enriched.id,
          categoryId: enriched.categoryId,
          percent: enriched.percent,
          spent: enriched.spent,
          limit: enriched.limitAmount,
        },
      });
    }
    return;
  }

  if (enriched.percent >= enriched.alertAt) {
    const existing = await notificationRepository.findRecentByTypeAndMeta(
      userId,
      "BUDGET_WARNING",
      enriched.id,
      since,
    );
    if (!existing) {
      await notificationRepository.create(userId, {
        type: "BUDGET_WARNING",
        title: "Alerta de orçamento",
        message: `O orçamento de ${label} atingiu ${enriched.percent.toFixed(0)}% do limite.`,
        metadata: {
          budgetId: enriched.id,
          categoryId: enriched.categoryId,
          percent: enriched.percent,
          spent: enriched.spent,
          limit: enriched.limitAmount,
        },
      });
    }
  }
}

function toOptionalDecimal(value: number | null | undefined) {
  if (value == null) return null;
  return toDecimal(value);
}

export const budgetService = {
  async list(
    userId: string,
    options: { month?: number; year?: number } = {},
  ) {
    const budgets = await budgetRepository.findManyByUser(userId, options);
    const enriched = await Promise.all(
      budgets.map((b) => enrichBudget(userId, b)),
    );

    return enriched;
  },

  async getById(userId: string, id: string) {
    const budget = await budgetRepository.findById(userId, id);
    if (!budget) {
      throw new NotFoundError("Orçamento não encontrado");
    }
    return enrichBudget(userId, budget);
  },

  async create(userId: string, input: BudgetInput) {
    const category = await categoryRepository.findById(
      userId,
      input.categoryId,
    );
    if (!category) {
      throw new NotFoundError("Categoria não encontrada");
    }
    if (category.type !== "EXPENSE") {
      throw new ValidationError(
        "Orçamentos só podem ser criados para categorias de despesa",
      );
    }

    const duplicate = await budgetRepository.findByCategoryMonth(
      userId,
      input.categoryId,
      input.month,
      input.year,
    );
    if (duplicate) {
      throw new ConflictError(
        "Já existe um orçamento para esta categoria neste mês",
      );
    }

    const budget = await budgetRepository.create(userId, {
      categoryId: input.categoryId,
      month: input.month,
      year: input.year,
      title: normalizeOptionalText(input.title) ?? null,
      description: normalizeOptionalText(input.description) ?? null,
      limitAmount: toDecimal(input.limitAmount),
      unitCost: toOptionalDecimal(input.unitCost ?? null),
      quantityLimit: input.quantityLimit ?? null,
      alertAt: input.alertAt,
    });

    const enriched = await enrichBudget(userId, budget);
    await maybeNotifyBudgetThreshold(userId, enriched);
    return enriched;
  },

  async update(userId: string, id: string, input: Partial<BudgetInput>) {
    const existing = await budgetRepository.findById(userId, id);
    if (!existing) {
      throw new NotFoundError("Orçamento não encontrado");
    }

    if (input.categoryId) {
      const category = await categoryRepository.findById(
        userId,
        input.categoryId,
      );
      if (!category) {
        throw new NotFoundError("Categoria não encontrada");
      }
      if (category.type !== "EXPENSE") {
        throw new ValidationError(
          "Orçamentos só podem ser criados para categorias de despesa",
        );
      }
    }

    const nextCategoryId = input.categoryId ?? existing.categoryId;
    const nextMonth = input.month ?? existing.month;
    const nextYear = input.year ?? existing.year;

    if (
      input.categoryId ||
      input.month !== undefined ||
      input.year !== undefined
    ) {
      const duplicate = await budgetRepository.findByCategoryMonth(
        userId,
        nextCategoryId,
        nextMonth,
        nextYear,
      );
      if (duplicate && duplicate.id !== id) {
        throw new ConflictError(
          "Já existe um orçamento para esta categoria neste mês",
        );
      }
    }

    const budget = await budgetRepository.update(userId, id, {
      ...(input.categoryId !== undefined
        ? { categoryId: input.categoryId }
        : {}),
      ...(input.month !== undefined ? { month: input.month } : {}),
      ...(input.year !== undefined ? { year: input.year } : {}),
      ...(input.title !== undefined
        ? { title: normalizeOptionalText(input.title) ?? null }
        : {}),
      ...(input.description !== undefined
        ? { description: normalizeOptionalText(input.description) ?? null }
        : {}),
      ...(input.limitAmount !== undefined
        ? { limitAmount: toDecimal(input.limitAmount) }
        : {}),
      ...(input.unitCost !== undefined
        ? { unitCost: toOptionalDecimal(input.unitCost) }
        : {}),
      ...(input.quantityLimit !== undefined
        ? { quantityLimit: input.quantityLimit }
        : {}),
      ...(input.alertAt !== undefined ? { alertAt: input.alertAt } : {}),
    });

    const enriched = await enrichBudget(userId, budget);
    await maybeNotifyBudgetThreshold(userId, enriched);
    return enriched;
  },

  async delete(userId: string, id: string) {
    const existing = await budgetRepository.findById(userId, id);
    if (!existing) {
      throw new NotFoundError("Orçamento não encontrado");
    }
    await budgetRepository.delete(userId, id);
    return { id };
  },
};
