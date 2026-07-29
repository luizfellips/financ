import {
  addMonths,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatDate(date: Date | string, pattern = "dd/MM/yyyy"): string {
  const value = typeof date === "string" ? parseISO(date) : date;
  return format(value, pattern, { locale: ptBR });
}

export function formatMonthYear(date: Date | string): string {
  const value = typeof date === "string" ? parseISO(date) : date;
  return format(value, "MMMM yyyy", { locale: ptBR });
}

export function getMonthRange(year: number, month: number) {
  const base = new Date(year, month - 1, 1);
  return {
    start: startOfMonth(base),
    end: endOfMonth(base),
  };
}

export function getCurrentMonthYear() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function previousMonths(count: number): Array<{ year: number; month: number; label: string }> {
  const now = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = subMonths(now, count - 1 - index);
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      label: format(date, "MMM/yy", { locale: ptBR }),
    };
  });
}

export function estimateCompletionDate(
  savedAmount: number,
  targetAmount: number,
  averageMonthlyContribution: number,
): Date | null {
  if (averageMonthlyContribution <= 0) return null;
  const remaining = Math.max(0, targetAmount - savedAmount);
  if (remaining === 0) return new Date();
  const monthsNeeded = Math.ceil(remaining / averageMonthlyContribution);
  return addMonths(new Date(), monthsNeeded);
}

export function toIsoDateOnly(date: Date): string {
  return format(date, "yyyy-MM-dd");
}
