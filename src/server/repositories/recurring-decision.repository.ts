import { prisma } from "@/lib/prisma";
import type { RecurringProposalDecisionType } from "@prisma/client";

export type CreateDecisionData = {
  seriesKey: string;
  sourceTransactionId: string;
  proposedDate: Date;
  decision: RecurringProposalDecisionType;
  createdTransactionId?: string | null;
};

export const recurringDecisionRepository = {
  async findByUserAndMonth(userId: string, rangeStart: Date, rangeEnd: Date) {
    return prisma.recurringProposalDecision.findMany({
      where: {
        userId,
        proposedDate: { gte: rangeStart, lte: rangeEnd },
      },
    });
  },

  async findManyByKeys(
    userId: string,
    keys: Array<{ seriesKey: string; proposedDate: Date }>,
  ) {
    if (keys.length === 0) return [];
    return prisma.recurringProposalDecision.findMany({
      where: {
        userId,
        OR: keys.map((key) => ({
          seriesKey: key.seriesKey,
          proposedDate: key.proposedDate,
        })),
      },
    });
  },

  async upsertDecision(userId: string, data: CreateDecisionData) {
    return prisma.recurringProposalDecision.upsert({
      where: {
        userId_seriesKey_proposedDate: {
          userId,
          seriesKey: data.seriesKey,
          proposedDate: data.proposedDate,
        },
      },
      create: {
        userId,
        seriesKey: data.seriesKey,
        sourceTransactionId: data.sourceTransactionId,
        proposedDate: data.proposedDate,
        decision: data.decision,
        createdTransactionId: data.createdTransactionId ?? null,
      },
      update: {
        decision: data.decision,
        sourceTransactionId: data.sourceTransactionId,
        createdTransactionId:
          data.createdTransactionId !== undefined
            ? data.createdTransactionId
            : undefined,
      },
    });
  },

  async deleteByUser(userId: string) {
    return prisma.recurringProposalDecision.deleteMany({ where: { userId } });
  },
};
