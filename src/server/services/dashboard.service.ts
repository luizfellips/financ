import { addDays, startOfDay } from "date-fns";
import { getCurrentMonthYear, getMonthRange, toUtcDateOnly } from "@/utils/date";
import { nextOccurrence } from "@/utils/recurrence";
import { mapTransaction } from "@/server/dto/mappers";
import { accountRepository } from "@/server/repositories/account.repository";
import { transactionRepository } from "@/server/repositories/transaction.repository";
import { budgetService } from "@/server/services/budget.service";
import { goalService } from "@/server/services/goal.service";

export type DashboardPeriod = {
  month?: number;
  year?: number;
};

export const dashboardService = {
  async getOverview(userId: string, period: DashboardPeriod = {}) {
    const current = getCurrentMonthYear();
    const year = period.year ?? current.year;
    const month = period.month ?? current.month;
    const { start, end } = getMonthRange(year, month);

    const [
      accounts,
      monthlyIncome,
      monthlyExpense,
      recentTransactions,
      budgets,
      goals,
      recurringExpenses,
    ] = await Promise.all([
      accountRepository.findManyByUser(userId),
      transactionRepository.sumByType(userId, "INCOME", start, end),
      transactionRepository.sumByType(userId, "EXPENSE", start, end),
      transactionRepository.findRecent(userId, 8),
      budgetService.list(userId, { month, year }),
      goalService.list(userId),
      transactionRepository.findRecurringExpenses(userId),
    ]);

    let totalBalance = 0;
    const accountBalances: Array<{
      id: string;
      name: string;
      type: (typeof accounts)[number]["type"];
      color: string;
      icon: string;
      isDefault: boolean;
      balance: number;
      monthIncome: number;
      monthExpense: number;
      monthVariation: number;
    }> = [];

    for (const account of accounts) {
      const [income, expense, monthIncome, monthExpense] = await Promise.all([
        transactionRepository.sumByAccountAndType(
          userId,
          account.id,
          "INCOME",
          undefined,
          end,
        ),
        transactionRepository.sumByAccountAndType(
          userId,
          account.id,
          "EXPENSE",
          undefined,
          end,
        ),
        transactionRepository.sumByAccountAndType(
          userId,
          account.id,
          "INCOME",
          start,
          end,
        ),
        transactionRepository.sumByAccountAndType(
          userId,
          account.id,
          "EXPENSE",
          start,
          end,
        ),
      ]);
      const balance =
        Math.round(
          (Number(account.initialBalance) + income - expense) * 100,
        ) / 100;
      const monthVariation =
        Math.round((monthIncome - monthExpense) * 100) / 100;
      totalBalance += balance;
      accountBalances.push({
        id: account.id,
        name: account.name,
        type: account.type,
        color: account.color,
        icon: account.icon,
        isDefault: account.isDefault,
        balance,
        monthIncome,
        monthExpense,
        monthVariation,
      });
    }

    const savings = monthlyIncome - monthlyExpense;
    const cashflow = savings;

    const now = startOfDay(new Date());
    const horizon = addDays(now, 30);
    const seenTitles = new Set<string>();
    const upcomingBills: Array<{
      title: string;
      amount: number;
      dueDate: string;
      category: { id: string; name: string; color: string; icon: string };
      account: { id: string; name: string };
      recurrence: string;
    }> = [];

    for (const tx of recurringExpenses) {
      const key = `${tx.title}-${tx.amount}-${tx.recurrence}`;
      if (seenTitles.has(key)) continue;
      seenTitles.add(key);

      const due = nextOccurrence(tx.date, tx.recurrence, now);
      if (!due || due > horizon) continue;

      upcomingBills.push({
        title: tx.title,
        amount: Number(tx.amount),
        dueDate: toUtcDateOnly(due),
        category: {
          id: tx.category.id,
          name: tx.category.name,
          color: tx.category.color,
          icon: tx.category.icon,
        },
        account: {
          id: tx.account.id,
          name: tx.account.name,
        },
        recurrence: tx.recurrence,
      });
    }

    upcomingBills.sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );

    return {
      kpis: {
        balance: Math.round(totalBalance * 100) / 100,
        monthlyIncome,
        monthlyExpense,
        monthlySavings: Math.round(savings * 100) / 100,
        cashflow: Math.round(cashflow * 100) / 100,
        month,
        year,
      },
      accountBalances,
      upcomingBills: upcomingBills.slice(0, 10),
      budgetProgress: budgets.map((b) => ({
        id: b.id,
        title: b.title,
        categoryName: b.category.name,
        categoryColor: b.category.color,
        limitAmount: b.limitAmount,
        spent: b.spent,
        remaining: b.remaining,
        percent: b.percent,
        alertAt: b.alertAt,
      })),
      goalProgress: goals
        .filter((g) => !g.completedAt)
        .slice(0, 5)
        .map((g) => ({
          id: g.id,
          name: g.name,
          color: g.color,
          icon: g.icon,
          targetAmount: g.targetAmount,
          savedAmount: g.savedAmount,
          percent: g.percent,
          remaining: g.remaining,
          estimatedCompletion: g.estimatedCompletion,
          deadline: g.deadline,
        })),
      recentTransactions: recentTransactions.map(mapTransaction),
    };
  },
};
