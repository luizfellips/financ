import { mapTransaction, toDecimal } from "@/server/dto/mappers";
import { ValidationError } from "@/server/errors/app-error";
import { recurringDecisionRepository } from "@/server/repositories/recurring-decision.repository";
import { transactionRepository } from "@/server/repositories/transaction.repository";
import { getCurrentMonthYear, toUtcDateOnly } from "@/utils/date";
import {
  buildProposalId,
  buildRecurringSeriesKey,
  occurrencesAfterInRange,
  parseProposalId,
} from "@/utils/recurrence";
import type {
  PaymentMethod,
  RecurrenceInterval,
  TransactionType,
} from "@prisma/client";

export type RecurringProposal = {
  id: string;
  seriesKey: string;
  sourceTransactionId: string;
  type: TransactionType;
  title: string;
  amount: number;
  proposedDate: string;
  recurrence: RecurrenceInterval;
  paymentMethod: PaymentMethod;
  notes: string | null;
  account: { id: string; name: string; color: string; icon: string };
  category: {
    id: string;
    name: string;
    color: string;
    icon: string;
    type: TransactionType;
  };
  lastOccurrenceDate: string;
};

function utcMonthRange(year: number, month: number) {
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return { start, end };
}

function parseProposedDate(dateOnly: string): Date {
  return new Date(`${dateOnly}T12:00:00.000Z`);
}

async function resolveProposalsByIds(userId: string, proposalIds: string[]) {
  const parsed = proposalIds.map((id) => {
    const parts = parseProposalId(id);
    if (!parts) {
      throw new ValidationError(`Proposta inválida: ${id}`);
    }
    return { id, ...parts };
  });

  const monthsNeeded = new Map<string, { month: number; year: number }>();
  for (const item of parsed) {
    const [y, m] = item.proposedDate.split("-").map(Number);
    monthsNeeded.set(`${y}-${m}`, { year: y, month: m });
  }

  const byId = new Map<string, RecurringProposal>();
  for (const period of monthsNeeded.values()) {
    const listed = await recurringService.listProposals(userId, period);
    for (const proposal of listed.proposals) {
      byId.set(proposal.id, proposal);
    }
  }

  return { parsed, byId };
}

export const recurringService = {
  async listProposals(
    userId: string,
    period: { month?: number; year?: number } = {},
  ) {
    const current = getCurrentMonthYear();
    const month = period.month ?? current.month;
    const year = period.year ?? current.year;
    const { start, end } = utcMonthRange(year, month);

    const [recurring, decisions] = await Promise.all([
      transactionRepository.findRecurring(userId),
      recurringDecisionRepository.findByUserAndMonth(userId, start, end),
    ]);

    const decided = new Set(
      decisions.map(
        (d) => `${d.seriesKey}::${toUtcDateOnly(d.proposedDate)}`,
      ),
    );

    const latestBySeries = new Map<string, (typeof recurring)[number]>();
    for (const tx of recurring) {
      const key = buildRecurringSeriesKey({
        type: tx.type,
        title: tx.title,
        amount: Number(tx.amount),
        accountId: tx.accountId,
        categoryId: tx.categoryId,
        recurrence: tx.recurrence,
        paymentMethod: tx.paymentMethod,
      });
      const existing = latestBySeries.get(key);
      if (!existing || tx.date > existing.date) {
        latestBySeries.set(key, tx);
      }
    }

    const proposals: RecurringProposal[] = [];

    for (const [seriesKey, source] of latestBySeries) {
      const dates = occurrencesAfterInRange(
        source.date,
        source.recurrence,
        start,
        end,
      );

      for (const proposed of dates) {
        const proposedDate = toUtcDateOnly(proposed);
        if (decided.has(`${seriesKey}::${proposedDate}`)) continue;

        const alreadyExists = await transactionRepository.existsMatchingOnDate(
          userId,
          {
            type: source.type,
            title: source.title,
            amount: Number(source.amount),
            accountId: source.accountId,
            categoryId: source.categoryId,
            recurrence: source.recurrence,
            paymentMethod: source.paymentMethod,
            date: proposed,
          },
        );
        if (alreadyExists) continue;

        proposals.push({
          id: buildProposalId(seriesKey, proposedDate),
          seriesKey,
          sourceTransactionId: source.id,
          type: source.type,
          title: source.title,
          amount: Number(source.amount),
          proposedDate,
          recurrence: source.recurrence,
          paymentMethod: source.paymentMethod,
          notes: source.notes,
          account: source.account,
          category: source.category,
          lastOccurrenceDate: toUtcDateOnly(source.date),
        });
      }
    }

    proposals.sort((a, b) => {
      const byDate =
        new Date(a.proposedDate).getTime() - new Date(b.proposedDate).getTime();
      if (byDate !== 0) return byDate;
      return a.title.localeCompare(b.title, "pt-BR");
    });

    return {
      month,
      year,
      proposals,
      summary: {
        total: proposals.length,
        income: proposals.filter((p) => p.type === "INCOME").length,
        expense: proposals.filter((p) => p.type === "EXPENSE").length,
        totalAmount:
          Math.round(
            proposals.reduce(
              (sum, p) => sum + (p.type === "INCOME" ? p.amount : -p.amount),
              0,
            ) * 100,
          ) / 100,
      },
    };
  },

  async approve(userId: string, proposalIds: string[]) {
    if (proposalIds.length === 0) {
      throw new ValidationError("Selecione ao menos uma proposta");
    }

    const { parsed, byId } = await resolveProposalsByIds(userId, proposalIds);
    const created = [];

    for (const item of parsed) {
      const proposal = byId.get(item.id);
      if (!proposal) {
        throw new ValidationError(
          `Proposta não disponível ou já decidida (${item.proposedDate})`,
        );
      }

      const tx = await transactionRepository.create(userId, {
        accountId: proposal.account.id,
        categoryId: proposal.category.id,
        type: proposal.type,
        title: proposal.title,
        amount: toDecimal(proposal.amount),
        date: parseProposedDate(proposal.proposedDate),
        notes: proposal.notes,
        paymentMethod: proposal.paymentMethod,
        recurrence: proposal.recurrence,
        isRecurring: true,
        installmentNumber: null,
        installmentTotal: null,
        installmentGroupId: null,
      });

      await recurringDecisionRepository.upsertDecision(userId, {
        seriesKey: proposal.seriesKey,
        sourceTransactionId: proposal.sourceTransactionId,
        proposedDate: parseProposedDate(proposal.proposedDate),
        decision: "APPROVED",
        createdTransactionId: tx.id,
      });

      created.push(mapTransaction(tx));
    }

    return { created, count: created.length };
  },

  async reject(userId: string, proposalIds: string[]) {
    if (proposalIds.length === 0) {
      throw new ValidationError("Selecione ao menos uma proposta");
    }

    const { parsed, byId } = await resolveProposalsByIds(userId, proposalIds);
    const rejected = [];

    for (const item of parsed) {
      const proposal = byId.get(item.id);
      if (!proposal) {
        throw new ValidationError(
          `Proposta não disponível ou já decidida (${item.proposedDate})`,
        );
      }

      const decision = await recurringDecisionRepository.upsertDecision(
        userId,
        {
          seriesKey: proposal.seriesKey,
          sourceTransactionId: proposal.sourceTransactionId,
          proposedDate: parseProposedDate(proposal.proposedDate),
          decision: "REJECTED",
          createdTransactionId: null,
        },
      );

      rejected.push({
        id: proposal.id,
        title: proposal.title,
        proposedDate: proposal.proposedDate,
        decision: decision.decision,
      });
    }

    return { rejected, count: rejected.length };
  },
};
