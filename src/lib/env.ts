const PLACEHOLDER_SECRETS = new Set([
  "change-me-to-a-long-random-string-at-least-32-chars",
  "replace-with-a-long-random-string-at-least-32-chars",
]);

function resolveAuthSecret(): string | undefined {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
}

/**
 * Validates auth secrets. Throws in production when misconfigured;
 * warns in development for placeholder/short secrets.
 */
export function assertAuthSecret(): void {
  const secret = resolveAuthSecret();
  const isProd = process.env.NODE_ENV === "production";

  if (!secret) {
    const message =
      "AUTH_SECRET (or NEXTAUTH_SECRET) is required and must be at least 32 characters";
    if (isProd) throw new Error(message);
    console.warn(`[env] ${message}`);
    return;
  }

  if (secret.length < 32) {
    const message = "AUTH_SECRET must be at least 32 characters";
    if (isProd) throw new Error(message);
    console.warn(`[env] ${message}`);
    return;
  }

  if (PLACEHOLDER_SECRETS.has(secret)) {
    const message =
      "AUTH_SECRET is set to a known placeholder — generate a strong random secret";
    if (isProd) throw new Error(message);
    console.warn(`[env] ${message}`);
  }
}

assertAuthSecret();
