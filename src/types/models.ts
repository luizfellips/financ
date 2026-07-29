import type { PaginationMeta } from "@/types/api";

export type TransactionType = "INCOME" | "EXPENSE";
export type AccountType =
  | "CHECKING"
  | "SAVINGS"
  | "CREDIT"
  | "CASH"
  | "INVESTMENT"
  | "OTHER";
export type PaymentMethod =
  | "CASH"
  | "DEBIT_CARD"
  | "CREDIT_CARD"
  | "PIX"
  | "BANK_TRANSFER"
  | "BOLETO"
  | "OTHER";
export type RecurrenceInterval =
  | "NONE"
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY"
  | "YEARLY";
export type ThemePreference = "LIGHT" | "DARK" | "SYSTEM";
export type NotificationType =
  | "BUDGET_EXCEEDED"
  | "BUDGET_WARNING"
  | "GOAL_REACHED"
  | "BILL_DUE"
  | "SYSTEM";

export type Account = {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  currency: string;
  initialBalance: number;
  balance?: number;
  color: string;
  icon: string;
  isDefault: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Category = {
  id: string;
  userId: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Transaction = {
  id: string;
  userId: string;
  accountId: string;
  categoryId: string;
  type: TransactionType;
  title: string;
  amount: number;
  date: string;
  notes: string | null;
  paymentMethod: PaymentMethod;
  recurrence: RecurrenceInterval;
  isRecurring: boolean;
  installmentNumber: number | null;
  installmentTotal: number | null;
  installmentGroupId: string | null;
  createdAt: string;
  updatedAt: string;
  account?: Pick<Account, "id" | "name" | "color" | "icon">;
  category?: Pick<Category, "id" | "name" | "color" | "icon" | "type">;
};

export type Budget = {
  id: string;
  userId: string;
  categoryId: string;
  month: number;
  year: number;
  limitAmount: number;
  alertAt: number;
  createdAt: string;
  updatedAt: string;
  spent: number;
  remaining: number;
  percent: number;
  category: Pick<Category, "id" | "name" | "color" | "icon" | "type">;
};

export type GoalContribution = {
  id: string;
  goalId: string;
  amount: number;
  note: string | null;
  date: string;
  createdAt: string;
};

export type Goal = {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  deadline: string | null;
  color: string;
  icon: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  percent: number;
  remaining: number;
  averageMonthlyContribution: number;
  estimatedCompletion: string | null;
  contributions: GoalContribution[];
};

export type Settings = {
  id: string;
  userId: string;
  theme: ThemePreference;
  currency: string;
  locale: string;
  monthStartDay: number;
  notifyBudget: boolean;
  notifyGoals: boolean;
  notifyBills: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Notification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type DashboardOverview = {
  kpis: {
    balance: number;
    monthlyIncome: number;
    monthlyExpense: number;
    monthlySavings: number;
    cashflow: number;
    month: number;
    year: number;
  };
  accountBalances: Array<{
    id: string;
    name: string;
    type: AccountType;
    color: string;
    icon: string;
    isDefault: boolean;
    balance: number;
    monthIncome: number;
    monthExpense: number;
    monthVariation: number;
  }>;
  upcomingBills: Array<{
    title: string;
    amount: number;
    dueDate: string;
    category: { id: string; name: string; color: string; icon: string };
    account: { id: string; name: string };
    recurrence: string;
  }>;
  budgetProgress: Array<{
    id: string;
    categoryName: string;
    categoryColor: string;
    limitAmount: number;
    spent: number;
    remaining: number;
    percent: number;
    alertAt: number;
  }>;
  goalProgress: Array<{
    id: string;
    name: string;
    color: string;
    icon: string;
    targetAmount: number;
    savedAmount: number;
    percent: number;
    remaining: number;
    estimatedCompletion: string | null;
    deadline: string | null;
  }>;
  recentTransactions: Transaction[];
};

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

export type RecurringProposalsResponse = {
  month: number;
  year: number;
  proposals: RecurringProposal[];
  summary: {
    total: number;
    income: number;
    expense: number;
    totalAmount: number;
  };
};

export type ReportsData = {
  period: { year: number; month: number };
  monthlyCashFlow: Array<{
    year: number;
    month: number;
    label: string;
    income: number;
    expense: number;
    savings: number;
    cashflow: number;
  }>;
  incomeVsExpenses: {
    income: number;
    expense: number;
    difference: number;
    yearIncome: number;
    yearExpense: number;
    yearSavings: number;
  };
  expensesByCategory: Array<{
    categoryId: string;
    name: string;
    color: string;
    icon: string;
    amount: number;
    percent: number;
  }>;
  savingsTrend: Array<{
    label: string;
    year: number;
    month: number;
    savings: number;
  }>;
  budgetUtilization: Array<{
    id: string;
    categoryName: string;
    categoryColor: string;
    limitAmount: number;
    spent: number;
    remaining: number;
    percent: number;
    alertAt: number;
  }>;
  goalProgress: Array<{
    id: string;
    name: string;
    color: string;
    targetAmount: number;
    savedAmount: number;
    percent: number;
    remaining: number;
    estimatedCompletion: string | null;
    deadline: string | null;
    completedAt: string | null;
  }>;
  summary: {
    accountCount: number;
    transactionCount: number;
    budgetCount: number;
    goalCount: number;
  };
};

export type Paginated<T> = {
  data: T[];
  meta: PaginationMeta;
};

export type TransactionFilters = {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  type?: TransactionType | "ALL";
  categoryId?: string;
  accountId?: string;
  month?: number;
  year?: number;
  minAmount?: number;
  maxAmount?: number;
  recurring?: "true" | "false" | "all";
};
