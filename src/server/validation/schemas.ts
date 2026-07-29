import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional().default(""),
  sortBy: z.string().optional().default("date"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter ao menos 2 caracteres").max(120),
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z
    .string()
    .min(8, "Senha deve ter ao menos 8 caracteres")
    .max(128)
    .regex(/[A-Z]/, "Senha deve conter letra maiúscula")
    .regex(/[a-z]/, "Senha deve conter letra minúscula")
    .regex(/[0-9]/, "Senha deve conter número"),
});

export const loginSchema = z.object({
  email: z.string().trim().email("E-mail inválido"),
  password: z.string().min(1, "Senha obrigatória"),
});

export const accountSchema = z.object({
  name: z.string().trim().min(2).max(80),
  type: z.enum(["CHECKING", "SAVINGS", "CREDIT", "CASH", "INVESTMENT", "OTHER"]),
  currency: z.string().default("BRL"),
  initialBalance: z.coerce.number().finite(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#6366f1"),
  icon: z.string().min(1).max(40).default("Wallet"),
  isDefault: z.boolean().optional().default(false),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(60),
  type: z.enum(["INCOME", "EXPENSE"]),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#6366f1"),
  icon: z.string().min(1).max(40).default("Tag"),
});

export const transactionSchema = z.object({
  accountId: z.string().cuid(),
  categoryId: z.string().cuid(),
  type: z.enum(["INCOME", "EXPENSE"]),
  title: z.string().trim().min(2).max(120),
  amount: z.coerce.number().positive("Valor deve ser positivo").finite(),
  date: z.coerce.date(),
  notes: z.string().max(2000).optional().nullable(),
  paymentMethod: z
    .enum(["CASH", "DEBIT_CARD", "CREDIT_CARD", "PIX", "BANK_TRANSFER", "BOLETO", "OTHER"])
    .default("PIX"),
  recurrence: z.enum(["NONE", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"]).default("NONE"),
  isRecurring: z.boolean().optional().default(false),
  installmentTotal: z.coerce.number().int().min(1).max(48).optional().nullable(),
});

export const transactionUpdateSchema = transactionSchema.partial().extend({
  accountId: z.string().cuid().optional(),
  categoryId: z.string().cuid().optional(),
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
});

export const transactionFilterSchema = paginationSchema.extend({
  type: z.enum(["INCOME", "EXPENSE", "ALL"]).optional().default("ALL"),
  categoryId: z.string().cuid().optional(),
  accountId: z.string().cuid().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
  recurring: z.enum(["true", "false", "all"]).optional().default("all"),
});

export const budgetSchema = z.object({
  categoryId: z.string().cuid(),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  limitAmount: z.coerce.number().positive().finite(),
  alertAt: z.coerce.number().int().min(1).max(100).default(80),
});

export const goalSchema = z.object({
  name: z.string().trim().min(2).max(100),
  targetAmount: z.coerce.number().positive().finite(),
  savedAmount: z.coerce.number().min(0).finite().default(0),
  deadline: z.coerce.date().optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#22c55e"),
  icon: z.string().min(1).max(40).default("Target"),
});

export const goalContributionSchema = z.object({
  amount: z.coerce.number().positive().finite(),
  note: z.string().max(500).optional().nullable(),
  date: z.coerce.date().optional(),
});

export const settingsSchema = z.object({
  theme: z.enum(["LIGHT", "DARK", "SYSTEM"]).optional(),
  currency: z.string().optional(),
  locale: z.string().optional(),
  monthStartDay: z.coerce.number().int().min(1).max(28).optional(),
  notifyBudget: z.boolean().optional(),
  notifyGoals: z.boolean().optional(),
  notifyBills: z.boolean().optional(),
});
