import type { CreditInvoice, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type CreateCreditInvoiceData = {
  accountId: string;
  year: number;
  month: number;
  openingAmount?: number | Prisma.Decimal;
  notes?: string | null;
};

export type UpdateCreditInvoiceData = {
  openingAmount?: number | Prisma.Decimal;
  notes?: string | null;
};

export const invoiceRepository = {
  async findByAccountMonth(
    userId: string,
    accountId: string,
    year: number,
    month: number,
  ): Promise<CreditInvoice | null> {
    return prisma.creditInvoice.findFirst({
      where: { userId, accountId, year, month },
    });
  },

  async findManyByUserMonth(
    userId: string,
    year: number,
    month: number,
  ): Promise<CreditInvoice[]> {
    return prisma.creditInvoice.findMany({
      where: { userId, year, month },
      orderBy: { createdAt: "asc" },
    });
  },

  async upsert(
    userId: string,
    data: CreateCreditInvoiceData,
  ): Promise<CreditInvoice> {
    return prisma.creditInvoice.upsert({
      where: {
        accountId_year_month: {
          accountId: data.accountId,
          year: data.year,
          month: data.month,
        },
      },
      create: {
        userId,
        accountId: data.accountId,
        year: data.year,
        month: data.month,
        openingAmount: data.openingAmount ?? 0,
        notes: data.notes ?? null,
      },
      update: {
        ...(data.openingAmount !== undefined
          ? { openingAmount: data.openingAmount }
          : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
      },
    });
  },

  async update(
    userId: string,
    id: string,
    data: UpdateCreditInvoiceData,
  ): Promise<CreditInvoice> {
    return prisma.creditInvoice.update({
      where: { id, userId },
      data: {
        ...(data.openingAmount !== undefined
          ? { openingAmount: data.openingAmount }
          : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
      },
    });
  },

  async getOrCreate(
    userId: string,
    accountId: string,
    year: number,
    month: number,
  ): Promise<CreditInvoice> {
    const existing = await this.findByAccountMonth(
      userId,
      accountId,
      year,
      month,
    );
    if (existing) return existing;
    return this.upsert(userId, {
      accountId,
      year,
      month,
      openingAmount: 0,
    });
  },
};
