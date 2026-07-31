import { addMonths, format, parseISO, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

/** Calendar day from a Date stored as UTC (avoids local TZ shifting the day). */
export function toUtcDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Formats a calendar date for display.
 * For ISO strings, uses the yyyy-MM-dd prefix so UTC midnight
 * (e.g. 2026-07-29T00:00:00.000Z) does not render as the previous day in Brazil.
 */
export function formatDate(date: Date | string, pattern = "dd/MM/yyyy"): string {
  if (typeof date === "string") {
    const dateOnly = date.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
      return format(parseISO(dateOnly), pattern, { locale: ptBR });
    }
  }
  const value = typeof date === "string" ? parseISO(date) : date;
  return format(value, pattern, { locale: ptBR });
}

export function formatMonthYear(date: Date | string): string {
  if (typeof date === "string") {
    const dateOnly = date.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
      return format(parseISO(dateOnly), "MMMM yyyy", { locale: ptBR });
    }
  }
  const value = typeof date === "string" ? parseISO(date) : date;
  return format(value, "MMMM yyyy", { locale: ptBR });
}

/**
 * Month boundaries in UTC, matching how transaction dates are stored
 * (calendar days persisted as UTC noon). A local-time range would shift the
 * boundaries and drop/include the edge days depending on the server timezone.
 */
export function getMonthRange(year: number, month: number) {
  return {
    start: new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0)),
    end: new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)),
  };
}

export function getYearRange(year: number) {
  return {
    start: new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0)),
    end: new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999)),
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
