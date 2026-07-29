import { describe, expect, it } from "vitest";
import {
  advanceRecurrence,
  buildProposalId,
  buildRecurringSeriesKey,
  nextOccurrence,
  occurrencesAfterInRange,
  parseProposalId,
} from "@/utils/recurrence";

describe("recurrence utils", () => {
  it("advances monthly recurrence", () => {
    const next = advanceRecurrence(new Date("2026-07-15T12:00:00.000Z"), "MONTHLY");
    expect(next?.toISOString().slice(0, 10)).toBe("2026-08-15");
  });

  it("finds next occurrence on or after from", () => {
    const due = nextOccurrence(
      new Date("2026-05-10T12:00:00.000Z"),
      "MONTHLY",
      new Date("2026-07-01T00:00:00.000Z"),
    );
    expect(due?.toISOString().slice(0, 10)).toBe("2026-07-10");
  });

  it("lists occurrences strictly after last date inside range", () => {
    const dates = occurrencesAfterInRange(
      new Date("2026-07-15T12:00:00.000Z"),
      "MONTHLY",
      new Date("2026-08-01T00:00:00.000Z"),
      new Date("2026-08-31T23:59:59.999Z"),
    );
    expect(dates).toHaveLength(1);
    expect(dates[0].toISOString().slice(0, 10)).toBe("2026-08-15");
  });

  it("does not include the last occurrence itself", () => {
    const dates = occurrencesAfterInRange(
      new Date("2026-08-15T12:00:00.000Z"),
      "MONTHLY",
      new Date("2026-08-01T00:00:00.000Z"),
      new Date("2026-08-31T23:59:59.999Z"),
    );
    expect(dates).toHaveLength(0);
  });

  it("builds stable series keys and proposal ids", () => {
    const key = buildRecurringSeriesKey({
      type: "EXPENSE",
      title: " Netflix ",
      amount: 55.9,
      accountId: "acc1",
      categoryId: "cat1",
      recurrence: "MONTHLY",
      paymentMethod: "PIX",
    });
    expect(key).toContain("netflix");
    expect(key).toContain("55.90");

    const id = buildProposalId(key, "2026-08-15");
    expect(parseProposalId(id)).toEqual({
      seriesKey: key,
      proposedDate: "2026-08-15",
    });
  });
});
