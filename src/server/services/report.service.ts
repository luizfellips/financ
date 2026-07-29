import { getMonthRange, previousMonths } from "@/utils/date";
import { clampPercent } from "@/utils/currency";
import { prisma } from "@/lib/prisma";
import { categoryRepository } from "@/server/repositories/category.repository";
import { transactionRepository } from "@/server/repositories/transaction.repository";
import { budgetService } from "@/server/services/budget.service";
import { goalService } from "@/server/services/goal.service";
import { getCurrentMonthYear } from "@/utils/date";

export const reportService = {
  async getReports(userId: string) {
    const months = previousMonths(12);
    const { year, month } = getCurrentMonthYear();
    const currentRange = getMonthRange(year, month);

    const monthlyCashFlow = await Promise.all(
      months.map(async ({ year: y, month: m, label }) => {
        const { start, end } = getMonthRange(y, m);
        const [income, expense] = await Promise.all([
          transactionRepository.sumByType(userId, "INCOME", start, end),
          transactionRepository.sumByType(userId, "EXPENSE", start, end),
        ]);
        return {
          year: y,
          month: m,
          label,
          income,
          expense,
          savings: Math.round((income - expense) * 100) / 100,
          cashflow: Math.round((income - expense) * 100) / 100,
        };
      }),
    );

    const currentIncome = monthlyCashFlow[monthlyCashFlow.length - 1]?.income ?? 0;
    const currentExpense =
      monthlyCashFlow[monthlyCashFlow.length - 1]?.expense ?? 0;

    const categoryGroups = await transactionRepository.groupByCategory(
      userId,
      "EXPENSE",
      currentRange.start,
      currentRange.end,
    );

    const categories = await categoryRepository.findManyByUser(userId, {
      type: "EXPENSE",
    });
    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    const expensesByCategory = categoryGroups
      .map((g) => {
        const cat = categoryMap.get(g.categoryId);
        const amount = g._sum.amount ? Number(g._sum.amount) : 0;
        return {
          categoryId: g.categoryId,
          name: cat?.name ?? "Desconhecida",
          color: cat?.color ?? "#94a3b8",
          icon: cat?.icon ?? "Tag",
          amount,
          percent:
            currentExpense > 0
              ? clampPercent((amount / currentExpense) * 100)
              : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    const savingsTrend = monthlyCashFlow.map((m) => ({
      label: m.label,
      year: m.year,
      month: m.month,
      savings: m.savings,
    }));

    const budgets = await budgetService.list(userId, { month, year });
    const budgetUtilization = budgets.map((b) => ({
      id: b.id,
      categoryName: b.category.name,
      categoryColor: b.category.color,
      limitAmount: b.limitAmount,
      spent: b.spent,
      remaining: b.remaining,
      percent: b.percent,
      alertAt: b.alertAt,
    }));

    const goals = await goalService.list(userId);
    const goalProgress = goals.map((g) => ({
      id: g.id,
      name: g.name,
      color: g.color,
      targetAmount: g.targetAmount,
      savedAmount: g.savedAmount,
      percent: g.percent,
      remaining: g.remaining,
      estimatedCompletion: g.estimatedCompletion,
      deadline: g.deadline,
      completedAt: g.completedAt,
    }));

    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);
    const [yearIncome, yearExpense] = await Promise.all([
      transactionRepository.sumByType(userId, "INCOME", yearStart, yearEnd),
      transactionRepository.sumByType(userId, "EXPENSE", yearStart, yearEnd),
    ]);

    const accountCount = await prisma.account.count({
      where: { userId, archived: false },
    });
    const transactionCount = await prisma.transaction.count({
      where: { userId },
    });

    return {
      period: { year, month },
      monthlyCashFlow,
      incomeVsExpenses: {
        income: currentIncome,
        expense: currentExpense,
        difference: Math.round((currentIncome - currentExpense) * 100) / 100,
        yearIncome,
        yearExpense,
        yearSavings: Math.round((yearIncome - yearExpense) * 100) / 100,
      },
      expensesByCategory,
      savingsTrend,
      budgetUtilization,
      goalProgress,
      summary: {
        accountCount,
        transactionCount,
        budgetCount: budgets.length,
        goalCount: goals.length,
      },
    };
  },
};
