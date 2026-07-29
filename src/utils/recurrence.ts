import { addDays, addMonths, startOfDay } from "date-fns";

export type RecurrenceKind =
  | "NONE"
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY"
  | "YEARLY";

export function advanceRecurrence(
  date: Date,
  recurrence: RecurrenceKind | string,
): Date | null {
  switch (recurrence) {
    case "DAILY":
      return addDays(date, 1);
    case "WEEKLY":
      return addDays(date, 7);
    case "MONTHLY":
      return addMonths(date, 1);
    case "YEARLY":
      return addMonths(date, 12);
    default:
      return null;
  }
}

/**
 * First occurrence on or after `from`, walking forward from `lastDate`.
 * Used by dashboard upcoming-bills projection.
 */
export function nextOccurrence(
  lastDate: Date,
  recurrence: RecurrenceKind | string,
  from: Date,
): Date | null {
  let cursor = new Date(lastDate);
  const limit = addMonths(from, 24);
  let guard = 0;

  while (cursor < from && guard < 500) {
    guard += 1;
    const next = advanceRecurrence(cursor, recurrence);
    if (!next) return null;
    cursor = next;
  }

  if (cursor < from || cursor > limit) return null;
  return cursor;
}

/**
 * Occurrences strictly after `lastDate` that fall within `[rangeStart, rangeEnd]`.
 * Used when proposing materializations for a target month.
 */
export function occurrencesAfterInRange(
  lastDate: Date,
  recurrence: RecurrenceKind | string,
  rangeStart: Date,
  rangeEnd: Date,
): Date[] {
  const results: Date[] = [];
  let cursor = new Date(lastDate);
  let guard = 0;

  while (guard < 500) {
    guard += 1;
    const next = advanceRecurrence(cursor, recurrence);
    if (!next) break;
    cursor = next;
    if (cursor > rangeEnd) break;
    if (cursor >= rangeStart) {
      results.push(new Date(cursor));
    }
  }

  return results;
}

export function buildRecurringSeriesKey(input: {
  type: string;
  title: string;
  amount: number | string;
  accountId: string;
  categoryId: string;
  recurrence: string;
  paymentMethod: string;
}): string {
  const amount =
    typeof input.amount === "number"
      ? input.amount.toFixed(2)
      : Number(input.amount).toFixed(2);
  return [
    input.type,
    input.title.trim().toLowerCase(),
    amount,
    input.accountId,
    input.categoryId,
    input.recurrence,
    input.paymentMethod,
  ].join("|");
}

export function buildProposalId(seriesKey: string, proposedDate: string): string {
  return Buffer.from(`${seriesKey}::${proposedDate}`, "utf8").toString(
    "base64url",
  );
}

export function parseProposalId(
  id: string,
): { seriesKey: string; proposedDate: string } | null {
  try {
    const raw = Buffer.from(id, "base64url").toString("utf8");
    const sep = raw.lastIndexOf("::");
    if (sep <= 0) return null;
    const seriesKey = raw.slice(0, sep);
    const proposedDate = raw.slice(sep + 2);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(proposedDate)) return null;
    return { seriesKey, proposedDate };
  } catch {
    return null;
  }
}

export function startOfToday(): Date {
  return startOfDay(new Date());
}
