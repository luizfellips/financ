export type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSec: number };

type BucketEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, BucketEntry>();

let lastPrune = 0;
const PRUNE_INTERVAL_MS = 60_000;

function prune(now: number) {
  if (now - lastPrune < PRUNE_INTERVAL_MS) return;
  lastPrune = now;
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

/**
 * In-memory fixed-window rate limiter (process-local; resets on restart).
 * Suitable for single-instance deployments.
 */
export function checkRateLimit(
  key: string,
  options: RateLimitOptions,
  now = Date.now(),
): RateLimitResult {
  prune(now);

  const existing = store.get(key);
  if (!existing || existing.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + options.windowMs });
    return { ok: true, remaining: options.limit - 1 };
  }

  if (existing.count >= options.limit) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((existing.resetAt - now) / 1000),
    );
    return { ok: false, retryAfterSec };
  }

  existing.count += 1;
  return { ok: true, remaining: options.limit - existing.count };
}

/** Test helper: clear all buckets. */
export function resetRateLimitStore() {
  store.clear();
  lastPrune = 0;
}

export function clientIp(request: {
  headers: Headers;
}): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}

export function rateLimitResponse(retryAfterSec: number): Response {
  return Response.json(
    {
      success: false,
      error: {
        code: "RATE_LIMITED",
        message: "Muitas tentativas. Tente novamente mais tarde.",
      },
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSec),
      },
    },
  );
}
