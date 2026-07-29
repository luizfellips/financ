import type {
  AccountType,
  PaymentMethod,
  RecurrenceInterval,
  TransactionType,
} from "@/types/models";

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  INCOME: "Receita",
  EXPENSE: "Despesa",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Dinheiro",
  DEBIT_CARD: "Cartão de débito",
  CREDIT_CARD: "Cartão de crédito",
  PIX: "PIX",
  BANK_TRANSFER: "Transferência",
  BOLETO: "Boleto",
  OTHER: "Outro",
};

export const RECURRENCE_LABELS: Record<RecurrenceInterval, string> = {
  NONE: "Nenhuma",
  DAILY: "Diária",
  WEEKLY: "Semanal",
  MONTHLY: "Mensal",
  YEARLY: "Anual",
};

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  CHECKING: "Conta corrente",
  SAVINGS: "Poupança",
  CREDIT: "Crédito",
  CASH: "Dinheiro",
  INVESTMENT: "Investimento",
  OTHER: "Outra",
};

export const MONTH_LABELS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

export const CATEGORY_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#64748b",
  "#a855f7",
] as const;

export const CATEGORY_ICONS = [
  "Tag",
  "Home",
  "Car",
  "Utensils",
  "Heart",
  "ShoppingBag",
  "Plane",
  "Gamepad2",
  "GraduationCap",
  "Briefcase",
  "Wallet",
  "Gift",
  "Coffee",
  "Smartphone",
  "Zap",
  "Target",
] as const;
