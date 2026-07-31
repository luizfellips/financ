import { mapTransaction, toDecimal, decimalToNumber } from "@/server/dto/mappers";
import {
  NotFoundError,
  ValidationError,
} from "@/server/errors/app-error";
import { accountRepository } from "@/server/repositories/account.repository";
import { invoiceRepository } from "@/server/repositories/invoice.repository";
import { transactionRepository } from "@/server/repositories/transaction.repository";
import { transactionService } from "@/server/services/transaction.service";
import { getCurrentMonthYear, getMonthRange } from "@/utils/date";

function resolvePeriod(month?: number, year?: number) {
  const current = getCurrentMonthYear();
  const resolvedYear = year ?? current.year;
  const resolvedMonth = month ?? current.month;
  const { start, end } = getMonthRange(resolvedYear, resolvedMonth);
  return { year: resolvedYear, month: resolvedMonth, start, end };
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export async function computeInvoiceTotals(
  userId: string,
  accountId: string,
  year: number,
  month: number,
  openingAmount: number,
) {
  const { start, end } = getMonthRange(year, month);
  const [expenses, payments] = await Promise.all([
    transactionRepository.sumByAccountAndType(
      userId,
      accountId,
      "EXPENSE",
      start,
      end,
    ),
    transactionRepository.sumTransfersIn(userId, accountId, start, end),
  ]);
  const total = roundMoney(openingAmount + expenses - payments);
  return {
    openingAmount: roundMoney(openingAmount),
    expenses: roundMoney(expenses),
    payments: roundMoney(payments),
    total: Math.max(0, total),
    rawTotal: total,
  };
}

/** Debt used for CREDIT account balance (non-negative invoice total). */
export async function getCreditInvoiceDebt(
  userId: string,
  accountId: string,
  asOf: Date,
): Promise<number> {
  const year = asOf.getUTCFullYear();
  const month = asOf.getUTCMonth() + 1;
  const invoice = await invoiceRepository.getOrCreate(
    userId,
    accountId,
    year,
    month,
  );
  const totals = await computeInvoiceTotals(
    userId,
    accountId,
    year,
    month,
    decimalToNumber(invoice.openingAmount),
  );
  return totals.total;
}

export const invoiceService = {
  async list(userId: string, month?: number, year?: number) {
    const period = resolvePeriod(month, year);
    const accounts = await accountRepository.findManyByUser(userId);
    const creditAccounts = accounts.filter((a) => a.type === "CREDIT");

    return Promise.all(
      creditAccounts.map(async (account) => {
        const invoice = await invoiceRepository.getOrCreate(
          userId,
          account.id,
          period.year,
          period.month,
        );
        const totals = await computeInvoiceTotals(
          userId,
          account.id,
          period.year,
          period.month,
          decimalToNumber(invoice.openingAmount),
        );
        return {
          id: invoice.id,
          accountId: account.id,
          accountName: account.name,
          accountColor: account.color,
          accountIcon: account.icon,
          year: period.year,
          month: period.month,
          notes: invoice.notes,
          ...totals,
          balance: roundMoney(
            Number(account.initialBalance) - totals.total,
          ),
        };
      }),
    );
  },

  async getDetail(
    userId: string,
    accountId: string,
    month?: number,
    year?: number,
  ) {
    const account = await accountRepository.findById(userId, accountId);
    if (!account || account.archived) {
      throw new NotFoundError("Conta não encontrada");
    }
    if (account.type !== "CREDIT") {
      throw new ValidationError("Faturas existem apenas para contas de crédito");
    }

    const period = resolvePeriod(month, year);
    const invoice = await invoiceRepository.getOrCreate(
      userId,
      accountId,
      period.year,
      period.month,
    );
    const openingAmount = decimalToNumber(invoice.openingAmount);
    const [totals, expenses, payments] = await Promise.all([
      computeInvoiceTotals(
        userId,
        accountId,
        period.year,
        period.month,
        openingAmount,
      ),
      transactionRepository.findExpensesByAccount(
        userId,
        accountId,
        period.start,
        period.end,
      ),
      transactionRepository.findTransfersToAccount(
        userId,
        accountId,
        period.start,
        period.end,
      ),
    ]);

    return {
      id: invoice.id,
      accountId: account.id,
      accountName: account.name,
      accountColor: account.color,
      accountIcon: account.icon,
      accountInitialBalance: Number(account.initialBalance),
      year: period.year,
      month: period.month,
      notes: invoice.notes,
      ...totals,
      balance: roundMoney(Number(account.initialBalance) - totals.total),
      expensesList: expenses.map(mapTransaction),
      paymentsList: payments.map(mapTransaction),
    };
  },

  async updateOpening(
    userId: string,
    accountId: string,
    input: {
      month?: number;
      year?: number;
      openingAmount: number;
      notes?: string | null;
    },
  ) {
    const account = await accountRepository.findById(userId, accountId);
    if (!account || account.archived) {
      throw new NotFoundError("Conta não encontrada");
    }
    if (account.type !== "CREDIT") {
      throw new ValidationError("Faturas existem apenas para contas de crédito");
    }
    if (!Number.isFinite(input.openingAmount) || input.openingAmount < 0) {
      throw new ValidationError("Valor inicial inválido");
    }

    const period = resolvePeriod(input.month, input.year);
    await invoiceRepository.upsert(userId, {
      accountId,
      year: period.year,
      month: period.month,
      openingAmount: toDecimal(input.openingAmount),
      notes: input.notes,
    });

    return this.getDetail(userId, accountId, period.month, period.year);
  },

  async pay(
    userId: string,
    accountId: string,
    input: {
      fromAccountId: string;
      amount: number;
      date?: string | Date;
      title?: string;
      notes?: string | null;
      month?: number;
      year?: number;
    },
  ) {
    const account = await accountRepository.findById(userId, accountId);
    if (!account || account.archived) {
      throw new NotFoundError("Conta de crédito não encontrada");
    }
    if (account.type !== "CREDIT") {
      throw new ValidationError("Pagamento de fatura só para contas de crédito");
    }
    if (input.fromAccountId === accountId) {
      throw new ValidationError("Selecione uma conta de origem diferente");
    }
    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      throw new ValidationError("Valor do pagamento inválido");
    }

    const period = resolvePeriod(input.month, input.year);
    let payDate: Date;
    if (input.date instanceof Date) {
      payDate = input.date;
    } else if (typeof input.date === "string" && input.date.length >= 10) {
      payDate = new Date(`${input.date.slice(0, 10)}T00:00:00.000Z`);
    } else {
      const today = new Date();
      payDate = new Date(
        Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()),
      );
    }

    const transfer = await transactionService.create(userId, {
      type: "TRANSFER",
      accountId: input.fromAccountId,
      transferToAccountId: accountId,
      title:
        input.title?.trim() ||
        `Pagamento fatura ${period.month}/${period.year}`,
      amount: input.amount,
      date: payDate,
      notes: input.notes ?? null,
      paymentMethod: "BANK_TRANSFER",
      recurrence: "NONE",
      isRecurring: false,
    });

    const detail = await this.getDetail(
      userId,
      accountId,
      period.month,
      period.year,
    );

    return { transfer, invoice: detail };
  },

  async ensureOpeningForNewAccount(
    userId: string,
    accountId: string,
    openingAmount: number,
  ) {
    if (!Number.isFinite(openingAmount) || openingAmount < 0) return null;
    const { year, month } = getCurrentMonthYear();
    if (openingAmount === 0) {
      await invoiceRepository.getOrCreate(userId, accountId, year, month);
      return null;
    }
    return invoiceRepository.upsert(userId, {
      accountId,
      year,
      month,
      openingAmount: toDecimal(openingAmount),
    });
  },
};
