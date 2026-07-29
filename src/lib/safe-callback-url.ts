/**
 * Returns a same-app relative path suitable for post-login redirects.
 * Rejects open redirects (absolute URLs, protocol-relative, etc.).
 */
export function safeCallbackUrl(raw: string | null | undefined): string {
  if (!raw) return "/dashboard";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  if (raw.includes("\\") || raw.includes("@")) return "/dashboard";

  try {
    const u = new URL(raw, "http://local.invalid");
    if (u.origin !== "http://local.invalid") return "/dashboard";
    return u.pathname + u.search + u.hash;
  } catch {
    return "/dashboard";
  }
}
