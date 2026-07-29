import { afterEach, describe, expect, it } from "vitest";
import { checkRateLimit, resetRateLimitStore } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  afterEach(() => {
    resetRateLimitStore();
  });

  it("allows requests under the limit", () => {
    const key = "test:allow";
    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit(key, { limit: 5, windowMs: 60_000 });
      expect(result.ok).toBe(true);
    }
  });

  it("blocks when the limit is exceeded", () => {
    const key = "test:block";
    const now = 1_000_000;
    for (let i = 0; i < 5; i++) {
      checkRateLimit(key, { limit: 5, windowMs: 60_000 }, now);
    }
    const blocked = checkRateLimit(key, { limit: 5, windowMs: 60_000 }, now);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.retryAfterSec).toBeGreaterThan(0);
    }
  });

  it("resets after the window elapses", () => {
    const key = "test:window";
    const windowMs = 10_000;
    checkRateLimit(key, { limit: 1, windowMs }, 1_000);
    const blocked = checkRateLimit(key, { limit: 1, windowMs }, 1_001);
    expect(blocked.ok).toBe(false);

    const after = checkRateLimit(key, { limit: 1, windowMs }, 1_000 + windowMs + 1);
    expect(after.ok).toBe(true);
  });
});
