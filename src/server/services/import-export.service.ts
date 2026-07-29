import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { parseCsv, toCsv } from "@/utils/csv";
import { toDecimal, decimalToNumber, mapTransaction } from "@/server/dto/mappers";
import { ValidationError } from "@/server/errors/app-error";
import { accountRepository } from "@/server/repositories/account.repository";
import { categoryRepository } from "@/server/repositories/category.repository";
import { transactionRepository } from "@/server/repositories/transaction.repository";
import { budgetRepository } from "@/server/repositories/budget.repository";
import { goalRepository } from "@/server/repositories/goal.repository";
import { settingsRepository } from "@/server/repositories/settings.repository";

const csvRowSchema = z.object({
  title: z.string().trim().min(2).max(120),
  amount: z.coerce.number().positive().finite(),
  type: z.enum(["INCOME", "EXPENSE"]),
  date: z.string().min(1),
  account: z.string().trim().min(1).optional(),
  accountId: z.string().cuid().optional(),
  category: z.string().trim().min(1).optional(),
  categoryId: z.string().cuid().optional(),
  notes: z.string().optional().nullable(),
  paymentMethod: z
    .enum([
      "CASH",
      "DEBIT_CARD",
      "CREDIT_CARD",
      "PIX",
      "BANK_TRANSFER",
      "BOLETO",
      "OTHER",
    ])
    .optional()
    .default("PIX"),
  recurrence: z
    .enum(["NONE", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"])
    .optional()
    .default("NONE"),
  isRecurring: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((v) => {
      if (typeof v === "boolean") return v;
      if (v == null || v === "") return false;
      return v === "true" || v === "1";
    }),
});

const backupSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string(),
  accounts: z.array(z.record(z.string(), z.unknown())),
  categories: z.array(z.record(z.string(), z.unknown())),
  transactions: z.array(z.record(z.string(), z.unknown())),
  budgets: z.array(z.record(z.string(), z.unknown())),
  goals: z.array(z.record(z.string(), z.unknown())),
  settings: z.record(z.string(), z.unknown()).nullable().optional(),
});

function parseDate(value: string): Date {
  const iso = Date.parse(value);
  if (!Number.isNaN(iso)) return new Date(iso);

  const br = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (br) {
    return new Date(Number(br[3]), Number(br[2]) - 1, Number(br[1]));
  }

  throw new ValidationError(`Data inválida: ${value}`);
}

export const importExportService = {
  async exportCsv(userId: string) {
    const transactions = await transactionRepository.findAllForExport(userId);
    const rows = transactions.map((tx) => ({
      id: tx.id,
      title: tx.title,
      amount: decimalToNumber(tx.amount),
      type: tx.type,
      date: tx.date.toISOString().slice(0, 10),
      account: tx.account.name,
      accountId: tx.accountId,
      category: tx.category.name,
      categoryId: tx.categoryId,
      notes: tx.notes ?? "",
      paymentMethod: tx.paymentMethod,
      recurrence: tx.recurrence,
      isRecurring: tx.isRecurring,
      installmentNumber: tx.installmentNumber ?? "",
      installmentTotal: tx.installmentTotal ?? "",
      installmentGroupId: tx.installmentGroupId ?? "",
    }));

    return {
      content: toCsv(rows),
      filename: `financ-transacoes-${new Date().toISOString().slice(0, 10)}.csv`,
      mimeType: "text/csv; charset=utf-8",
    };
  },

  async exportJson(userId: string) {
    const transactions = await transactionRepository.findAllForExport(userId);
    const data = transactions.map(mapTransaction);
    return {
      content: JSON.stringify({ version: 1, transactions: data }, null, 2),
      filename: `financ-transacoes-${new Date().toISOString().slice(0, 10)}.json`,
      mimeType: "application/json; charset=utf-8",
    };
  },

  async importCsv(userId: string, content: string) {
    const { data, errors: parseErrors } = parseCsv<Record<string, string>>(
      content,
    );

    if (parseErrors.length > 0 && data.length === 0) {
      throw new ValidationError("CSV inválido", parseErrors.map((e) => ({
        path: "csv",
        message: e,
      })));
    }

    const [accounts, categories] = await Promise.all([
      accountRepository.findManyByUser(userId, { includeArchived: true }),
      categoryRepository.findManyByUser(userId),
    ]);

    const defaultAccount =
      accounts.find((a) => a.isDefault && !a.archived) ?? accounts[0];
    if (!defaultAccount) {
      throw new ValidationError(
        "Nenhuma conta disponível para importar transações",
      );
    }

    const accountByName = new Map(
      accounts.map((a) => [a.name.toLowerCase(), a]),
    );
    const accountById = new Map(accounts.map((a) => [a.id, a]));
    const categoryByKey = new Map(
      categories.map((c) => [`${c.type}:${c.name.toLowerCase()}`, c]),
    );
    const categoryById = new Map(categories.map((c) => [c.id, c]));

    const issues: Array<{ path: string; message: string }> = [];
    const toCreate: Array<{
      accountId: string;
      categoryId: string;
      type: "INCOME" | "EXPENSE";
      title: string;
      amount: ReturnType<typeof toDecimal>;
      date: Date;
      notes: string | null;
      paymentMethod:
        | "CASH"
        | "DEBIT_CARD"
        | "CREDIT_CARD"
        | "PIX"
        | "BANK_TRANSFER"
        | "BOLETO"
        | "OTHER";
      recurrence: "NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
      isRecurring: boolean;
    }> = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const parsed = csvRowSchema.safeParse(row);
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          issues.push({
            path: `row.${i + 1}.${issue.path.join(".")}`,
            message: issue.message,
          });
        }
        continue;
      }

      const item = parsed.data;
      let date: Date;
      try {
        date = parseDate(item.date);
      } catch {
        issues.push({
          path: `row.${i + 1}.date`,
          message: `Data inválida: ${item.date}`,
        });
        continue;
      }

      let accountId = item.accountId;
      if (accountId) {
        if (!accountById.has(accountId)) {
          issues.push({
            path: `row.${i + 1}.accountId`,
            message: "Conta não encontrada",
          });
          continue;
        }
      } else if (item.account) {
        const found = accountByName.get(item.account.toLowerCase());
        if (!found) {
          issues.push({
            path: `row.${i + 1}.account`,
            message: `Conta "${item.account}" não encontrada`,
          });
          continue;
        }
        accountId = found.id;
      } else {
        accountId = defaultAccount.id;
      }

      let categoryId = item.categoryId;
      if (categoryId) {
        const cat = categoryById.get(categoryId);
        if (!cat) {
          issues.push({
            path: `row.${i + 1}.categoryId`,
            message: "Categoria não encontrada",
          });
          continue;
        }
        if (cat.type !== item.type) {
          issues.push({
            path: `row.${i + 1}.categoryId`,
            message: "Tipo da categoria não corresponde à transação",
          });
          continue;
        }
      } else if (item.category) {
        const found = categoryByKey.get(
          `${item.type}:${item.category.toLowerCase()}`,
        );
        if (!found) {
          issues.push({
            path: `row.${i + 1}.category`,
            message: `Categoria "${item.category}" não encontrada para o tipo ${item.type}`,
          });
          continue;
        }
        categoryId = found.id;
      } else {
        issues.push({
          path: `row.${i + 1}.category`,
          message: "Categoria obrigatória",
        });
        continue;
      }

      if (!accountId || !categoryId) {
        issues.push({
          path: `row.${i + 1}`,
          message: "Conta ou categoria inválida",
        });
        continue;
      }

      toCreate.push({
        accountId,
        categoryId,
        type: item.type,
        title: item.title,
        amount: toDecimal(item.amount),
        date,
        notes: item.notes ?? null,
        paymentMethod: item.paymentMethod,
        recurrence: item.recurrence,
        isRecurring: item.isRecurring || item.recurrence !== "NONE",
      });
    }

    if (issues.length > 0 && toCreate.length === 0) {
      throw new ValidationError("Nenhuma linha válida para importar", issues);
    }

    if (toCreate.length > 0) {
      await transactionRepository.createMany(userId, toCreate);
    }

    return {
      imported: toCreate.length,
      skipped: data.length - toCreate.length,
      errors: issues,
    };
  },

  async createBackup(userId: string) {
    const [accounts, categories, transactions, budgets, goals, settings] =
      await Promise.all([
        accountRepository.findManyByUser(userId, { includeArchived: true }),
        categoryRepository.findManyByUser(userId),
        transactionRepository.findAllForExport(userId),
        budgetRepository.findManyByUser(userId),
        goalRepository.findManyByUser(userId),
        settingsRepository.findByUser(userId),
      ]);

    const payload = {
      version: 1 as const,
      exportedAt: new Date().toISOString(),
      accounts: accounts.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        currency: a.currency,
        initialBalance: decimalToNumber(a.initialBalance),
        color: a.color,
        icon: a.icon,
        isDefault: a.isDefault,
        archived: a.archived,
      })),
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        color: c.color,
        icon: c.icon,
        isSystem: c.isSystem,
      })),
      transactions: transactions.map((tx) => ({
        id: tx.id,
        accountId: tx.accountId,
        categoryId: tx.categoryId,
        type: tx.type,
        title: tx.title,
        amount: decimalToNumber(tx.amount),
        date: tx.date.toISOString(),
        notes: tx.notes,
        paymentMethod: tx.paymentMethod,
        recurrence: tx.recurrence,
        isRecurring: tx.isRecurring,
        installmentNumber: tx.installmentNumber,
        installmentTotal: tx.installmentTotal,
        installmentGroupId: tx.installmentGroupId,
      })),
      budgets: budgets.map((b) => ({
        id: b.id,
        categoryId: b.categoryId,
        month: b.month,
        year: b.year,
        limitAmount: decimalToNumber(b.limitAmount),
        alertAt: b.alertAt,
      })),
      goals: goals.map((g) => ({
        id: g.id,
        name: g.name,
        targetAmount: decimalToNumber(g.targetAmount),
        savedAmount: decimalToNumber(g.savedAmount),
        deadline: g.deadline?.toISOString() ?? null,
        color: g.color,
        icon: g.icon,
        completedAt: g.completedAt?.toISOString() ?? null,
        contributions: g.contributions.map((c) => ({
          amount: decimalToNumber(c.amount),
          note: c.note,
          date: c.date.toISOString(),
        })),
      })),
      settings: settings
        ? {
            theme: settings.theme,
            currency: settings.currency,
            locale: settings.locale,
            monthStartDay: settings.monthStartDay,
            notifyBudget: settings.notifyBudget,
            notifyGoals: settings.notifyGoals,
            notifyBills: settings.notifyBills,
          }
        : null,
    };

    return {
      content: JSON.stringify(payload, null, 2),
      filename: `financ-backup-${new Date().toISOString().slice(0, 10)}.json`,
      mimeType: "application/json; charset=utf-8",
      payload,
    };
  },

  async restoreBackup(userId: string, raw: unknown) {
    const parsed = backupSchema.safeParse(raw);
    if (!parsed.success) {
      throw new ValidationError("Arquivo de backup inválido", [
        { path: "backup", message: "Estrutura do backup não reconhecida" },
      ]);
    }

    const backup = parsed.data;

    await prisma.$transaction(async (tx) => {
      await tx.goalContribution.deleteMany({
        where: { goal: { userId } },
      });
      await tx.goal.deleteMany({ where: { userId } });
      await tx.budget.deleteMany({ where: { userId } });
      await tx.transaction.deleteMany({ where: { userId } });
      await tx.notification.deleteMany({ where: { userId } });
      await tx.category.deleteMany({ where: { userId } });
      await tx.account.deleteMany({ where: { userId } });

      const accountIdMap = new Map<string, string>();
      const categoryIdMap = new Map<string, string>();

      for (const account of backup.accounts) {
        const oldId = String(account.id);
        const created = await tx.account.create({
          data: {
            userId,
            name: String(account.name),
            type: account.type as
              | "CHECKING"
              | "SAVINGS"
              | "CREDIT"
              | "CASH"
              | "INVESTMENT"
              | "OTHER",
            currency: String(account.currency ?? "BRL"),
            initialBalance: toDecimal(Number(account.initialBalance ?? 0)),
            color: String(account.color ?? "#6366f1"),
            icon: String(account.icon ?? "Wallet"),
            isDefault: Boolean(account.isDefault),
            archived: Boolean(account.archived),
          },
        });
        accountIdMap.set(oldId, created.id);
      }

      for (const category of backup.categories) {
        const oldId = String(category.id);
        const created = await tx.category.create({
          data: {
            userId,
            name: String(category.name),
            type: category.type as "INCOME" | "EXPENSE",
            color: String(category.color ?? "#6366f1"),
            icon: String(category.icon ?? "Tag"),
            isSystem: Boolean(category.isSystem),
          },
        });
        categoryIdMap.set(oldId, created.id);
      }

      for (const txRow of backup.transactions) {
        const accountId = accountIdMap.get(String(txRow.accountId));
        const categoryId = categoryIdMap.get(String(txRow.categoryId));
        if (!accountId || !categoryId) continue;

        await tx.transaction.create({
          data: {
            userId,
            accountId,
            categoryId,
            type: txRow.type as "INCOME" | "EXPENSE",
            title: String(txRow.title),
            amount: toDecimal(Number(txRow.amount)),
            date: new Date(String(txRow.date)),
            notes: txRow.notes != null ? String(txRow.notes) : null,
            paymentMethod: (txRow.paymentMethod as
              | "CASH"
              | "DEBIT_CARD"
              | "CREDIT_CARD"
              | "PIX"
              | "BANK_TRANSFER"
              | "BOLETO"
              | "OTHER") ?? "PIX",
            recurrence: (txRow.recurrence as
              | "NONE"
              | "DAILY"
              | "WEEKLY"
              | "MONTHLY"
              | "YEARLY") ?? "NONE",
            isRecurring: Boolean(txRow.isRecurring),
            installmentNumber:
              txRow.installmentNumber != null
                ? Number(txRow.installmentNumber)
                : null,
            installmentTotal:
              txRow.installmentTotal != null
                ? Number(txRow.installmentTotal)
                : null,
            installmentGroupId:
              txRow.installmentGroupId != null
                ? String(txRow.installmentGroupId)
                : null,
          },
        });
      }

      for (const budget of backup.budgets) {
        const categoryId = categoryIdMap.get(String(budget.categoryId));
        if (!categoryId) continue;
        await tx.budget.create({
          data: {
            userId,
            categoryId,
            month: Number(budget.month),
            year: Number(budget.year),
            limitAmount: toDecimal(Number(budget.limitAmount)),
            alertAt: Number(budget.alertAt ?? 80),
          },
        });
      }

      for (const goal of backup.goals) {
        const created = await tx.goal.create({
          data: {
            userId,
            name: String(goal.name),
            targetAmount: toDecimal(Number(goal.targetAmount)),
            savedAmount: toDecimal(Number(goal.savedAmount ?? 0)),
            deadline: goal.deadline ? new Date(String(goal.deadline)) : null,
            color: String(goal.color ?? "#22c55e"),
            icon: String(goal.icon ?? "Target"),
            completedAt: goal.completedAt
              ? new Date(String(goal.completedAt))
              : null,
          },
        });

        const contributions = Array.isArray(goal.contributions)
          ? goal.contributions
          : [];
        for (const c of contributions) {
          const contrib = c as Record<string, unknown>;
          await tx.goalContribution.create({
            data: {
              goalId: created.id,
              amount: toDecimal(Number(contrib.amount)),
              note: contrib.note != null ? String(contrib.note) : null,
              date: contrib.date
                ? new Date(String(contrib.date))
                : new Date(),
            },
          });
        }
      }

      if (backup.settings) {
        await tx.settings.upsert({
          where: { userId },
          create: {
            userId,
            theme: (backup.settings.theme as
              | "LIGHT"
              | "DARK"
              | "SYSTEM") ?? "SYSTEM",
            currency: String(backup.settings.currency ?? "BRL"),
            locale: String(backup.settings.locale ?? "pt-BR"),
            monthStartDay: Number(backup.settings.monthStartDay ?? 1),
            notifyBudget: Boolean(backup.settings.notifyBudget ?? true),
            notifyGoals: Boolean(backup.settings.notifyGoals ?? true),
            notifyBills: Boolean(backup.settings.notifyBills ?? true),
          },
          update: {
            theme: (backup.settings.theme as
              | "LIGHT"
              | "DARK"
              | "SYSTEM") ?? "SYSTEM",
            currency: String(backup.settings.currency ?? "BRL"),
            locale: String(backup.settings.locale ?? "pt-BR"),
            monthStartDay: Number(backup.settings.monthStartDay ?? 1),
            notifyBudget: Boolean(backup.settings.notifyBudget ?? true),
            notifyGoals: Boolean(backup.settings.notifyGoals ?? true),
            notifyBills: Boolean(backup.settings.notifyBills ?? true),
          },
        });
      }
    });

    return {
      restored: true,
      accounts: backup.accounts.length,
      categories: backup.categories.length,
      transactions: backup.transactions.length,
      budgets: backup.budgets.length,
      goals: backup.goals.length,
    };
  },
};
