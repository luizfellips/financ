import { z } from "zod";

/** Parse yyyy-MM-dd (or ISO prefix) as UTC noon so the calendar day is stable across timezones. */
export function parseCalendarDate(value: unknown): unknown {
  if (value instanceof Date) return value;
  if (typeof value !== "string" && typeof value !== "number") return value;

  const raw = String(value).trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? value : parsed;
}

export const calendarDateSchema = z.preprocess(parseCalendarDate, z.date());

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
  date: calendarDateSchema,
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

export const periodQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

export const recurringPeriodSchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

export const recurringProposalActionSchema = z.object({
  proposalIds: z
    .array(z.string().min(1).max(512))
    .min(1, "Selecione ao menos uma proposta")
    .max(100),
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
  deadline: calendarDateSchema.optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#22c55e"),
  icon: z.string().min(1).max(40).default("Target"),
});

export const goalContributionSchema = z.object({
  amount: z.coerce.number().positive().finite(),
  note: z.string().max(500).optional().nullable(),
  date: calendarDateSchema.optional(),
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

export const IMPORT_MAX_BYTES = 2 * 1024 * 1024;
export const IMPORT_MAX_CSV_ROWS = 5_000;

export const backupContributionSchema = z.object({
  amount: z.number().finite(),
  note: z.string().max(500).nullable().optional(),
  date: z.string().min(1),
});

export const backupAccountSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().trim().min(2).max(80),
  type: z.enum([
    "CHECKING",
    "SAVINGS",
    "CREDIT",
    "CASH",
    "INVESTMENT",
    "OTHER",
  ]),
  currency: z.string().min(3).max(8).default("BRL"),
  initialBalance: z.number().finite(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#6366f1"),
  icon: z.string().min(1).max(40).default("Wallet"),
  isDefault: z.boolean(),
  archived: z.boolean(),
});

export const backupCategorySchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().trim().min(2).max(60),
  type: z.enum(["INCOME", "EXPENSE"]),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#6366f1"),
  icon: z.string().min(1).max(40).default("Tag"),
  isSystem: z.boolean(),
});

export const backupTransactionSchema = z.object({
  id: z.string().min(1).max(64).optional(),
  accountId: z.string().min(1).max(64),
  categoryId: z.string().min(1).max(64),
  type: z.enum(["INCOME", "EXPENSE"]),
  title: z.string().trim().min(2).max(120),
  amount: z.number().finite(),
  date: z.string().min(1),
  notes: z.string().max(2000).nullable().optional(),
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
    .default("PIX"),
  recurrence: z
    .enum(["NONE", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"])
    .default("NONE"),
  isRecurring: z.boolean().default(false),
  installmentNumber: z.number().int().nullable().optional(),
  installmentTotal: z.number().int().nullable().optional(),
  installmentGroupId: z.string().max(64).nullable().optional(),
});

export const backupBudgetSchema = z.object({
  id: z.string().min(1).max(64).optional(),
  categoryId: z.string().min(1).max(64),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  limitAmount: z.number().positive().finite(),
  alertAt: z.number().int().min(1).max(100).default(80),
});

export const backupGoalSchema = z.object({
  id: z.string().min(1).max(64).optional(),
  name: z.string().trim().min(2).max(100),
  targetAmount: z.number().positive().finite(),
  savedAmount: z.number().min(0).finite().default(0),
  deadline: z.string().nullable().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#22c55e"),
  icon: z.string().min(1).max(40).default("Target"),
  completedAt: z.string().nullable().optional(),
  contributions: z.array(backupContributionSchema).max(500).default([]),
});

export const backupSettingsSchema = z.object({
  theme: z.enum(["LIGHT", "DARK", "SYSTEM"]).default("SYSTEM"),
  currency: z.string().min(3).max(8).default("BRL"),
  locale: z.string().min(2).max(16).default("pt-BR"),
  monthStartDay: z.number().int().min(1).max(28).default(1),
  notifyBudget: z.boolean().default(true),
  notifyGoals: z.boolean().default(true),
  notifyBills: z.boolean().default(true),
});

export const backupSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string().min(1),
  accounts: z.array(backupAccountSchema).max(50),
  categories: z.array(backupCategorySchema).max(200),
  transactions: z.array(backupTransactionSchema).max(5_000),
  budgets: z.array(backupBudgetSchema).max(500),
  goals: z.array(backupGoalSchema).max(100),
  settings: backupSettingsSchema.nullable().optional(),
});

export type BackupPayload = z.infer<typeof backupSchema>;
