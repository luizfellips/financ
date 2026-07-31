import { describe, expect, it } from "vitest";
import {
  formatDate,
  getMonthRange,
  getYearRange,
  previousMonths,
  toIsoDateOnly,
  toUtcDateOnly,
} from "@/utils/date";

describe("date utils", () => {
  it("returns month range boundaries in UTC", () => {
    const range = getMonthRange(2026, 7);
    expect(range.start.toISOString()).toBe("2026-07-01T00:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-07-31T23:59:59.999Z");
  });

  it("covers transactions stored at UTC noon on the month edges", () => {
    const { start, end } = getMonthRange(2026, 7);
    const firstDay = new Date("2026-07-01T12:00:00.000Z");
    const lastDay = new Date("2026-07-31T12:00:00.000Z");
    expect(firstDay >= start && firstDay <= end).toBe(true);
    expect(lastDay >= start && lastDay <= end).toBe(true);
    expect(new Date("2026-08-01T00:00:00.000Z") <= end).toBe(false);
  });

  it("returns year range boundaries in UTC", () => {
    const range = getYearRange(2026);
    expect(range.start.toISOString()).toBe("2026-01-01T00:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-12-31T23:59:59.999Z");
  });

  it("builds previous months list", () => {
    const months = previousMonths(3);
    expect(months).toHaveLength(3);
    expect(months[0]).toHaveProperty("year");
    expect(months[0]).toHaveProperty("month");
    expect(months[0]).toHaveProperty("label");
  });

  it("formats iso date only", () => {
    expect(toIsoDateOnly(new Date(2026, 6, 29))).toBe("2026-07-29");
  });

  it("formats UTC midnight ISO strings without shifting the day", () => {
    expect(formatDate("2026-07-29T00:00:00.000Z")).toBe("29/07/2026");
    expect(formatDate("2026-07-29")).toBe("29/07/2026");
  });

  it("serializes UTC calendar day", () => {
    expect(toUtcDateOnly(new Date("2026-07-29T00:00:00.000Z"))).toBe(
      "2026-07-29",
    );
  });
});
