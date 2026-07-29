import { describe, expect, it } from "vitest";
import {
  formatDate,
  getMonthRange,
  previousMonths,
  toIsoDateOnly,
  toUtcDateOnly,
} from "@/utils/date";

describe("date utils", () => {
  it("returns month range boundaries", () => {
    const range = getMonthRange(2026, 7);
    expect(range.start.getFullYear()).toBe(2026);
    expect(range.start.getMonth()).toBe(6);
    expect(range.start.getDate()).toBe(1);
    expect(range.end.getMonth()).toBe(6);
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
